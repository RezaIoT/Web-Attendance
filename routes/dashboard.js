const express = require('express');
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Get dashboard overview data (for real-time updates)
router.get('/overview', isAuthenticated, (req, res) => {
    const { module_id } = req.query;
    const teacherId = req.session.teacherId;

    try {
        // Get all modules for teacher
        const modules = db.getAllModules(teacherId);

        // Get all sessions
        const allSessions = db.getAllSessions(teacherId);

        // Get active sessions
        const activeSessions = db.getActiveSessions(teacherId);

        // Add attendance count to each active session
        const activeSessionsWithCount = activeSessions.map(session => {
            const attendance = db.getSessionAttendance(session.id);
            return {
                ...session,
                attendance_count: attendance.length
            };
        });

        // Filter by module if specified
        const filteredActiveSessions = module_id
            ? activeSessionsWithCount.filter(s => s.module_id === parseInt(module_id))
            : activeSessionsWithCount;

        // Calculate total students
        let totalStudents = 0;
        if (module_id) {
            totalStudents = db.getStudentsByModule(parseInt(module_id)).length;
        } else {
            totalStudents = modules.reduce((sum, m) => sum + (m.student_count || 0), 0);
        }

        // Calculate today's attendance
        const today = new Date().toISOString().split('T')[0];
        let todayPresent = 0;
        let todayPossible = 0;

        const todaySessions = module_id
            ? allSessions.filter(s => s.module_id === parseInt(module_id) && s.created_at.startsWith(today))
            : allSessions.filter(s => s.created_at.startsWith(today));

        todaySessions.forEach(session => {
            const attendance = db.getSessionAttendance(session.id);
            todayPresent += attendance.length;

            if (session.module_id) {
                todayPossible += db.getStudentsByModule(session.module_id).length;
            }
        });

        const todayAbsent = Math.max(0, todayPossible - todayPresent);
        const todayAttendanceRate = todayPossible > 0 ? Math.round((todayPresent / todayPossible) * 100) : 0;

        // Calculate pending students for active sessions
        let pendingStudents = 0;
        filteredActiveSessions.forEach(session => {
            const attendance = db.getSessionAttendance(session.id);
            const attendedIds = attendance.map(a => a.student_id);

            if (session.module_id) {
                const students = db.getStudentsByModule(session.module_id);
                pendingStudents += students.filter(s => !attendedIds.includes(s.id)).length;
            }
        });

        // Build weekly trend (last 7 days)
        const weeklyTrend = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];

            let dayPresent = 0;

            const daySessions = module_id
                ? allSessions.filter(s => s.module_id === parseInt(module_id) && s.created_at.startsWith(dateStr))
                : allSessions.filter(s => s.created_at.startsWith(dateStr));

            daySessions.forEach(session => {
                const attendance = db.getSessionAttendance(session.id);
                dayPresent += attendance.length;
            });

            weeklyTrend.push({
                day: dayName,
                date: dateStr,
                present: dayPresent
            });
        }

        // Get total sessions count
        const totalSessions = module_id
            ? allSessions.filter(s => s.module_id === parseInt(module_id)).length
            : allSessions.length;

        res.json({
            active_sessions_count: filteredActiveSessions.length,
            active_sessions: filteredActiveSessions,
            today_attendance_rate: todayAttendanceRate,
            today_present: todayPresent,
            today_absent: todayAbsent,
            pending_students: pendingStudents,
            total_modules: modules.length,
            total_students: totalStudents,
            total_sessions: totalSessions,
            weekly_trend: weeklyTrend
        });
    } catch (err) {
        console.error('Failed to get dashboard overview:', err);
        res.status(500).json({ error: 'Failed to get dashboard overview' });
    }
});

module.exports = router;
