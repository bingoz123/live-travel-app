require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host:     process.env.DB_HOST   || '127.0.0.1',
  user:     process.env.DB_USER   || 'root',
  password: process.env.DB_PASS   || 'root',
  database: process.env.DB_NAME   || 'live_travel'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

module.exports = db;

