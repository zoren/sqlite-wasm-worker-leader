import SQLiteWorker from './worker.js?worker'

const wrapWorker = worker => {
  const idMap = new Map()
  let counter = 0
  const nextId = () => ++counter

  const listener = e => {
    const { data } = e
    const { type, id } = data

    if (!id) throw new Error('Message has no id')
    const resolveRejectObj = idMap.get(id)
    if (!resolveRejectObj) throw new Error('Message has unknown id: ' + id)
    idMap.delete(id)

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
  worker.addEventListener('message', listener)
  const asyncCommand = params => {
    const id = nextId()
    return new Promise((resolve, reject) => {
      idMap.set(id, { resolve, reject })
      worker.postMessage({ ...params, id })
    })
  }
  return {
    openSimulateError: () =>
      asyncCommand({ type: 'open', simulateError: true }),
    getConfig: () => asyncCommand({ type: 'configGet' }),
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
