
/*
 * GET home page.
 */
// import database
require('dotenv').config()

 var mysql      = require('mysql');

module.exports.connection = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  port	   : process.env.DB_PORT,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
});
