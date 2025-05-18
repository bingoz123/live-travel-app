const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
<<<<<<< HEAD
    password: 'root',
=======
    password: 'Nishi12345678',
>>>>>>> f7eb7de75c5f3eaa27b2c841ee68306d6beae30d
    database: 'live_travel'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

module.exports = db;
