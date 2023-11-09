import { parentPort } from 'node:worker_threads'
// this import only works because we have added to 
// node_modules/@sqlite.org/sqlite-wasm/package.json export section:
// "./jswasm/sqlite3-node.mjs": "./sqlite-wasm/jswasm/sqlite3-node.mjs"
import sqlite3InitModuleNode from '@sqlite.org/sqlite-wasm/jswasm/sqlite3-node.mjs'
import { init } from '../worker.js'

init(
	await sqlite3InitModuleNode(),
	value => parentPort.postMessage(value),
	listener => parentPort.on('message', listener),
)
