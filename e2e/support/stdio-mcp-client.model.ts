export type McpInitializeResult = { protocolVersion: string }

export type McpToolCallResult = {
  structuredContent: Record<string, unknown>
  content?: unknown[]
  isError?: boolean
}

export type McpResponse = {
  jsonrpc: '2.0'
  id?: number
  result?: {
    protocolVersion?: string
    tools?: Array<{ name: string }>
    structuredContent?: Record<string, unknown>
    content?: unknown[]
    isError?: boolean
  }
  error?: { code: number; message: string }
}

export type StdioMcpClient = {
  initialize(): Promise<McpInitializeResult>
  listTools(): Promise<string[]>
  call(name: string, args: Record<string, unknown>): Promise<McpToolCallResult>
  close(): Promise<void>
}
