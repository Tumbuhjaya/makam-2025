require('dotenv').config()

module.exports.connection = require('knex')({
  client: 'mysql2',
  connection: {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    port : process.env.DB_PORT,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
  },
  // sql_mode sama dengan server 5.7 lama, lihat database/index.js
  pool: {
    afterCreate: function (conn, done) {
      conn.query('SET SESSION sql_mode = ?', [process.env.DB_SQL_MODE || ''], function (err) {
        done(err, conn);
      });
    }
  }
});
