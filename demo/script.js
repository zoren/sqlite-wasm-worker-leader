export const runDemo = async worker1 => {
	try {
		await worker1.open({})
		console.error('open did not throw as expected')
	} catch (error) {
		console.log('open threw as expected', error, error.cause)
	}
	console.log('config', await worker1.getConfig())
	const db = await worker1.open({ filename: ':memory:' })
	console.log('db', db)
	console.log(
		'exec',
		await db.execArray({ sql: `create table if not exists t1(a, b)` }),
	)
	console.log('exec', await db.execArray({ sql: `delete from t1` }))
	console.log(
		'exec',
		await db.execArray({
			sql: `insert into t1 values(1, 'hello'), (2, 'world')`,
		}),
	)
	console.log('exec', await db.execObject({ sql: 'select a, b from t1' }))
	console.log('selectValue', await db.selectValue('select a from t1 limit 1'))
	console.log('selectValue', await db.selectValue('select b from t1 limit 1'))
	console.log(
		'selectValue',
		await db.selectValue('select $p from t1 limit 1', { $p: 'parameter' }),
	)
	console.log('selectValues', await db.selectValues('select b from t1'))

	console.log('close', await db.close())
}
