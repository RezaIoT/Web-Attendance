const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Get all students for current teacher
router.get('/', isAuthenticated, (req, res) => {
    try {
        const students = db.getAllStudents(req.session.teacherId);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Add a single student
router.post('/', isAuthenticated, (req, res) => {
    const { name, name_fa } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Student name is required' });
    }

    try {
        const result = db.addStudent(name.trim(), name_fa?.trim(), req.session.teacherId);
        res.json({
            success: true,
            student: {
                id: result.lastInsertRowid,
                name: name.trim(),
                name_fa: name_fa?.trim() || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// Add multiple students (bulk import)
router.post('/bulk', isAuthenticated, (req, res) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Students array is required' });
    }

    // Validate each student has a name
    const validStudents = students.filter(s => s.name && s.name.trim() !== '');
    if (validStudents.length === 0) {
        return res.status(400).json({ error: 'No valid student names provided' });
    }

    try {
        db.addMultipleStudents(
            validStudents.map(s => ({
                name: s.name.trim(),
                name_fa: s.name_fa?.trim() || null
            })),
            req.session.teacherId
        );
        res.json({
            success: true,
            message: `${validStudents.length} students added successfully`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add students' });
    }
});

// Update a student
router.put('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, name_fa } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Student name is required' });
    }

    try {
        const result = db.updateStudent(parseInt(id), name.trim(), name_fa?.trim(), req.session.teacherId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update student' });
    }
});

// Delete a student
router.delete('/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.deleteStudent(parseInt(id), req.session.teacherId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

// Delete all students
router.delete('/', isAuthenticated, (req, res) => {
    try {
        db.deleteAllStudents(req.session.teacherId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete students' });
    }
});

module.exports = router;
