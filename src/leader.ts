import SQLiteWorker from './worker.js?worker'

class SQLiteError extends Error {
  eventData: any
  constructor(message: string, eventData: any) {
    super(message)
    this.eventData = eventData
  }
}

interface Version {
  libVersion: string
  libVersionNumber: number
  sourceId: string
  downloadVersion: number
}

interface Config {
  version: Version
  vfsList: string[]
  opfsEnabled: boolean
  bigIntEnabled: boolean
}

const wrapWorker = (worker: Worker, versionParam: Version) => {
  const version = Object.freeze(versionParam)
  const asyncMap = new Map()
  let counter = 0
  const nextId = () => ++counter

  const listener = (e: MessageEvent) => {
    const { data } = e
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
  worker.addEventListener('message', listener)
  const asyncCommand = <R> (params) : Promise<R> => {
    const id = nextId()
    return new Promise((resolve, reject) => {
      asyncMap.set(id, { resolve, reject })
      worker.postMessage({ ...params, id })
    })
  }
  const wrapDB = (openInfoParam) => {
    const openInfo = Object.freeze(openInfoParam)
    const { dbId } = openInfo
    const asyncCommandDB = (type, paramObj) =>
      asyncCommand({ type, dbId, ...paramObj })
    return Object.freeze({
      openInfo,
      close: () => asyncCommandDB('close', null),
      exec: paramObj => asyncCommandDB('exec', { ...paramObj }),
      selectValue: paramObj => asyncCommandDB('selectValue', { ...paramObj }),
    })
  }
  return Object.freeze({
    version,
    getConfig: () => asyncCommand<Config>({ type: 'getConfig' }),

    open: async paramObj => wrapDB(await asyncCommand({ type: 'open', ...paramObj })),
  })
}

export const initWorker = () =>
  new Promise((resolve, reject) => {
    const worker: Worker = new SQLiteWorker()

    const initListener = ({ data }) => {
      if (data.type !== 'ready')
        reject(new Error('Expected first message to be ready message'))
      worker.removeEventListener('message', initListener)
      // console.log('worker ready SQLite version', data.version)
      resolve(wrapWorker(worker, data.version as Version))
    }
    worker.addEventListener('message', initListener)
  })
