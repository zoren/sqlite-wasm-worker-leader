import { initWorker } from './leader.js'

const worker1 = await initWorker()

try {
  await worker1.open({ simulateError: true })
  console.error('open did not throw as expected')
} catch (error) {
  console.log('open threw as expected', error.message)
}
console.log('config', await worker1.getConfig())
const dbHandle = await worker1.open({ filename: ':memory:' })
console.log('dbHandle', dbHandle)