const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');

const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.teacherId) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
}

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const teacher = db.findTeacherByUsername(username);
    if (!teacher) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = bcrypt.compareSync(password, teacher.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.teacherId = teacher.id;
    req.session.username = teacher.username;

    res.json({
        success: true,
        user: {
            id: teacher.id,
            username: teacher.username,
            name: teacher.name
        }
    });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

// Check authentication status
router.get('/status', (req, res) => {
    if (req.session && req.session.teacherId) {
        const teacher = db.findTeacherById(req.session.teacherId);
        if (teacher) {
            return res.json({
                authenticated: true,
                user: teacher
            });
        }
    }
    res.json({ authenticated: false });
});

// Change password
router.post('/change-password', isAuthenticated, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const teacher = db.findTeacherByUsername(req.session.username);
    const isValid = bcrypt.compareSync(currentPassword, teacher.password);

    if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    db.updateTeacherPassword(req.session.teacherId, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = router;
module.exports.isAuthenticated = isAuthenticated;
