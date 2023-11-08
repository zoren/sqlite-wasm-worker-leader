import { initWorker } from './leader.js'

const worker1 = await initWorker()
// const worker2 = await initWorker();

worker1.openSimulateError()
console.log('config', await worker1.getConfig())