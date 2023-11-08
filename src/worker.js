import sqlite3InitModule from '@sqlite.org/sqlite-wasm'

const sqlite3 = await sqlite3InitModule()

const runCommand = d => {
  const { type } = d
  switch (type) {
    case 'open': {
      if (d.simulateError)
        throw new Error('Throwing because of simulateError flag.')
      throw new Error('Not implemented')
    }

    default:
      throw new Error(`runCommand: unknown type: ${type}`)
  }
}

const listener = event => {
  const { data } = event
  const { type } = data
  try {
    postMessage({ type, result: runCommand(data) })
  } catch (error) {
    postMessage({ type: 'error', errorMessage: error.message })
  }
}

addEventListener('message', listener)

const { version } = sqlite3
postMessage({ type: 'ready', version })
