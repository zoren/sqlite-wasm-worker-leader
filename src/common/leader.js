export const wrapWorker = (addDataMessageListener, postMessage, versionParam) => {
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
        reject(new Error(errorMessage))
        break
      }
      default: {
        console.warn('Unhandled message from worker', type)
      }
    }
  }
  addDataMessageListener(listener)
  const asyncCommand = (params)=> {
    const id = nextId()
    return new Promise((resolve, reject) => {
      asyncMap.set(id, { resolve, reject })
      postMessage({ ...params, id })
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
      exec: async paramObj => {
        await asyncCommandDB('exec', { ...paramObj })
        return null},
      execArray: paramObj => asyncCommandDB('exec', { rowMode: 'array', ...paramObj }),
      execObject: paramObj => asyncCommandDB('exec', { rowMode: 'object', ...paramObj }),
      selectValue: (sql, bind) => asyncCommandDB('selectValue', { sql, bind }),
      selectValues: (sql, bind, asType) => asyncCommandDB('selectValues', { sql, bind, asType }),
    })
  }
  return Object.freeze({
    version,
    getConfig: () => asyncCommand({ type: 'getConfig' }),
    open: async paramObj => wrapDB(await asyncCommand({ type: 'open', ...paramObj })),
  })
}
