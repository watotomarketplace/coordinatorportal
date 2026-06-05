const MAX_ENTRIES = 500
const logBuffer = []

function addEntry(level, args) {
  const message = args
    .map(a => (a instanceof Error ? a.stack || a.message : typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ')
  logBuffer.push({ ts: new Date().toISOString(), level, message })
  if (logBuffer.length > MAX_ENTRIES) logBuffer.shift()
}

export function getLogs(limit = 200, level = null) {
  const entries = level ? logBuffer.filter(e => e.level === level) : logBuffer
  return entries.slice(-Math.min(limit, MAX_ENTRIES))
}

export function patchConsole() {
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info }
  console.log   = (...a) => { orig.log(...a);   addEntry('info',  a) }
  console.info  = (...a) => { orig.info(...a);  addEntry('info',  a) }
  console.warn  = (...a) => { orig.warn(...a);  addEntry('warn',  a) }
  console.error = (...a) => { orig.error(...a); addEntry('error', a) }
}
