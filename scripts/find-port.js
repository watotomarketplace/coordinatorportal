import { createServer } from 'net'
import { spawn } from 'child_process'

function isPortFree(port) {
    return new Promise(resolve => {
        const s = createServer()
        s.once('error', () => resolve(false))
        s.once('listening', () => { s.close(() => resolve(true)) })
        s.listen(port, '127.0.0.1')
    })
}

let port = 3000
for (const p of [3000, 3001, 3002, 3003, 3004]) {
    if (await isPortFree(p)) { port = p; break }
}
console.log(`[find-port] Using port ${port}`)

const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) }
})
child.on('exit', code => process.exit(code ?? 0))
