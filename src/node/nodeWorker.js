import { parentPort } from 'node:worker_threads'
import { sqlite3InitModuleNode } from '@sqlite.org/sqlite-wasm'
import { init } from '../worker.js'

init(
	await sqlite3InitModuleNode(),
	value => parentPort.postMessage(value),
	listener => parentPort.on('message', listener),
)
