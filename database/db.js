const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');
let db;

function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

function initialize() {
    const database = getDb();

    // Create teachers table
    database.exec(`
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create students table
    database.exec(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            name_fa TEXT,
            teacher_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `);

    // Create class_sessions table
    database.exec(`
        CREATE TABLE IF NOT EXISTS class_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            passkey TEXT NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `);

    // Create attendance table
    database.exec(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            ip_address TEXT,
            device_info TEXT,
            browser TEXT,
            os TEXT,
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES class_sessions(id),
            FOREIGN KEY (student_id) REFERENCES students(id),
            UNIQUE(session_id, student_id)
        )
    `);

    // Create settings table for global configuration
    database.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id),
            UNIQUE(teacher_id, key)
        )
    `);

    // Create default admin user if not exists
    const adminExists = database.prepare('SELECT id FROM teachers WHERE username = ?').get('admin');
    if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        database.prepare('INSERT INTO teachers (username, password, name) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Administrator');
        console.log('Default admin user created (username: admin, password: admin123)');
    }

    console.log('Database initialized successfully');
}

// Teacher functions
function findTeacherByUsername(username) {
    return getDb().prepare('SELECT * FROM teachers WHERE username = ?').get(username);
}

function findTeacherById(id) {
    return getDb().prepare('SELECT id, username, name, created_at FROM teachers WHERE id = ?').get(id);
}

function updateTeacherPassword(id, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    return getDb().prepare('UPDATE teachers SET password = ? WHERE id = ?').run(hashedPassword, id);
}

// Student functions
function getAllStudents(teacherId) {
    return getDb().prepare('SELECT * FROM students WHERE teacher_id = ? ORDER BY name').all(teacherId);
}

function addStudent(name, nameFa, teacherId) {
    return getDb().prepare('INSERT INTO students (name, name_fa, teacher_id) VALUES (?, ?, ?)').run(name, nameFa || null, teacherId);
}

function addMultipleStudents(students, teacherId) {
    const insert = getDb().prepare('INSERT INTO students (name, name_fa, teacher_id) VALUES (?, ?, ?)');
    const insertMany = getDb().transaction((students) => {
        for (const student of students) {
            insert.run(student.name, student.name_fa || null, teacherId);
        }
    });
    return insertMany(students);
}

function updateStudent(id, name, nameFa, teacherId) {
    return getDb().prepare('UPDATE students SET name = ?, name_fa = ? WHERE id = ? AND teacher_id = ?').run(name, nameFa || null, id, teacherId);
}

function deleteStudent(id, teacherId) {
    return getDb().prepare('DELETE FROM students WHERE id = ? AND teacher_id = ?').run(id, teacherId);
}

function deleteAllStudents(teacherId) {
    return getDb().prepare('DELETE FROM students WHERE teacher_id = ?').run(teacherId);
}

// Session functions
function createSession(teacherId, name, passkey) {
    // Allow multiple active sessions (no longer deactivating others)
    return getDb().prepare('INSERT INTO class_sessions (teacher_id, name, passkey, is_active) VALUES (?, ?, ?, 1)').run(teacherId, name, passkey);
}

function getActiveSession(teacherId) {
    // Returns the most recently created active session (for backward compatibility)
    return getDb().prepare('SELECT * FROM class_sessions WHERE teacher_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(teacherId);
}

function getActiveSessions(teacherId) {
    // Returns all active sessions
    return getDb().prepare('SELECT * FROM class_sessions WHERE teacher_id = ? AND is_active = 1 ORDER BY created_at DESC').all(teacherId);
}

function countActiveSessions(teacherId) {
    const result = getDb().prepare('SELECT COUNT(*) as count FROM class_sessions WHERE teacher_id = ? AND is_active = 1').get(teacherId);
    return result.count;
}

function getAllSessions(teacherId) {
    return getDb().prepare(`
        SELECT cs.*,
               (SELECT COUNT(*) FROM attendance WHERE session_id = cs.id) as attendance_count
        FROM class_sessions cs
        WHERE cs.teacher_id = ?
        ORDER BY cs.created_at DESC
    `).all(teacherId);
}

function getSessionById(id) {
    return getDb().prepare('SELECT * FROM class_sessions WHERE id = ?').get(id);
}

function updateSession(id, teacherId, updates) {
    const { name, passkey, is_active } = updates;
    // Allow multiple active sessions (no longer deactivating others)
    return getDb().prepare('UPDATE class_sessions SET name = COALESCE(?, name), passkey = COALESCE(?, passkey), is_active = COALESCE(?, is_active) WHERE id = ? AND teacher_id = ?')
        .run(name, passkey, is_active, id, teacherId);
}

function toggleSession(id, teacherId, isActive) {
    // Allow multiple active sessions (no longer deactivating others)
    return getDb().prepare('UPDATE class_sessions SET is_active = ?, closed_at = CASE WHEN ? = 0 THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ? AND teacher_id = ?')
        .run(isActive ? 1 : 0, isActive ? 1 : 0, id, teacherId);
}

function deleteSession(id, teacherId) {
    getDb().prepare('DELETE FROM attendance WHERE session_id = ?').run(id);
    return getDb().prepare('DELETE FROM class_sessions WHERE id = ? AND teacher_id = ?').run(id, teacherId);
}

function verifySessionPasskey(passkey) {
    return getDb().prepare('SELECT cs.*, t.name as teacher_name FROM class_sessions cs JOIN teachers t ON cs.teacher_id = t.id WHERE cs.passkey = ? AND cs.is_active = 1').get(passkey);
}

// Attendance functions
function recordAttendance(sessionId, studentId, ipAddress, deviceInfo, browser, os) {
    try {
        return getDb().prepare('INSERT INTO attendance (session_id, student_id, ip_address, device_info, browser, os) VALUES (?, ?, ?, ?, ?, ?)')
            .run(sessionId, studentId, ipAddress, deviceInfo, browser, os);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { duplicate: true };
        }
        throw err;
    }
}

function getSessionAttendance(sessionId) {
    return getDb().prepare(`
        SELECT a.*, s.name as student_name, s.name_fa as student_name_fa
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.session_id = ?
        ORDER BY a.registered_at
    `).all(sessionId);
}

function getAttendanceByIp(sessionId, ipAddress) {
    return getDb().prepare('SELECT * FROM attendance WHERE session_id = ? AND ip_address = ?').all(sessionId, ipAddress);
}

function checkStudentAttendance(sessionId, studentId) {
    return getDb().prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(sessionId, studentId);
}

function getStudentsForSession(teacherId, sessionId) {
    return getDb().prepare(`
        SELECT s.*,
               CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_present
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        WHERE s.teacher_id = ?
        ORDER BY s.name
    `).all(sessionId, teacherId);
}

// Settings functions
function getSetting(teacherId, key) {
    const result = getDb().prepare('SELECT value FROM settings WHERE teacher_id = ? AND key = ?').get(teacherId, key);
    return result ? result.value : null;
}

function setSetting(teacherId, key, value) {
    return getDb().prepare('INSERT OR REPLACE INTO settings (teacher_id, key, value) VALUES (?, ?, ?)').run(teacherId, key, value);
}

module.exports = {
    getDb,
    initialize,
    findTeacherByUsername,
    findTeacherById,
    updateTeacherPassword,
    getAllStudents,
    addStudent,
    addMultipleStudents,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    createSession,
    getActiveSession,
    getActiveSessions,
    countActiveSessions,
    getAllSessions,
    getSessionById,
    updateSession,
    toggleSession,
    deleteSession,
    verifySessionPasskey,
    recordAttendance,
    getSessionAttendance,
    getAttendanceByIp,
    checkStudentAttendance,
    getStudentsForSession,
    getSetting,
    setSetting
};
