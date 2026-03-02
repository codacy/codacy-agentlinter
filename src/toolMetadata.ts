export const toolName = "agentlinter"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const agentlinterPackage = require("agentlinter/package.json")
export const toolVersion: string = agentlinterPackage.version as string
