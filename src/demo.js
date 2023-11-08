import { initWorker } from './leader.js'

const worker1 = await initWorker()

try {
  await worker1.openSimulateError()
  console.error('openSimulateError did not throw as expected')
} catch (error) {
  console.log('openSimulateError threw as expected', error.message)
}
console.log('config', await worker1.getConfig())
