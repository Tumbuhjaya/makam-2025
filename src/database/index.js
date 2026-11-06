require('dotenv').config();

const mysql = require('mysql2');

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
// Samakan perilaku dengan server 5.7 lama (sql_mode kosong): query lama memakai
// GROUP BY tidak lengkap & tanggal 0000-00-00 yang ditolak sql_mode default MySQL 8
pool.on('connection', function (conn) {
    conn.query('SET SESSION sql_mode = ?', [process.env.DB_SQL_MODE || '']);
});
module.exports.connection = pool;