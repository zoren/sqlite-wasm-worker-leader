import SQLiteWorker from './worker.js?worker'

const wrapWorker = worker => {
  const idMap = new Map()
  let counter = 0
  const nextId = () => counter++

  const listener = e => {
    const { data } = e
    console.log(data)
    const { type, id } = data
    switch (type) {
      case 'result': {
        const { result } = data
        console.log('Error from worker', result)
        const { resolve } = idMap.get(id)
        resolve(result)
        break
      }
      case 'error': {
        const { errorMessage } = data
        console.log('Error from worker', errorMessage)
        const { reject } = idMap.get(id)
        reject(new Error(errorMessage))
        break
      }
      default: {
        console.warn('Unhandled message from worker', type)
      }
    }
  }
  worker.addEventListener('message', listener)
  return {
    openSimulateError: () =>
      new Promise((resolve, reject) => {
        const id = nextId()
        idMap.set(id, { resolve, reject })
        worker.postMessage({ type: 'open', id, simulateError: true })
      }),
    getConfig: () =>
      new Promise((resolve, reject) => {
        const id = nextId()
        idMap.set(id, { resolve, reject })
        worker.postMessage({ type: 'configGet', id })
      }),
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
