import {Codacyrc, Engine, ToolResult} from "codacy-seed"
import {execFile} from "child_process"
import {promisify} from "util"

import {configCreator} from "./configCreator"
import {AgentlinterResult, convertResults} from "./convertResults"
import {debug} from "./logging"

const execFileAsync = promisify(execFile)

async function runAgentlinter (workspacePath: string): Promise<AgentlinterResult> {
  const agentlinterBin = require.resolve("agentlinter/dist/bin.js")

  let stdout = ""
  try {
    const result = await execFileAsync(
      "node",
      [agentlinterBin, workspacePath, "--json"],
      {
        cwd: workspacePath,
        maxBuffer: 10 * 1024 * 1024
      }
    )
    stdout = result.stdout
  } catch (error: any) {
    // agentlinter exits with non-zero code when issues are found
    if (error.stdout) {
      stdout = error.stdout as string
    } else {
      throw error
    }
  }

  const result = JSON.parse(stdout) as AgentlinterResult
  return {
    workspace: result.workspace ?? workspacePath,
    diagnostics: result.diagnostics ?? []
  }
}

export const engineImpl: Engine = async function (
  codacyrc?: Codacyrc
): Promise<ToolResult[]> {
  const options = await configCreator(codacyrc)

  const agentlinterResult = await runAgentlinter(options.workspacePath)

  debug(agentlinterResult)

  return convertResults(
    agentlinterResult.diagnostics,
    options.files,
    options.enabledPatterns
  )
}
