import { wrapWorker, SQLiteWorker, Version } from '../leader.js'
import { Worker } from 'node:worker_threads'

export const initWorker = (): Promise<{dbWorker: SQLiteWorker, worker: Worker}> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./nodeWorker.js', import.meta.url))
    const initListener = (data) => {
      if (data.type !== 'ready')
        reject(new Error('Expected first message to be ready message'))
      worker.off('message', initListener)
      const dbWorker = wrapWorker((l)=> worker.on('message', l), (d) => worker.postMessage(d),  data.version as Version)
      resolve({dbWorker, worker})
    }
    worker.on('message', initListener)
  })
