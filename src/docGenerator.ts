import axios from "axios"
import {
  DescriptionEntry,
  PatternSpec,
  Specification,
  writeFile
} from "codacy-seed"
import {promises as fs} from "fs"

import {toolName, toolVersion} from "./toolMetadata"

const GITHUB_REPO = "seojoonkim/agentlinter"
const GITHUB_BRANCH = "main"
const RULES_PATH = "packages/cli/src/engine/rules"

interface RuleData {
  id: string
  severity: "critical" | "error" | "warning" | "info"
  agentlinterCategory: string
  description: string
}

async function fetchRuleFileNames (): Promise<string[]> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${RULES_PATH}?ref=${GITHUB_BRANCH}`
  const response = await axios.get<Array<{name: string; type: string}>>(url)
  return response.data
    .filter((f) => f.type === "file" && f.name.endsWith(".ts") && f.name !== "index.ts")
    .map((f) => f.name)
}

async function fetchRuleFileContent (filename: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${RULES_PATH}/${filename}`
  const response = await axios.get<string>(url, {responseType: "text"})
  return response.data
}

/**
 * Parses Rule objects from a TypeScript rule file source.
 *
 * Each Rule object has `id`, `category`, `severity`, `description` as simple
 * string literals followed by a `check(` method. We extract the four string
 * properties from the region between the rule's opening `{` (which always
 * immediately precedes `id:`) and its `check(` method — so diagnostic objects
 * inside the check body are never accidentally matched.
 */
function parseRulesFromContent (content: string): RuleData[] {
  const rules: RuleData[] = []
  const idPattern = /\bid:\s*["']([^"']+)["']/g
  let match

  while ((match = idPattern.exec(content)) !== null) {
    const id = match[1]
    const idPos = match.index

    // `id` is always the first property in the rule object, so the last `{`
    // before `id:` is the rule's opening brace.
    const ruleStart = content.lastIndexOf("{", idPos)
    if (ruleStart === -1) continue

    // All simple string properties appear before the `check(` method.
    const checkPos = content.indexOf("check(", idPos)
    if (checkPos === -1) continue

    const propsRegion = content.slice(ruleStart, checkPos)

    const categoryMatch = propsRegion.match(/\bcategory:\s*["']([^"']+)["']/)
    const severityMatch = propsRegion.match(/\bseverity:\s*["']([^"']+)["']/)
    const descriptionMatch = propsRegion.match(/\bdescription:\s*["']([^"']+)["']/)

    if (categoryMatch && severityMatch && descriptionMatch) {
      rules.push({
        id,
        severity: severityMatch[1] as "critical" | "error" | "warning" | "info",
        agentlinterCategory: categoryMatch[1],
        description: descriptionMatch[1]
      })
    } else {
      console.warn(`Warning: Could not fully parse rule '${id}' — skipping`)
    }
  }

  return rules
}

async function fetchAllRules (): Promise<RuleData[]> {
  const fileNames = await fetchRuleFileNames()
  console.log(`Found ${fileNames.length} rule files: ${fileNames.join(", ")}`)

  const allRules: RuleData[] = []

  for (const fileName of fileNames) {
    try {
      const content = await fetchRuleFileContent(fileName)
      const rules = parseRulesFromContent(content)
      console.log(`  ${fileName}: ${rules.length} rule(s)`)
      allRules.push(...rules)
    } catch (err) {
      console.warn(`Warning: Failed to process ${fileName}:`, err)
    }
  }

  return allRules
}

function severityToLevel (
  severity: "critical" | "error" | "warning" | "info"
): "Error" | "Warning" | "Info" {
  switch (severity) {
    case "critical":
    case "error":
      return "Error"
    case "warning":
      return "Warning"
    case "info":
      return "Info"
  }
}

function categoryToPatternCategory (
  agentlinterCategory: string
): "Security" | "CodeStyle" {
  if (["security", "skillSafety", "runtime"].includes(agentlinterCategory)) {
    return "Security"
  }
  return "CodeStyle"
}

export class DocGenerator {
  docsPath = "./docs/"

  async createFolderIfNotExists (dir: string): Promise<void> {
    await fs.access(dir).catch(() => fs.mkdir(dir, {recursive: true}))
  }

  async generateSpecification (rules: RuleData[]): Promise<void> {
    const patternSpecs: PatternSpec[] = rules.map((rule) =>
      new PatternSpec(
        rule.id.replace(/\//g, "_"),
        severityToLevel(rule.severity),
        categoryToPatternCategory(rule.agentlinterCategory),
        undefined,
        [],
        true
      )
    )

    const specification = new Specification(toolName, toolVersion, patternSpecs)
    await writeFile(
      this.docsPath + "patterns.json",
      JSON.stringify(specification, null, 2)
    )
  }

  async generatePatternsDescription (rules: RuleData[]): Promise<void> {
    const descriptionEntries = rules.map((rule) => {
      const internalId = rule.id.replace(/\//g, "_")
      const title = `\`${internalId}\` - ${rule.description}`
      return new DescriptionEntry(internalId, title, rule.description, undefined, [])
    })

    await writeFile(
      this.docsPath + "description/description.json",
      JSON.stringify(descriptionEntries, null, 2) + "\n"
    )
  }

  async createDescriptionFiles (rules: RuleData[]): Promise<void> {
    await Promise.all(
      rules.map(async (rule) => {
        const content =
          `# \`${rule.id}\`\n\n` +
          `${rule.description}\n\n` +
          `[Learn more about agentlinter](https://github.com/${GITHUB_REPO})\n`
        const safeId = rule.id.replace(/\//g, "-")
        await writeFile(`${this.docsPath}description/${safeId}.md`, content)
      })
    )
  }

  async generateAllRulesTestPatterns (rules: RuleData[]): Promise<void> {
    const testDir = "./docs/multiple-tests/all-rules/"
    await this.createFolderIfNotExists(testDir)
    const modules = rules.map((r) => `    <module name="${r.id.replace(/\//g, "_")}" />`).join("\n")
    const content = `<module name="root">\n${modules}\n</module>\n`
    await writeFile(testDir + "patterns.xml", content)
  }
}

async function main (): Promise<void> {
  const docGenerator = new DocGenerator()
  await docGenerator.createFolderIfNotExists(docGenerator.docsPath + "description")

  console.log(
    `Fetching agentlinter rules from GitHub (${GITHUB_REPO}@${GITHUB_BRANCH})...`
  )
  const rules = await fetchAllRules()
  console.log(`Total rules found: ${rules.length}`)

  await Promise.all([
    docGenerator.generateSpecification(rules),
    docGenerator.generatePatternsDescription(rules),
    docGenerator.createDescriptionFiles(rules),
    docGenerator.generateAllRulesTestPatterns(rules)
  ])

  console.log("Documentation generated successfully.")
}

main()
