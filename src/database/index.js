require('dotenv').config();

const mysql = require('mysql');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 100, 
    waitForConnections: true,
    queueLimit: 0
});
module.exports.connection = pool;