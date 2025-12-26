const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Get reports data
router.get('/', isAuthenticated, (req, res) => {
    const { module_id } = req.query;
    const teacherId = req.session.teacherId;

    try {
        // Get all modules for teacher
        const modules = db.getAllModules(teacherId);

        // Get all sessions
        const allSessions = db.getAllSessions(teacherId);

        // Filter sessions by module if specified
        const sessions = module_id
            ? allSessions.filter(s => s.module_id === parseInt(module_id))
            : allSessions;

        // Calculate summary stats
        let totalStudents = 0;
        let totalPresent = 0;
        let totalPossible = 0;

        // Get student attendance data
        const studentData = [];

        if (module_id) {
            // Single module
            const students = db.getStudentsByModule(parseInt(module_id));
            const moduleSessions = sessions.filter(s => s.module_id === parseInt(module_id));
            const module = modules.find(m => m.id === parseInt(module_id));

            students.forEach(student => {
                let attended = 0;
                moduleSessions.forEach(session => {
                    const attendance = db.checkStudentAttendance(session.id, student.id);
                    if (attendance) attended++;
                });

                const totalSessionsCount = moduleSessions.length;
                const rate = totalSessionsCount > 0 ? Math.round((attended / totalSessionsCount) * 100) : 0;

                studentData.push({
                    id: student.id,
                    name: student.name,
                    name_fa: student.name_fa,
                    module_name: module ? module.name : '-',
                    sessions_attended: attended,
                    total_sessions: totalSessionsCount,
                    attendance_rate: rate
                });

                totalStudents++;
                totalPresent += attended;
                totalPossible += totalSessionsCount;
            });
        } else {
            // All modules
            modules.forEach(module => {
                const students = db.getStudentsByModule(module.id);
                const moduleSessions = sessions.filter(s => s.module_id === module.id);

                students.forEach(student => {
                    let attended = 0;
                    moduleSessions.forEach(session => {
                        const attendance = db.checkStudentAttendance(session.id, student.id);
                        if (attendance) attended++;
                    });

                    const totalSessionsCount = moduleSessions.length;
                    const rate = totalSessionsCount > 0 ? Math.round((attended / totalSessionsCount) * 100) : 0;

                    studentData.push({
                        id: student.id,
                        name: student.name,
                        name_fa: student.name_fa,
                        module_name: module.name,
                        sessions_attended: attended,
                        total_sessions: totalSessionsCount,
                        attendance_rate: rate
                    });

                    totalStudents++;
                    totalPresent += attended;
                    totalPossible += totalSessionsCount;
                });
            });
        }

        // Calculate average attendance
        const avgAttendance = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

        // Build trend data (last 10 sessions)
        const recentSessions = sessions.slice(0, 10).reverse();
        const trend = recentSessions.map(session => {
            const attendance = db.getSessionAttendance(session.id);
            let totalStudentsInSession = 0;

            if (session.module_id) {
                totalStudentsInSession = db.getStudentsByModule(session.module_id).length;
            }

            return {
                label: session.name.substring(0, 15),
                present: attendance.length,
                absent: Math.max(0, totalStudentsInSession - attendance.length)
            };
        });

        // Overview (pie chart data)
        const totalAttendanceRecords = sessions.reduce((sum, s) => {
            return sum + db.getSessionAttendance(s.id).length;
        }, 0);

        const overview = {
            present: totalPresent,
            absent: totalPossible - totalPresent
        };

        // Module performance data
        const modulePerformance = modules.map(module => {
            const moduleSessions = sessions.filter(s => s.module_id === module.id);
            const students = db.getStudentsByModule(module.id);

            let modulePresent = 0;
            let modulePossible = 0;

            students.forEach(student => {
                moduleSessions.forEach(session => {
                    modulePossible++;
                    const attendance = db.checkStudentAttendance(session.id, student.id);
                    if (attendance) modulePresent++;
                });
            });

            return {
                id: module.id,
                name: module.name,
                attendance_rate: modulePossible > 0 ? Math.round((modulePresent / modulePossible) * 100) : 0,
                student_count: students.length,
                session_count: moduleSessions.length
            };
        });

        res.json({
            summary: {
                total_students: totalStudents,
                avg_attendance: avgAttendance,
                total_sessions: sessions.length,
                total_modules: modules.length
            },
            trend,
            overview,
            modules: modulePerformance,
            students: studentData.sort((a, b) => b.attendance_rate - a.attendance_rate)
        });
    } catch (err) {
        console.error('Failed to generate reports:', err);
        res.status(500).json({ error: 'Failed to generate reports' });
    }
});

// Export full report as CSV
router.get('/export', isAuthenticated, (req, res) => {
    const { module_id } = req.query;
    const teacherId = req.session.teacherId;

    try {
        const modules = db.getAllModules(teacherId);
        const sessions = db.getAllSessions(teacherId);

        // Build CSV content
        let csv = '\uFEFF'; // UTF-8 BOM
        csv += 'Student Name,Student Name (Farsi),Module,Sessions Attended,Total Sessions,Attendance Rate,Status\n';

        const targetModules = module_id
            ? modules.filter(m => m.id === parseInt(module_id))
            : modules;

        targetModules.forEach(module => {
            const students = db.getStudentsByModule(module.id);
            const moduleSessions = sessions.filter(s => s.module_id === module.id);

            students.forEach(student => {
                let attended = 0;
                moduleSessions.forEach(session => {
                    const attendance = db.checkStudentAttendance(session.id, student.id);
                    if (attendance) attended++;
                });

                const rate = moduleSessions.length > 0
                    ? Math.round((attended / moduleSessions.length) * 100)
                    : 0;

                let status = 'Critical';
                if (rate >= 80) status = 'Excellent';
                else if (rate >= 60) status = 'Good';
                else if (rate >= 40) status = 'Needs Improvement';

                csv += `"${student.name}","${student.name_fa || ''}","${module.name}",${attended},${moduleSessions.length},${rate}%,${status}\n`;
            });
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
        res.send(csv);
    } catch (err) {
        console.error('Failed to export report:', err);
        res.status(500).json({ error: 'Failed to export report' });
    }
});

// Export student report as CSV
router.get('/students/export', isAuthenticated, (req, res) => {
    const { module_id } = req.query;
    const teacherId = req.session.teacherId;

    try {
        const modules = db.getAllModules(teacherId);
        const sessions = db.getAllSessions(teacherId);

        let csv = '\uFEFF';
        csv += 'Student Name,Student Name (Farsi),Student ID,Module,Sessions Attended,Total Sessions,Attendance Rate\n';

        const targetModules = module_id
            ? modules.filter(m => m.id === parseInt(module_id))
            : modules;

        targetModules.forEach(module => {
            const students = db.getStudentsByModule(module.id);
            const moduleSessions = sessions.filter(s => s.module_id === module.id);

            students.forEach(student => {
                let attended = 0;
                moduleSessions.forEach(session => {
                    const attendance = db.checkStudentAttendance(session.id, student.id);
                    if (attendance) attended++;
                });

                const rate = moduleSessions.length > 0
                    ? Math.round((attended / moduleSessions.length) * 100)
                    : 0;

                csv += `"${student.name}","${student.name_fa || ''}","${student.student_id || ''}","${module.name}",${attended},${moduleSessions.length},${rate}%\n`;
            });
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="student_attendance_report.csv"');
        res.send(csv);
    } catch (err) {
        console.error('Failed to export student report:', err);
        res.status(500).json({ error: 'Failed to export student report' });
    }
});

module.exports = router;
