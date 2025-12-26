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

        // Get students based on module or teacher
        let students;
        if (session.module_id) {
            students = db.getStudentsForSession(session.module_id, parseInt(id));
        } else {
            students = db.getStudentsForSessionByTeacher(req.session.teacherId, parseInt(id));
        }

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
        console.error('Failed to fetch session:', err);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

// Create a new session
router.post('/', isAuthenticated, (req, res) => {
    const { name, passkey, module_id, week_number } = req.body;

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

    // If module_id provided, verify it belongs to teacher
    if (module_id) {
        const module = db.getModuleById(parseInt(module_id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(400).json({ error: 'Invalid module' });
        }
    }

    try {
        const result = db.createSession(
            req.session.teacherId,
            name.trim(),
            passkey.trim(),
            module_id ? parseInt(module_id) : null,
            week_number || null
        );
        res.json({
            success: true,
            session: {
                id: result.lastInsertRowid,
                name: name.trim(),
                passkey: passkey.trim(),
                module_id: module_id ? parseInt(module_id) : null,
                week_number: week_number || null,
                is_active: 1
            }
        });
    } catch (err) {
        console.error('Failed to create session:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Update session
router.put('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, passkey, is_active, week_number } = req.body;

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

        db.updateSession(parseInt(id), req.session.teacherId, { name, passkey, is_active, week_number });
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

// Delegate session
router.post('/:id/delegate', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, access_code } = req.body;

    if (!name || !access_code) {
        return res.status(400).json({ error: 'Name and access code are required' });
    }

    try {
        const session = db.getSessionById(parseInt(id));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Store delegation info in session
        const result = db.delegateSession(parseInt(id), name.trim(), access_code.trim());

        res.json({
            success: true,
            delegation: {
                session_id: parseInt(id),
                delegate_name: name.trim(),
                access_code: access_code.trim()
            }
        });
    } catch (err) {
        console.error('Failed to delegate session:', err);
        res.status(500).json({ error: 'Failed to delegate session' });
    }
});

// Revoke delegation
router.delete('/:id/delegate', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const session = db.getSessionById(parseInt(id));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        db.revokeDelegation(parseInt(id));
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to revoke delegation:', err);
        res.status(500).json({ error: 'Failed to revoke delegation' });
    }
});

module.exports = router;
