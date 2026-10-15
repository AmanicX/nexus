const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')

app.disableHardwareAcceleration()

const CSP =
  "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.groq.com; font-src 'self' data:; media-src 'self'"

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP],
      },
    })
  })

  const win = new BrowserWindow({ show: false, width: 1200, height: 800 })
  const messages = []
  win.webContents.on('console-message', (a, b, c) => {
    const d = a && typeof a === 'object' ? a : { level: b, message: c }
    messages.push(`${d.level ?? '?'}: ${String(d.message ?? '').slice(0, 200)}`)
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => console.log('FAILLOAD', code, desc))

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await new Promise((r) => setTimeout(r, 2000))

  const title = await win.webContents.executeJavaScript(
    'document.querySelector("h1,h2")?.textContent || document.title',
  )
  const rootChildren = await win.webContents.executeJavaScript(
    'document.getElementById("root").childElementCount',
  )
  const backdrops = await win.webContents.executeJavaScript(
    'getComputedStyle(document.querySelector("[aria-hidden].absolute")||document.body).backgroundImage.slice(0,40)',
  )
  console.log('SMOKE title=', JSON.stringify(title))
  console.log('SMOKE rootChildren=', rootChildren)
  console.log('SMOKE backdrop=', JSON.stringify(backdrops))
  console.log('SMOKE consoleMessages=', messages.length)
  for (const m of messages.slice(0, 12)) console.log('  ', m)
  app.exit(0)
})
