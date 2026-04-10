import {deepEqual} from "assert"
import {Issue, ToolResult} from "codacy-seed"

import {AgentlinterDiagnostic, convertResults} from "../convertResults"

describe("convertResults", () => {
  it("should convert agentlinter diagnostics to Codacy issues", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
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
        category: "clarity",
        rule: "clarity/no-vague-instructions",
        file: "CLAUDE.md",
        line: 5,
        message: "Vague instruction detected: 'be helpful'"
      }
    ]

    const results = convertResults(diagnostics)
    const expected: ToolResult[] = [
      new Issue(
        "CLAUDE.md",
        "Heading level skipped: h1 → h3. Consider using h2 instead.",
        "structure_heading-hierarchy",
        3
      ),
      new Issue(
        "CLAUDE.md",
        "Vague instruction detected: 'be helpful'",
        "clarity_no-vague-instructions",
        5
      )
    ]

    deepEqual(results, expected)
  })

  it("should filter diagnostics by files list", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
      {
        severity: "info",
        category: "structure",
        rule: "structure/heading-hierarchy",
        file: "CLAUDE.md",
        line: 3,
        message: "Test message"
      },
      {
        severity: "warning",
        category: "clarity",
        rule: "clarity/no-vague-instructions",
        file: "AGENTS.md",
        line: 5,
        message: "Other message"
      }
    ]

    const results = convertResults(diagnostics, ["CLAUDE.md"])
    const expected: ToolResult[] = [
      new Issue("CLAUDE.md", "Test message", "structure_heading-hierarchy", 3)
    ]

    deepEqual(results, expected)
  })

  it("should filter diagnostics by enabled patterns", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
      {
        severity: "info",
        category: "structure",
        rule: "structure/heading-hierarchy",
        file: "CLAUDE.md",
        line: 3,
        message: "Heading issue"
      },
      {
        severity: "warning",
        category: "clarity",
        rule: "clarity/no-vague-instructions",
        file: "CLAUDE.md",
        line: 5,
        message: "Clarity issue"
      }
    ]

    const results = convertResults(diagnostics, undefined, [
      "structure_heading-hierarchy"
    ])
    const expected: ToolResult[] = [
      new Issue("CLAUDE.md", "Heading issue", "structure_heading-hierarchy", 3)
    ]

    deepEqual(results, expected)
  })

  it("should always include workspace-level diagnostics regardless of files filter", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
      {
        severity: "critical",
        category: "structure",
        rule: "structure/has-main-file",
        file: "(workspace)",
        message:
          "No CLAUDE.md or AGENTS.md found. This is the main entry point for your agent."
      }
    ]

    const results = convertResults(diagnostics, ["readme.txt"])
    const expected: ToolResult[] = [
      new Issue(
        "(workspace)",
        "No CLAUDE.md or AGENTS.md found. This is the main entry point for your agent.",
        "structure_has-main-file",
        1
      )
    ]

    deepEqual(results, expected)
  })

  it("should use line 1 when line is undefined", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
      {
        severity: "critical",
        category: "structure",
        rule: "structure/has-main-file",
        file: "(workspace)",
        message: "No CLAUDE.md or AGENTS.md found."
      }
    ]

    const results = convertResults(diagnostics)
    const expected: ToolResult[] = [
      new Issue(
        "(workspace)",
        "No CLAUDE.md or AGENTS.md found.",
        "structure_has-main-file",
        1
      )
    ]

    deepEqual(results, expected)
  })

  it("should pass fix as suggestion", () => {
    const diagnostics: AgentlinterDiagnostic[] = [
      {
        severity: "critical",
        category: "structure",
        rule: "structure/has-main-file",
        file: "(workspace)",
        message: "No CLAUDE.md or AGENTS.md found.",
        fix: "Create a CLAUDE.md file with your agent's core instructions."
      }
    ]

    const results = convertResults(diagnostics)
    const expected: ToolResult[] = [
      new Issue(
        "(workspace)",
        "No CLAUDE.md or AGENTS.md found.",
        "structure_has-main-file",
        1,
        "Create a CLAUDE.md file with your agent's core instructions."
      )
    ]

    deepEqual(results, expected)
  })
})
