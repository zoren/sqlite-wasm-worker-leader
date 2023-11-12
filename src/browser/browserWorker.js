import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { init } from '../common/worker.js'

init(
	await sqlite3InitModule(),
	value => postMessage(value),
	listener => addEventListener('message', ({ data }) => listener(data)),
)
