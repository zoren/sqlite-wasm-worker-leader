import { Worker } from 'node:worker_threads'
import { wrapWorker } from '../common/leader.js'

export const initWorker = ()=>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./nodeWorker.js', import.meta.url))
    const initListener = (data) => {
      if (data.type !== 'ready')
        reject(new Error('Expected first message to be ready message'))
      worker.off('message', initListener)
      const dbWorker = wrapWorker((l)=> worker.on('message', l), (d) => worker.postMessage(d),  data.version)
      resolve({dbWorker, worker})
    }
    worker.on('message', initListener)
  })
