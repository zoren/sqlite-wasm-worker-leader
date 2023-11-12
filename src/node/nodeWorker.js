import { sqlite3InitModuleNode } from '@sqlite.org/sqlite-wasm'
import { parentPort } from 'node:worker_threads'
import { init } from '../common/worker.js'

init(
	await sqlite3InitModuleNode(),
	value => parentPort.postMessage(value),
	listener => parentPort.on('message', listener),
)
