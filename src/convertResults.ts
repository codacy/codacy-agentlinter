import {Issue} from "codacy-seed"

export interface AgentlinterDiagnostic {
  severity: string
  category: string
  rule: string
  file: string
  line?: number
  message: string
  fix?: string
}

export interface AgentlinterResult {
  workspace: string
  diagnostics: AgentlinterDiagnostic[]
}

export function convertResults (
  diagnostics: AgentlinterDiagnostic[],
  files?: string[],
  enabledPatterns?: string[]
): Issue[] {
  return diagnostics
    .filter(
      (d) => d.file === "(workspace)" || !files || files.includes(d.file)
    )
    .filter((d) => !enabledPatterns || enabledPatterns.includes(d.rule))
    .map((d) => {
      const lineNumber = d.line ?? 1
      const suggestion = d.fix ?? undefined
      return new Issue(d.file, d.message, d.rule, lineNumber, suggestion)
    })
}
