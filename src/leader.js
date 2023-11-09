import SQLiteWorker from './worker.js?worker'

const wrapWorker = worker => {
  const asyncMap = new Map()
  let counter = 0
  const nextId = () => ++counter

  const listener = e => {
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
        reject(new Error(errorMessage, { cause: data }))
        break
      }
      default: {
        console.warn('Unhandled message from worker', type)
      }
    }
  }
  worker.addEventListener('message', listener)
  const asyncCommand = params => {
    const id = nextId()
    return new Promise((resolve, reject) => {
      asyncMap.set(id, { resolve, reject })
      worker.postMessage({ ...params, id })
    })
  }
  const wrapDB = openInfoParam => {
    const openInfo = Object.freeze(openInfoParam)
    const { dbId } = openInfo
    const asyncCommandDB = (type, paramObj) =>
      asyncCommand({ type, dbId, ...paramObj })
    return Object.freeze({
      getInfo: () => openInfo,
      close: () => asyncCommandDB('close', null),
      exec: paramObj => asyncCommandDB('exec', { ...paramObj }),
      selectValue: paramObj => asyncCommandDB('selectValue', { ...paramObj }),
    })
  }
  return {
    // general, does not require dbId
    getConfig: () => asyncCommand({ type: 'getConfig' }),

    open: async paramObj => wrapDB(await asyncCommand({ type: 'open', ...paramObj })),
    close: dbId => asyncCommand({ type: 'close', dbId }),
    exec: paramObj => asyncCommand({ type: 'exec', ...paramObj }),
    selectValue: paramObj => asyncCommand({ type: 'selectValue', ...paramObj }),
  }
}

export const initWorker = () =>
  new Promise((resolve, reject) => {
    const worker = new SQLiteWorker()

    const initListener = ({ data }) => {
      if (data.type !== 'ready')
        reject(new Error('Expected first message to be ready message'))
      worker.removeEventListener('message', initListener)
      console.log('worker ready SQLite version', data.version)
      resolve(wrapWorker(worker))
    }
    worker.addEventListener('message', initListener)
  })
