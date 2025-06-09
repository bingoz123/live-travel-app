const express = require('express');
const db = require('../db/db');
const bcrypt = require('bcrypt');
const router = express.Router();

// 1. Add new user
router.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send('Missing required fields');
    }
    const password_hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, password_hash],
        (err, result) => {
            if (err) return res.status(500).send('Add failed: ' + err.message);
            res.send('User added successfully');
        });
});

// 2. Delete user
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, result) => {
        if (err) return res.status(500).send('Delete failed: ' + err.message);
        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.send('User deleted successfully');
    });
});

// 3. List all registered users
router.get('/users', (req, res) => {
    db.query('SELECT user_id, username, email, created_at FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });
        res.json(results);
    });
});

// 4. Edit specified user details
router.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;
    db.query('UPDATE users SET username=?, email=? WHERE user_id=?',
        [username, email, userId],
        (err, result) => {
            if (err) return res.status(500).send('Update failed: ' + err.message);
            if (result.affectedRows === 0) return res.status(404).send('User not found');
            res.send('User information updated successfully');
        });
});

// 5. 搜索用户（模糊查询用户名或邮箱）
// admin.js 中
router.get('/search', (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) return res.status(400).send('Missing keyword');

    const sql = `
        SELECT user_id AS user_id, username, email FROM users 
        WHERE username LIKE ? OR email LIKE ?
    `;
    const like = `%${keyword}%`;
    db.query(sql, [like, like], (err, results) => {
        if (err) {
            console.error('Search error:', err.message);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});


module.exports = router;