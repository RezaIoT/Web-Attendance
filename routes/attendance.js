const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Verify passkey and get session info (for students)
router.post('/verify', (req, res) => {
    const { passkey } = req.body;

    if (!passkey || passkey.trim() === '') {
        return res.status(400).json({ error: 'Passkey is required' });
    }

    try {
        const session = db.verifySessionPasskey(passkey.trim());
        if (!session) {
            return res.status(404).json({ error: 'Invalid passkey or session is not active' });
        }

        // Get students for this session
        const students = db.getAllStudents(session.teacher_id);

        res.json({
            success: true,
            session: {
                id: session.id,
                name: session.name,
                teacher_name: session.teacher_name
            },
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                name_fa: s.name_fa
            }))
        });
    } catch (err) {
        console.error('Error verifying passkey:', err);
        res.status(500).json({ error: 'Failed to verify passkey' });
    }
});

// Check if student is already registered (for students)
router.get('/check/:sessionId/:studentId', (req, res) => {
    const { sessionId, studentId } = req.params;

    try {
        const attendance = db.checkStudentAttendance(parseInt(sessionId), parseInt(studentId));
        res.json({
            registered: !!attendance,
            attendance
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check attendance' });
    }
});

// Register attendance (for students)
router.post('/register', (req, res) => {
    const { passkey, student_id } = req.body;

    if (!passkey || !student_id) {
        return res.status(400).json({ error: 'Passkey and student ID are required' });
    }

    try {
        // Verify session is active
        const session = db.verifySessionPasskey(passkey.trim());
        if (!session) {
            return res.status(404).json({ error: 'Invalid passkey or session is not active' });
        }

        // Check if student exists and belongs to this teacher
        const students = db.getAllStudents(session.teacher_id);
        const student = students.find(s => s.id === parseInt(student_id));
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if already registered
        const existingAttendance = db.checkStudentAttendance(session.id, parseInt(student_id));
        if (existingAttendance) {
            return res.status(400).json({
                error: 'You have already registered your attendance',
                already_registered: true
            });
        }

        // Get device info
        const ua = req.useragent;
        const deviceInfo = `${ua.platform} - ${ua.browser} ${ua.version}`;
        const browser = ua.browser;
        const os = ua.os;

        // Check if same IP already registered multiple times
        const ipAttendances = db.getAttendanceByIp(session.id, req.clientIp);
        const maxRegistrationsPerIp = 3; // Allow max 3 registrations per IP

        if (ipAttendances.length >= maxRegistrationsPerIp) {
            return res.status(403).json({
                error: `Maximum ${maxRegistrationsPerIp} registrations allowed from the same device/network`,
                ip_limit_reached: true
            });
        }

        // Record attendance
        const result = db.recordAttendance(
            session.id,
            parseInt(student_id),
            req.clientIp,
            deviceInfo,
            browser,
            os
        );

        if (result.duplicate) {
            return res.status(400).json({
                error: 'You have already registered your attendance',
                already_registered: true
            });
        }

        res.json({
            success: true,
            message: `Attendance registered successfully for ${student.name}`,
            student_name: student.name,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error registering attendance:', err);
        res.status(500).json({ error: 'Failed to register attendance' });
    }
});

// Get attendance for a session (teacher only)
router.get('/session/:sessionId', isAuthenticated, (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = db.getSessionById(parseInt(sessionId));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const attendance = db.getSessionAttendance(parseInt(sessionId));
        const students = db.getStudentsForSession(req.session.teacherId, parseInt(sessionId));

        res.json({
            session,
            attendance,
            students,
            summary: {
                total: students.length,
                present: students.filter(s => s.is_present).length,
                absent: students.filter(s => !s.is_present).length
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Export attendance as CSV (teacher only)
router.get('/export/:sessionId', isAuthenticated, (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = db.getSessionById(parseInt(sessionId));
        if (!session || session.teacher_id !== req.session.teacherId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const students = db.getStudentsForSession(req.session.teacherId, parseInt(sessionId));
        const attendance = db.getSessionAttendance(parseInt(sessionId));

        // Create attendance lookup
        const attendanceLookup = {};
        attendance.forEach(a => {
            attendanceLookup[a.student_id] = a;
        });

        // Build CSV with BOM for UTF-8 support in Excel
        const BOM = '\uFEFF';
        let csv = BOM + 'Name,Name (Farsi),Status,Time,IP Address,Device\n';
        students.forEach(student => {
            const att = attendanceLookup[student.id];
            const status = student.is_present ? 'Present' : 'Absent';
            const time = att ? new Date(att.registered_at).toLocaleString() : '';
            const ip = att ? att.ip_address : '';
            const device = att ? (att.device_info || '').replace(/"/g, '""') : '';
            const name = (student.name || '').replace(/"/g, '""');
            const nameFa = (student.name_fa || '').replace(/"/g, '""');
            csv += `"${name}","${nameFa}","${status}","${time}","${ip}","${device}"\n`;
        });

        // Sanitize filename - remove special characters
        const safeSessionName = session.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `attendance_${safeSessionName}_${dateStr}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(csv);
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export attendance' });
    }
});

module.exports = router;
