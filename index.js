const {Client} = require('pg');

const client = new Client({
	user: 'postgres',
	password: 'postgres',
	host: 'Eugene',
	port: 5432,
	database: 'husseindb'
});

client.connect()
	.then(() => console.log('Connected successfully'))
	.catch(e => console.log(e))
	.finally(() => client.end());