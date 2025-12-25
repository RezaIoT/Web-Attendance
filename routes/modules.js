const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Get all modules for current teacher
router.get('/', isAuthenticated, (req, res) => {
    try {
        const modules = db.getAllModules(req.session.teacherId);
        res.json(modules);
    } catch (err) {
        console.error('Failed to fetch modules:', err);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Get single module with details
router.get('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const students = db.getStudentsByModule(parseInt(id));
        const sessions = db.getSessionsByModule(parseInt(id));

        res.json({
            module,
            students,
            sessions,
            summary: {
                total_students: students.length,
                total_sessions: sessions.length,
                active_sessions: sessions.filter(s => s.is_active).length
            }
        });
    } catch (err) {
        console.error('Failed to fetch module:', err);
        res.status(500).json({ error: 'Failed to fetch module details' });
    }
});

// Create a new module
router.post('/', isAuthenticated, (req, res) => {
    const { name, code, semester, total_classes } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Module name is required' });
    }

    try {
        const result = db.createModule(
            req.session.teacherId,
            name.trim(),
            code?.trim() || null,
            semester?.trim() || null,
            total_classes || 15
        );

        res.json({
            success: true,
            module: {
                id: result.lastInsertRowid,
                name: name.trim(),
                code: code?.trim() || null,
                semester: semester?.trim() || null,
                total_classes: total_classes || 15
            }
        });
    } catch (err) {
        console.error('Failed to create module:', err);
        res.status(500).json({ error: 'Failed to create module' });
    }
});

// Update module
router.put('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, code, semester, total_classes } = req.body;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        db.updateModule(parseInt(id), req.session.teacherId, {
            name: name?.trim(),
            code: code?.trim(),
            semester: semester?.trim(),
            total_classes
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to update module:', err);
        res.status(500).json({ error: 'Failed to update module' });
    }
});

// Delete module (and all related data)
router.delete('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.deleteModule(parseInt(id), req.session.teacherId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete module:', err);
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// Get students for a module
router.get('/:id/students', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const students = db.getStudentsByModule(parseInt(id));
        res.json(students);
    } catch (err) {
        console.error('Failed to fetch students:', err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Add student to module
router.post('/:id/students', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, name_fa, student_id } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Student name is required' });
    }

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const result = db.addStudent(
            name.trim(),
            name_fa?.trim() || null,
            req.session.teacherId,
            parseInt(id),
            student_id?.trim() || null
        );

        res.json({
            success: true,
            student: {
                id: result.lastInsertRowid,
                name: name.trim(),
                name_fa: name_fa?.trim() || null,
                student_id: student_id?.trim() || null,
                module_id: parseInt(id)
            }
        });
    } catch (err) {
        console.error('Failed to add student:', err);
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// Bulk import students to module
router.post('/:id/students/bulk', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Students list is required' });
    }

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        db.addMultipleStudents(students, req.session.teacherId, parseInt(id));
        res.json({ success: true, count: students.length });
    } catch (err) {
        console.error('Failed to import students:', err);
        res.status(500).json({ error: 'Failed to import students' });
    }
});

// Delete all students from module
router.delete('/:id/students', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        db.deleteModuleStudents(parseInt(id));
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete students:', err);
        res.status(500).json({ error: 'Failed to delete students' });
    }
});

// Get sessions for a module
router.get('/:id/sessions', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const sessions = db.getSessionsByModule(parseInt(id));
        res.json(sessions);
    } catch (err) {
        console.error('Failed to fetch sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Create session for a module
router.post('/:id/sessions', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, passkey, week_number } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Session name is required' });
    }

    if (!passkey || passkey.trim() === '') {
        return res.status(400).json({ error: 'Passkey is required' });
    }

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Check if passkey is already in use
        const existingSession = db.verifySessionPasskey(passkey.trim());
        if (existingSession) {
            return res.status(400).json({ error: 'This passkey is already in use by another active session' });
        }

        const result = db.createSession(
            req.session.teacherId,
            name.trim(),
            passkey.trim(),
            parseInt(id),
            week_number || null
        );

        res.json({
            success: true,
            session: {
                id: result.lastInsertRowid,
                name: name.trim(),
                passkey: passkey.trim(),
                week_number: week_number || null,
                module_id: parseInt(id),
                is_active: 1
            }
        });
    } catch (err) {
        console.error('Failed to create session:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Get module attendance summary
router.get('/:id/attendance', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const module = db.getModuleById(parseInt(id));
        if (!module || module.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const summary = db.getModuleAttendanceSummary(parseInt(id));
        const sessions = db.getSessionsByModule(parseInt(id));

        res.json({
            module,
            students: summary,
            total_sessions: sessions.length,
            completed_sessions: sessions.filter(s => !s.is_active).length
        });
    } catch (err) {
        console.error('Failed to fetch attendance:', err);
        res.status(500).json({ error: 'Failed to fetch attendance summary' });
    }
});

module.exports = router;
