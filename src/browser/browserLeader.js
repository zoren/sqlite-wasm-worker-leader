import { wrapWorker } from '../common/leader.js'

export const initWorker = () =>
  new Promise((resolve, reject) => {
    const url = new URL('./browserWorker.js', import.meta.url)
    const worker = new Worker(url, { type: 'module' })

    const initListener = ({ data }) => {
      if (data.type !== 'ready')
        reject(new Error('Expected first message to be ready message'))
      worker.removeEventListener('message', initListener)
      const dbWorker = wrapWorker(
        (l) => worker.addEventListener('message', (e) => l(e.data)),
        (d) => worker.postMessage(d),
        data.version)
      resolve({ dbWorker, worker })
    }
    worker.addEventListener('message', initListener)
  })
