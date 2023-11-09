import type { FlexibleString, SqlValue, BindingSpec, SQLiteDataType } from '@sqlite.org/sqlite-wasm'

class SQLiteError extends Error {
  eventData: any
  constructor(message: string, eventData: any) {
    super(message)
    this.eventData = eventData
  }
}

export interface Version {
  libVersion: string
  libVersionNumber: number
  sourceId: string
  downloadVersion: number
}

export interface Config {
  version: Version
  vfsList: string[]
  opfsEnabled: boolean
  bigIntEnabled: boolean
}

export interface OpenInfo {
  filename: string
  persistent: boolean
  dbId: string
  vfs: string
}

export interface DB {
  openInfo: OpenInfo
  close: () => Promise<void>
  exec: (params: { sql: FlexibleString, rowMode?: 'array' | 'object' }) => Promise<null>
  execArray: (params: { sql: FlexibleString }) => Promise<any[]>
  execObject: (params: { sql: FlexibleString }) => Promise<any[]>
  selectValue: (sql: FlexibleString, bind?: BindingSpec) => Promise<SqlValue | undefined>
  selectValues: (sql: FlexibleString, bind?: BindingSpec, asType?: SQLiteDataType) => Promise<SqlValue[]>
}

export interface SQLiteWorker {
  version: Version
  getConfig: () => Promise<Config>
  open: (options: { filename?: string; flags?: string; vfs?: string }) => Promise<DB>
}

export const wrapWorker = (addDataMessageListener: (_: any)=>void, postMessage: (_: any) => void, versionParam: Version): SQLiteWorker => {
  const version = Object.freeze(versionParam)
  const asyncMap = new Map()
  let counter = 0
  const nextId = () => ++counter

  const listener = (data) => {
    const { type, id } = data

    if (!id) throw new Error('Message has no id')
    const resolveRejectObj = asyncMap.get(id)
    if (!resolveRejectObj) throw new Error('Message has unknown id: ' + id)
    asyncMap.delete(id)

    switch (type) {
      case 'result': {
        const { result } = data
        const { resolve } = resolveRejectObj
        resolve(result)
        break
      }
      case 'error': {
        const { errorMessage } = data
        const { reject } = resolveRejectObj
        reject(new SQLiteError(errorMessage, data))
        break
      }
      default: {
        console.warn('Unhandled message from worker', type)
      }
    }
  }
  addDataMessageListener(listener)
  const asyncCommand = <R> (params) : Promise<R> => {
    const id = nextId()
    return new Promise((resolve, reject) => {
      asyncMap.set(id, { resolve, reject })
      postMessage({ ...params, id })
    })
  }
  const wrapDB = (openInfoParam: OpenInfo): Readonly<DB> => {
    const openInfo = Object.freeze(openInfoParam)
    const { dbId } = openInfo
    const asyncCommandDB = <R> (type, paramObj) =>
      asyncCommand<R>({ type, dbId, ...paramObj })
    return Object.freeze({
      openInfo,
      close: () => asyncCommandDB<void>('close', null),
      exec: async paramObj => {
        await asyncCommandDB('exec', { ...paramObj })
        return null},
      execArray: paramObj => asyncCommandDB<any[][]>('exec', { rowMode: 'array', ...paramObj }),
      execObject: paramObj => asyncCommandDB<any[]>('exec', { rowMode: 'object', ...paramObj }),
      selectValue: (sql, bind) => asyncCommandDB<SqlValue>('selectValue', { sql, bind }),
      selectValues: (sql, bind, asType) => asyncCommandDB<SqlValue[]>('selectValues', { sql, bind, asType }),
    })
  }
  return Object.freeze({
    version,
    getConfig: () => asyncCommand<Config>({ type: 'getConfig' }),
    open: async paramObj => wrapDB(await asyncCommand<OpenInfo>({ type: 'open', ...paramObj })),
  })
}
