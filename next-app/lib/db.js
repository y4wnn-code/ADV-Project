const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: process.cwd() + '/next-app/.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bloggwatch_dev',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
