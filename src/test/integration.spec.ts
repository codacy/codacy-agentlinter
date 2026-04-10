import {deepStrictEqual} from "assert"
import {Issue, ToolResult} from "codacy-seed"

import {convertResults} from "../convertResults"

describe("agentlinter integration", () => {
  it("should convert workspace-level diagnostic to issue", () => {
    const diagnostics = [
      {
        severity: "critical",
        category: "structure",
        rule: "structure/has-main-file",
        file: "(workspace)",
        message:
          "No CLAUDE.md or AGENTS.md found. This is the main entry point for your agent.",
        fix: "Create a CLAUDE.md file with your agent's core instructions."
      }
    ]

    const results = convertResults(diagnostics)
    const expected: ToolResult[] = [
      new Issue(
        "(workspace)",
        "No CLAUDE.md or AGENTS.md found. This is the main entry point for your agent.",
        "structure_has-main-file",
        1,
        "Create a CLAUDE.md file with your agent's core instructions."
      )
    ]

    deepStrictEqual(results, expected)
  })

  it("should filter by patterns when specified", () => {
    const diagnostics = [
      {
        severity: "info",
        category: "structure",
        rule: "structure/heading-hierarchy",
        file: "CLAUDE.md",
        line: 3,
        message: "Heading level skipped: h1 → h3. Consider using h2 instead."
      },
      {
        severity: "warning",
        category: "structure",
        rule: "structure/has-sections",
        file: "CLAUDE.md",
        message: "Only 1 section(s) found. Use ## headings to organize."
      }
    ]

    const results = convertResults(diagnostics, undefined, [
      "structure_heading-hierarchy"
    ])
    const expected: ToolResult[] = [
      new Issue(
        "CLAUDE.md",
        "Heading level skipped: h1 → h3. Consider using h2 instead.",
        "structure_heading-hierarchy",
        3
      )
    ]

    deepStrictEqual(results, expected)
  })
})
