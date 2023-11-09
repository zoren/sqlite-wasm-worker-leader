# sqlite-wasm-worker-leader

This is a simple library to run SQLite in a Web Worker.

## Usage

```js
import { initWorker } from 'sqlite-wasm-worker-leader';

const worker1 = await initWorker()

try {
  await worker1.open({})
  console.error('open did not throw as expected')
} catch (error) {
  console.log('open threw as expected', error, error.cause)
}
console.log('config', await worker1.getConfig())
const db = await worker1.open({ filename: 'tset', vfs: 'opfs' })
console.log('db', db)
console.log('exec', await db.execArray({ sql: `create table if not exists t1(a, b)` }))
console.log('exec', await db.execArray({ sql: `delete from t1` }))
console.log('exec', await db.execArray({ sql: `insert into t1 values(1, 'hello'), (2, 'world')` }))
console.log('exec', await db.execObject({ sql: "select a, b from t1" }))
console.log('selectValue', await db.selectValue({ sql: "select a from t1 limit 1" }))
console.log('selectValue', await db.selectValue({ sql: "select b from t1 limit 1" }))
console.log(await db.close())
```

## Some links used in the making of this library

on typescript npm packages:
https://spfx-app.dev/create-your-npm-package-with-typescript-in-a-few-minutes
