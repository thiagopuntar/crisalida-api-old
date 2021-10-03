const { DB_NAME, DB_USER, DB_HOST, DB_PASSWORD } = process.env;
const knex = require("knex");

const db = knex({
  client: "mysql2",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
});

module.exports = db;
