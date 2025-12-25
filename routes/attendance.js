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

        // Get students for this session - from module if available, otherwise from teacher
        let students;
        if (session.module_id) {
            students = db.getStudentsByModule(session.module_id);
        } else {
            students = db.getAllStudents(session.teacher_id);
        }

        res.json({
            success: true,
            session: {
                id: session.id,
                name: session.name,
                teacher_name: session.teacher_name,
                module_name: session.module_name || null,
                module_code: session.module_code || null,
                week_number: session.week_number || null
            },
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                name_fa: s.name_fa,
                student_id: s.student_id
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

        // Get students from module if available, otherwise from teacher
        let students;
        if (session.module_id) {
            students = db.getStudentsByModule(session.module_id);
        } else {
            students = db.getAllStudents(session.teacher_id);
        }

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

        // Check if same IP already registered in this session (prevent fraud)
        const ipAttendances = db.getAttendanceByIp(session.id, req.clientIp);

        if (ipAttendances.length > 0) {
            // Get the name of the student who already registered from this IP
            const existingStudent = students.find(s => s.id === ipAttendances[0].student_id);
            const existingName = existingStudent ? existingStudent.name : 'another student';

            return res.status(403).json({
                error: `This device has already been used to register attendance for ${existingName}. Each device can only register once per session.`,
                error_fa: `این دستگاه قبلاً برای ثبت حضور ${existingStudent ? existingStudent.name_fa || existingStudent.name : 'دانشجوی دیگر'} استفاده شده است. هر دستگاه فقط یک بار در هر جلسه می‌تواند ثبت حضور کند.`,
                ip_already_used: true,
                registered_student: existingName
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

        // Get students from module if available, otherwise from teacher
        let students;
        if (session.module_id) {
            students = db.getStudentsForSession(session.module_id, parseInt(sessionId));
        } else {
            students = db.getStudentsForSessionByTeacher(req.session.teacherId, parseInt(sessionId));
        }

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
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Export attendance as CSV (teacher only)
router.get('/export/:sessionId', isAuthenticated, (req, res) => {
    const { sessionId } = req.params;

    try {
        console.log('Export request for session:', sessionId, 'by teacher:', req.session.teacherId);

        const session = db.getSessionById(parseInt(sessionId));
        if (!session) {
            console.log('Session not found:', sessionId);
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.teacher_id !== req.session.teacherId) {
            console.log('Teacher mismatch:', session.teacher_id, '!=', req.session.teacherId);
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get students from module if available, otherwise from teacher
        let students;
        if (session.module_id) {
            students = db.getStudentsForSession(session.module_id, parseInt(sessionId));
        } else {
            students = db.getStudentsForSessionByTeacher(req.session.teacherId, parseInt(sessionId));
        }
        const attendance = db.getSessionAttendance(parseInt(sessionId));

        console.log('Found', students.length, 'students and', attendance.length, 'attendance records');

        // Create attendance lookup
        const attendanceLookup = {};
        attendance.forEach(a => {
            attendanceLookup[a.student_id] = a;
        });

        // Build CSV with BOM for UTF-8 support in Excel
        const BOM = '\uFEFF';
        let csv = BOM + 'Student ID,Name,Name (Farsi),Status,Time,IP Address,Device\n';

        students.forEach(student => {
            const att = attendanceLookup[student.id];
            const status = student.is_present ? 'Present' : 'Absent';
            const time = att ? new Date(att.registered_at).toLocaleString() : '';
            const ip = att ? (att.ip_address || '') : '';
            const device = att ? (att.device_info || '').replace(/"/g, '""') : '';
            const name = (student.name || '').replace(/"/g, '""');
            const nameFa = (student.name_fa || '').replace(/"/g, '""');
            const studentNumber = (student.student_id || '').replace(/"/g, '""');
            csv += `"${studentNumber}","${name}","${nameFa}","${status}","${time}","${ip}","${device}"\n`;
        });

        // Sanitize filename - only allow ASCII characters for HTTP header compatibility
        const safeSessionName = (session.name || 'session')
            .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove non-ASCII characters
            .replace(/\s+/g, '_')
            .substring(0, 50) || 'session';
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `attendance_${safeSessionName}_${dateStr}.csv`;

        console.log('Sending CSV file:', filename);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error('Export error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Failed to export attendance: ' + err.message });
    }
});

module.exports = router;
