import sqlite3InitModule from '@sqlite.org/sqlite-wasm'

const sqlite3 = await sqlite3InitModule()
const { version, config, opfs, capi, oo1 } = sqlite3

let idSeq = 1
const idMap = new WeakMap()

const getDbId = db => {
  let id = idMap.get(db)
  if (id) return id
  id = 'db#' + ++idSeq + '@' + db.pointer

  idMap.set(db, id)
  return id
}

const dbs = new Map()

const runCommand = d => {
  const { type } = d
  switch (type) {
    case 'open': {
      const { simulateError } = d
      if (simulateError)
        throw new Error('Throwing because of simulateError flag.')
      const { filename } = d

      if (typeof filename !== 'string') throw new Error('filename is missing')
      if (filename.length !== 0 && !filename.startsWith(':'))
        throw new Error('filename is not special')
      const db = new oo1.DB(d)
      const dbId = getDbId(db)
      dbs.set(dbId, db)
      return {
        filename,
        persistent: !!capi.sqlite3_js_db_uses_vfs(db.pointer, 'opfs'),
        dbId,
        vfs: db.dbVfsName(),
      }
    }
    case 'close': {
      const { dbId, unlink } = d
      if (typeof unlink !== 'undefined') throw new Error('unlink not supported, db not closed')
      const db = dbs.get(dbId)
      if (!db) throw new Error(`close: unknown dbId: ${dbId}`)
      const filename = db.filename
      db.close()
      dbs.delete(dbId)
      return { filename }
    }
    case 'exec': {
      const { dbId, sql, rowMode } = d
      if (typeof sql !== 'string') throw new Error('sql is missing')
      if (rowMode === 'stmt') throw new Error('rowMode stmt not supported in worker')
      const db = dbs.get(dbId)
      if (!db) throw new Error(`exec: unknown dbId: ${dbId}`)
      return db.exec(d)
    }
    case 'getConfig':
      return {
        version,
        vfsList: capi.sqlite3_js_vfs_list(),
        opfsEnabled: !!opfs,
        bigIntEnabled: config.bigIntEnabled,
      }
    default:
      throw new Error(`runCommand: unknown type: ${type}`)
  }
}

const listener = event => {
  const { data } = event
  const { type, id } = data
  const resultObj = { inType: type, id }
  try {
    resultObj.result = runCommand(data)
    resultObj.type = 'result'
  } catch (error) {
    const { message, name, stack } = error
    resultObj.errorMessage = message
    resultObj.type = 'error'
    resultObj.errorClass = name
    resultObj.stack = typeof stack === 'string' ? stack.split(/\n\s*/) : stack
  }
  postMessage(resultObj)
}

addEventListener('message', listener)

postMessage({ type: 'ready', version })
