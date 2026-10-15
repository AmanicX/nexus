import { spawn } from 'node:child_process'
import electronPath from 'electron'
import { createServer } from 'vite'

const server = await createServer()
await server.listen()
server.printUrls()

const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5173/'

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
})

let closing = false
async function shutdown() {
  if (closing) return
  closing = true
  try {
    await server.close()
  } catch {
    /* ignore */
  }
  if (!child.killed) child.kill()
}

child.on('close', async () => {
  await shutdown()
  process.exit(0)
})
process.on('SIGINT', () => shutdown().then(() => process.exit(0)))
process.on('SIGTERM', () => shutdown().then(() => process.exit(0)))
