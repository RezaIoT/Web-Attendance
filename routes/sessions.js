const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Get all sessions for current teacher
router.get('/', isAuthenticated, (req, res) => {
    try {
        const sessions = db.getAllSessions(req.session.teacherId);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get active sessions (supports multiple active sessions)
router.get('/active', isAuthenticated, (req, res) => {
    try {
        const sessions = db.getActiveSessions(req.session.teacherId);
        // Return array of active sessions, or single session for backward compatibility
        res.json({
            sessions: sessions,
            count: sessions.length,
            // For backward compatibility, also return the most recent one
            current: sessions.length > 0 ? sessions[0] : null
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
});

// Get session details with attendance
router.get('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const session = db.getSessionById(parseInt(id));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const attendance = db.getSessionAttendance(parseInt(id));
        const students = db.getStudentsForSession(req.session.teacherId, parseInt(id));

        res.json({
            session,
            attendance,
            students,
            summary: {
                total_students: students.length,
                present: attendance.length,
                absent: students.length - attendance.length
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

// Create a new session
router.post('/', isAuthenticated, (req, res) => {
    const { name, passkey } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Session name is required' });
    }

    if (!passkey || passkey.trim() === '') {
        return res.status(400).json({ error: 'Passkey is required' });
    }

    // Check if passkey is already in use by an active session
    const existingSession = db.verifySessionPasskey(passkey.trim());
    if (existingSession) {
        return res.status(400).json({ error: 'This passkey is already in use by another active session' });
    }

    try {
        const result = db.createSession(req.session.teacherId, name.trim(), passkey.trim());
        res.json({
            success: true,
            session: {
                id: result.lastInsertRowid,
                name: name.trim(),
                passkey: passkey.trim(),
                is_active: 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Update session
router.put('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, passkey, is_active } = req.body;

    try {
        const session = db.getSessionById(parseInt(id));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if new passkey is already in use by another active session
        if (passkey && passkey !== session.passkey) {
            const existingSession = db.verifySessionPasskey(passkey.trim());
            if (existingSession && existingSession.id !== parseInt(id)) {
                return res.status(400).json({ error: 'This passkey is already in use by another active session' });
            }
        }

        db.updateSession(parseInt(id), req.session.teacherId, { name, passkey, is_active });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// Toggle session active status
router.post('/:id/toggle', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        const session = db.getSessionById(parseInt(id));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        db.toggleSession(parseInt(id), req.session.teacherId, is_active);
        res.json({ success: true, is_active });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle session' });
    }
});

// Delete session
router.delete('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.deleteSession(parseInt(id), req.session.teacherId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

module.exports = router;
