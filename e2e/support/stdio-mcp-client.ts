import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import type { McpResponse, McpToolCallResult, StdioMcpClient } from './stdio-mcp-client.model'

const MAX_FRAME_BYTES = 6_356_992
const MAX_STDERR_BYTES = 65_536
const REQUEST_TIMEOUT_MS = 30_000

export const composeLocalThemeCommand = [
  'docker', 'compose', '-f', 'compose.dev.yaml', 'exec', '-T',
  '-e', 'APP_ENV=local', '-e', 'FTB_LOCAL_MCP_ENABLED=true', 'demo-php', 'php', 'artisan', 'ftb:mcp',
]

class JsonRpcStdioClient implements StdioMcpClient {
  private readonly child: ChildProcessWithoutNullStreams
  private readonly pending = new Map<number, { resolve: (response: McpResponse) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>()
  private stdoutBuffer = ''
  private stderrBuffer = ''
  private requestId = 0
  private closed = false

  constructor(command: string[]) {
    this.child = spawn(command[0], command.slice(1), { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] })
    this.child.stdout.setEncoding('utf8')
    this.child.stderr.setEncoding('utf8')
    this.child.stdout.on('data', (chunk: string) => this.receive(chunk))
    this.child.stderr.on('data', (chunk: string) => {
      if (Buffer.byteLength(this.stderrBuffer) + Buffer.byteLength(chunk) > MAX_STDERR_BYTES) this.fail(new Error('MCP stderr exceeded its bound.'))
      else this.stderrBuffer += chunk
    })
    this.child.on('error', (error) => this.fail(error))
    this.child.on('close', (code) => {
      this.closed = true
      if (code !== 0) this.fail(new Error(`MCP process exited with ${code}; stderr bytes=${Buffer.byteLength(this.stderrBuffer)}.`))
      else this.fail(new Error('MCP process closed before a response arrived.'))
    })
  }

  async initialize(): Promise<{ protocolVersion: string }> {
    const result = await this.request('initialize', {
      protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'ftb022-playwright', version: '1' },
    })
    this.notify('notifications/initialized')
    if (!result.protocolVersion) throw new Error('MCP initialize response omitted protocolVersion.')
    return { protocolVersion: result.protocolVersion }
  }

  async listTools(): Promise<string[]> {
    const result = await this.request('tools/list', {})
    return (result.tools ?? []).map((tool) => tool.name)
  }

  async call(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    const result = await this.request('tools/call', { name, arguments: args })
    if (!result.structuredContent) throw new Error(`MCP tool ${name} omitted structuredContent.`)
    return { structuredContent: result.structuredContent, content: result.content, isError: result.isError }
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.child.stdin.end()
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('MCP process did not exit after stdin EOF.')), 5_000)
      this.child.once('close', (code) => {
        clearTimeout(timer)
        if (code === 0 && this.stderrBuffer.length === 0) resolve()
        else reject(new Error(`MCP process close failed; exit=${code}, stderr bytes=${Buffer.byteLength(this.stderrBuffer)}.`))
      })
    })
  }

  private request(method: string, params: Record<string, unknown>): Promise<NonNullable<McpResponse['result']>> {
    const id = ++this.requestId
    const message = JSON.stringify({ jsonrpc: '2.0', id, method, params })
    if (Buffer.byteLength(message) + 1 > MAX_FRAME_BYTES) return Promise.reject(new Error('MCP request exceeded its bound.'))
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`MCP request ${method} timed out.`))
      }, REQUEST_TIMEOUT_MS)
      this.pending.set(id, {
        resolve: (response) => {
          if (response.error) reject(new Error(`MCP request failed: ${response.error.message}`))
          else if (response.result) resolve(response.result)
          else reject(new Error(`MCP request ${method} omitted result.`))
        }, reject, timer,
      })
      this.child.stdin.write(`${message}\n`, (error) => { if (error) this.fail(error) })
    })
  }

  private notify(method: string): void {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`)
  }

  private receive(chunk: string): void {
    this.stdoutBuffer += chunk
    if (Buffer.byteLength(this.stdoutBuffer) > MAX_FRAME_BYTES && !this.stdoutBuffer.includes('\n')) {
      this.fail(new Error('MCP stdout frame exceeded its bound.'))
      return
    }
    let newline = this.stdoutBuffer.indexOf('\n')
    while (newline >= 0) {
      const line = this.stdoutBuffer.slice(0, newline)
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1)
      if (Buffer.byteLength(line) > MAX_FRAME_BYTES) { this.fail(new Error('MCP stdout frame exceeded its bound.')); return }
      try {
        const response = JSON.parse(line) as McpResponse
        if (response.id === undefined) { this.fail(new Error('MCP stdout contained a response without an id.')); return }
        const pending = this.pending.get(response.id)
        if (!pending) { this.fail(new Error('MCP stdout contained an unexpected response id.')); return }
        this.pending.delete(response.id)
        clearTimeout(pending.timer)
        pending.resolve(response)
      } catch (error) { this.fail(error instanceof Error ? error : new Error('Invalid MCP stdout JSON.')); return }
      newline = this.stdoutBuffer.indexOf('\n')
    }
  }

  private fail(error: Error): void {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    this.pending.clear()
    if (!this.closed) this.child.kill('SIGTERM')
  }
}

export async function startStdioMcpClient(command: string[] = composeLocalThemeCommand): Promise<StdioMcpClient> {
  return new JsonRpcStdioClient(command)
}
