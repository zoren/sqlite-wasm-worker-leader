import sqlite3InitModule from '@sqlite.org/sqlite-wasm'

const sqlite3 = await sqlite3InitModule()
const { version } = sqlite3

const runCommand = d => {
  const { type } = d
  switch (type) {
    case 'open': {
      if (d.simulateError)
        throw new Error('Throwing because of simulateError flag.')
      throw new Error('Not implemented')
    }
    case 'configGet': {
      const result = {
        // bigIntEnabled: sqlite3.config,
        version,
        vfsList: sqlite3.capi.sqlite3_js_vfs_list(),
        opfsEnabled: !!sqlite3.opfs,
      }
      return result
    }
    default:
      throw new Error(`runCommand: unknown type: ${type}`)
  }
}

const listener = event => {
  const { data } = event
  const { type, id } = data
  try {
    postMessage({ type: 'result', inType: type, id, result: runCommand(data) })
  } catch (error) {
    postMessage({
      type: 'error',
      inType: type,
      id,
      errorMessage: error.message,
    })
  }
}

addEventListener('message', listener)

postMessage({ type: 'ready', version })
