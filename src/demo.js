import { initWorker } from './leader.js'

const worker1 = await initWorker()

try {
  await worker1.open({ simulateError: true })
  console.error('open did not throw as expected')
} catch (error) {
  console.log('open threw as expected', error, error.cause)
}
console.log('config', await worker1.getConfig())
const dbHandle = await worker1.open({ filename: 'tset', vfs: 'opfs' })
console.log('dbHandle', dbHandle)
const { dbId } = dbHandle
console.log('exec', await worker1.exec({ dbId, sql: `create table if not exists t1(a, b)` }))
console.log('exec', await worker1.exec({ dbId, sql: `insert into t1 values(1, 'hello'), (2, 'world')` }))
console.log('exec', await worker1.exec({ dbId, sql: "select a, b from t1", rowMode: 'object' }))
console.log('selectValue', await worker1.selectValue({ dbId, sql: "select a from t1 limit 1" }))
console.log('selectValue', await worker1.selectValue({ dbId, sql: "select b from t1 limit 1" }))
console.log(await worker1.close(dbId))
