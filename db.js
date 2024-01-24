require('dotenv').config();
const database_password = process.env.DATABASE_PASSWORD; 
const database_url = process.env.DATABASE_URL;
const database_host = process.env.DATABASE_HOST;

//library for linking to the database
const db = require('knex')({
  client: 'pg',
  connection: {
    connectionString: database_url,
    host: database_host,
    port: 5432,
    user: "input_hours_user",
    database: "input_hours",
    password: database_password,
    ssl: { rejectUnauthorized: false }
  }
});

module.exports = db;