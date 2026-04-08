const mysql = require('mysql2');
require('dotenv').config();
// console.log("Check Env Password:", process.env.DB_PASSWORD);
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // password: '123456' || '',

    database: process.env.DB_NAME || 'smart_home_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();