const express = require('express');
const bcrypt = require('bcrypt');
const svgCaptcha = require('svg-captcha');
const db = require('../db/db');
const router = express.Router();

// Generate captcha
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        size: 4, // Captcha length
        ignoreChars: '0o1il', // Exclude easily confused characters
        noise: 2, // Number of interference lines
        color: true, // Captcha color
        background: '#f0f0f0' // Background color
    });
    
    // Store captcha text in session
    req.session.captcha = captcha.text.toLowerCase();
    
    // Set response header
    res.type('svg');
    res.status(200).send(captcha.data);
});

// User login
router.post('/', async (req, res) => {
    const { username, password, captcha } = req.body;

    // Validate required fields
    if (!username || !password || !captcha) {
        return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    // Captcha validation (case-insensitive)
    if (!req.session.captcha || captcha.toLowerCase() !== req.session.captcha) {
        return res.status(400).json({ error: 'Captcha is incorrect' });
    }

    // Clear captcha after use to prevent reuse
    req.session.captcha = null;

    try {
        // Query user
        db.query('SELECT user_id, username, password_hash FROM users WHERE username = ?', 
            [username], 
            async (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    return res.status(500).json({ error: 'Server error' });
                }

                // User does not exist
                if (results.length === 0) {
                    return res.status(401).json({ error: 'Incorrect username or password' });
                }

                const user = results[0];

                // Validate password
                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                if (!passwordMatch) {
                    return res.status(401).json({ error: 'Incorrect username or password' });
                }

                // Login successful, set session
                req.session.userId = user.user_id;
                req.session.username = user.username;
                
                // Return success response
                res.json({ 
                    success: true, 
                    message: 'Login successful',
                    user: {
                        id: user.user_id,
                        username: user.username
                    }
                });
            }
        );
    } catch (error) {
        console.error('Login processing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check login status
router.get('/status', (req, res) => {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Successfully logged out' });
    });
});

module.exports = router;