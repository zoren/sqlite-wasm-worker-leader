const __selectFirstRow = (db, sql, bind, ...getArgs) => {
	const stmt = db.prepare(sql)
	try {
		const rc = stmt.bind(bind).step() ? stmt.get(...getArgs) : undefined
		stmt.reset()
		return rc
	} finally {
		stmt.finalize()
	}
}

export const init = (sqlite3, postMessage, addDataMessageListener) => {
	const { version, config, opfs, capi, oo1 } = sqlite3

	let idSeq = 1
	const idMap = new WeakMap()

	const getDbId = db => {
		let id = idMap.get(db)
		if (id) return id
		id = 'db#' + ++idSeq + '@' + db.pointer

		idMap.set(db, id)
		return id
	}

	const dbs = new Map()

	const runCommand = d => {
		const { type } = d
		switch (type) {
			case 'getConfig':
				return {
					version,
					vfsList: capi.sqlite3_js_vfs_list(),
					opfsEnabled: !!opfs,
					bigIntEnabled: config.bigIntEnabled,
				}
			// db specific
			case 'open': {
				const { filename } = d
				if (typeof filename !== 'string') throw new Error('filename is missing')
				const db = new oo1.DB(d)
				const dbId = getDbId(db)
				dbs.set(dbId, db)
				return {
					filename,
					persistent: !!capi.sqlite3_js_db_uses_vfs(db.pointer, 'opfs'),
					dbId,
					vfs: db.dbVfsName(),
				}
			}
			case 'close': {
				const { dbId } = d
				const db = dbs.get(dbId)
				if (!db) throw new Error(`close: unknown dbId: ${dbId}`)
				db.close()
				dbs.delete(dbId)
				return null
			}
			case 'exec': {
				const { dbId, sql, rowMode } = d
				if (typeof sql !== 'string') throw new Error('sql is missing')
				if (rowMode === 'stmt')
					throw new Error('rowMode stmt not supported in worker')
				const db = dbs.get(dbId)
				if (!db) throw new Error(`exec: unknown dbId: ${dbId}`)
				return db.exec(d)
			}
			case 'selectValue': {
				const { dbId, sql, bind, asType } = d
				const db = dbs.get(dbId)
				if (!db) throw new Error(`selectValue: unknown dbId: ${dbId}`)
				return __selectFirstRow(db, sql, bind, 0, asType)
			}
			case 'selectValues': {
				const { dbId, sql, bind, asType } = d
				const db = dbs.get(dbId)
				const stmt = db.prepare(sql),
					rc = []
				try {
					stmt.bind(bind)
					while (stmt.step()) rc.push(stmt.get(0, asType))
					stmt.reset()
				} finally {
					stmt.finalize()
				}
				return rc
			}
			default:
				throw new Error(`runCommand: unknown type: ${type}`)
		}
	}

	const listener = data => {
		const { type, id } = data
		const resultObj = { inType: type, id }
		try {
			resultObj.result = runCommand(data)
			resultObj.type = 'result'
		} catch (error) {
			const { message, name, stack } = error
			resultObj.errorMessage = message
			resultObj.type = 'error'
			resultObj.errorClass = name
			resultObj.stack = typeof stack === 'string' ? stack.split(/\n\s*/) : stack
		}
		postMessage(resultObj)
	}

	addDataMessageListener(listener)

	postMessage({ type: 'ready', version })
}
