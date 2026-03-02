import {Codacyrc} from "codacy-seed"

import {debug} from "./logging"

export interface AgentlinterOptions {
  workspacePath: string
  files: string[] | undefined
  enabledPatterns: string[] | undefined
}

export async function configCreator (codacyrc?: Codacyrc): Promise<AgentlinterOptions> {
  debug("config: creating")

  const workspacePath = process.cwd()

  const files =
    codacyrc?.files && codacyrc.files.length ? codacyrc.files : undefined

  const enabledPatterns =
    codacyrc?.tools?.[0]?.patterns?.length
      ? codacyrc.tools[0].patterns.map((p) => p.patternId)
      : undefined

  const options: AgentlinterOptions = {workspacePath, files, enabledPatterns}

  debug(options)
  debug("config: finished")
  return options
}
