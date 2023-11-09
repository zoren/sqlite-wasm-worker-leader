import { initWorker } from '../lib/node/nodeLeader.js'
import { runDemo } from './script.js'

const { worker, dbWorker } = await initWorker()
await runDemo(dbWorker)
worker.terminate()
console.log('Done')
