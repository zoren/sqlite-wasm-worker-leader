import { parentPort } from 'node:worker_threads'
import sqlite3InitModuleNode from '../../node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-node.mjs'
import { init } from '../worker.js'

init(
	await sqlite3InitModuleNode(),
	value => parentPort.postMessage(value),
	listener => parentPort.on('message', listener),
)
