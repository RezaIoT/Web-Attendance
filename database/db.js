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

    // Create modules table (courses)
    database.exec(`
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            code TEXT,
            semester TEXT,
            total_classes INTEGER DEFAULT 15,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `);

    // Create students table (linked to modules)
    database.exec(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            name_fa TEXT,
            student_id TEXT,
            module_id INTEGER,
            teacher_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES modules(id),
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `);

    // Create class_sessions table (linked to modules)
    database.exec(`
        CREATE TABLE IF NOT EXISTS class_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            module_id INTEGER,
            name TEXT NOT NULL,
            week_number INTEGER,
            passkey TEXT NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (module_id) REFERENCES modules(id)
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

    // Add module_id column to students if not exists (migration)
    try {
        database.exec(`ALTER TABLE students ADD COLUMN module_id INTEGER REFERENCES modules(id)`);
    } catch (e) {
        // Column already exists
    }

    // Add student_id column to students if not exists (migration)
    try {
        database.exec(`ALTER TABLE students ADD COLUMN student_id TEXT`);
    } catch (e) {
        // Column already exists
    }

    // Add module_id column to class_sessions if not exists (migration)
    try {
        database.exec(`ALTER TABLE class_sessions ADD COLUMN module_id INTEGER REFERENCES modules(id)`);
    } catch (e) {
        // Column already exists
    }

    // Add week_number column to class_sessions if not exists (migration)
    try {
        database.exec(`ALTER TABLE class_sessions ADD COLUMN week_number INTEGER`);
    } catch (e) {
        // Column already exists
    }

    // Add delegation columns to class_sessions if not exists (migration)
    try {
        database.exec(`ALTER TABLE class_sessions ADD COLUMN delegate_name TEXT`);
    } catch (e) {
        // Column already exists
    }
    try {
        database.exec(`ALTER TABLE class_sessions ADD COLUMN delegate_code TEXT`);
    } catch (e) {
        // Column already exists
    }

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

// ========================================
// Module functions
// ========================================

function createModule(teacherId, name, code, semester, totalClasses) {
    return getDb().prepare(
        'INSERT INTO modules (teacher_id, name, code, semester, total_classes) VALUES (?, ?, ?, ?, ?)'
    ).run(teacherId, name, code || null, semester || null, totalClasses || 15);
}

function getAllModules(teacherId) {
    return getDb().prepare(`
        SELECT m.*,
               (SELECT COUNT(*) FROM students WHERE module_id = m.id) as student_count,
               (SELECT COUNT(*) FROM class_sessions WHERE module_id = m.id) as session_count
        FROM modules m
        WHERE m.teacher_id = ?
        ORDER BY m.created_at DESC
    `).all(teacherId);
}

function getModuleById(id) {
    return getDb().prepare('SELECT * FROM modules WHERE id = ?').get(id);
}

function updateModule(id, teacherId, updates) {
    const { name, code, semester, total_classes } = updates;
    return getDb().prepare(
        'UPDATE modules SET name = COALESCE(?, name), code = COALESCE(?, code), semester = COALESCE(?, semester), total_classes = COALESCE(?, total_classes) WHERE id = ? AND teacher_id = ?'
    ).run(name, code, semester, total_classes, id, teacherId);
}

function deleteModule(id, teacherId) {
    const database = getDb();

    // Use transaction to ensure all deletions happen together
    const deleteAll = database.transaction(() => {
        // Get all sessions for this module
        const sessions = database.prepare('SELECT id FROM class_sessions WHERE module_id = ?').all(id);

        // Delete attendance for each session
        sessions.forEach(s => {
            database.prepare('DELETE FROM attendance WHERE session_id = ?').run(s.id);
        });

        // Get all students for this module
        const students = database.prepare('SELECT id FROM students WHERE module_id = ?').all(id);

        // Delete attendance for each student (in case they attended other sessions)
        students.forEach(s => {
            database.prepare('DELETE FROM attendance WHERE student_id = ?').run(s.id);
        });

        // Now delete sessions
        database.prepare('DELETE FROM class_sessions WHERE module_id = ?').run(id);

        // Delete students
        database.prepare('DELETE FROM students WHERE module_id = ?').run(id);

        // Finally delete the module
        return database.prepare('DELETE FROM modules WHERE id = ? AND teacher_id = ?').run(id, teacherId);
    });

    return deleteAll();
}

// ========================================
// Student functions (updated for modules)
// ========================================

function getAllStudents(teacherId) {
    return getDb().prepare('SELECT * FROM students WHERE teacher_id = ? ORDER BY name').all(teacherId);
}

function getStudentsByModule(moduleId) {
    return getDb().prepare('SELECT * FROM students WHERE module_id = ? ORDER BY name').all(moduleId);
}

function addStudent(name, nameFa, teacherId, moduleId, studentId) {
    return getDb().prepare(
        'INSERT INTO students (name, name_fa, teacher_id, module_id, student_id) VALUES (?, ?, ?, ?, ?)'
    ).run(name, nameFa || null, teacherId, moduleId || null, studentId || null);
}

function addMultipleStudents(students, teacherId, moduleId) {
    const insert = getDb().prepare(
        'INSERT INTO students (name, name_fa, teacher_id, module_id, student_id) VALUES (?, ?, ?, ?, ?)'
    );
    const insertMany = getDb().transaction((students) => {
        for (const student of students) {
            insert.run(student.name, student.name_fa || null, teacherId, moduleId || null, student.student_id || null);
        }
    });
    return insertMany(students);
}

function updateStudent(id, name, nameFa, teacherId, studentId) {
    return getDb().prepare(
        'UPDATE students SET name = ?, name_fa = ?, student_id = ? WHERE id = ? AND teacher_id = ?'
    ).run(name, nameFa || null, studentId || null, id, teacherId);
}

function deleteStudent(id, teacherId) {
    return getDb().prepare('DELETE FROM students WHERE id = ? AND teacher_id = ?').run(id, teacherId);
}

function deleteAllStudents(teacherId) {
    return getDb().prepare('DELETE FROM students WHERE teacher_id = ?').run(teacherId);
}

function deleteModuleStudents(moduleId) {
    return getDb().prepare('DELETE FROM students WHERE module_id = ?').run(moduleId);
}

// ========================================
// Session functions (updated for modules)
// ========================================

function createSession(teacherId, name, passkey, moduleId, weekNumber) {
    return getDb().prepare(
        'INSERT INTO class_sessions (teacher_id, name, passkey, is_active, module_id, week_number) VALUES (?, ?, ?, 1, ?, ?)'
    ).run(teacherId, name, passkey, moduleId || null, weekNumber || null);
}

function getActiveSession(teacherId) {
    return getDb().prepare(
        'SELECT * FROM class_sessions WHERE teacher_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(teacherId);
}

function getActiveSessions(teacherId) {
    return getDb().prepare(`
        SELECT cs.*, m.name as module_name, m.code as module_code
        FROM class_sessions cs
        LEFT JOIN modules m ON cs.module_id = m.id
        WHERE cs.teacher_id = ? AND cs.is_active = 1
        ORDER BY cs.created_at DESC
    `).all(teacherId);
}

function countActiveSessions(teacherId) {
    const result = getDb().prepare(
        'SELECT COUNT(*) as count FROM class_sessions WHERE teacher_id = ? AND is_active = 1'
    ).get(teacherId);
    return result.count;
}

function getAllSessions(teacherId) {
    return getDb().prepare(`
        SELECT cs.*, m.name as module_name, m.code as module_code,
               (SELECT COUNT(*) FROM attendance WHERE session_id = cs.id) as attendance_count
        FROM class_sessions cs
        LEFT JOIN modules m ON cs.module_id = m.id
        WHERE cs.teacher_id = ?
        ORDER BY cs.created_at DESC
    `).all(teacherId);
}

function getSessionsByModule(moduleId) {
    return getDb().prepare(`
        SELECT cs.*,
               (SELECT COUNT(*) FROM attendance WHERE session_id = cs.id) as attendance_count
        FROM class_sessions cs
        WHERE cs.module_id = ?
        ORDER BY cs.week_number ASC, cs.created_at DESC
    `).all(moduleId);
}

function getSessionById(id) {
    return getDb().prepare(`
        SELECT cs.*, m.name as module_name, m.code as module_code
        FROM class_sessions cs
        LEFT JOIN modules m ON cs.module_id = m.id
        WHERE cs.id = ?
    `).get(id);
}

function updateSession(id, teacherId, updates) {
    const { name, passkey, is_active, week_number } = updates;
    return getDb().prepare(
        'UPDATE class_sessions SET name = COALESCE(?, name), passkey = COALESCE(?, passkey), is_active = COALESCE(?, is_active), week_number = COALESCE(?, week_number) WHERE id = ? AND teacher_id = ?'
    ).run(name, passkey, is_active, week_number, id, teacherId);
}

function toggleSession(id, teacherId, isActive) {
    return getDb().prepare(
        'UPDATE class_sessions SET is_active = ?, closed_at = CASE WHEN ? = 0 THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ? AND teacher_id = ?'
    ).run(isActive ? 1 : 0, isActive ? 1 : 0, id, teacherId);
}

function deleteSession(id, teacherId) {
    getDb().prepare('DELETE FROM attendance WHERE session_id = ?').run(id);
    return getDb().prepare('DELETE FROM class_sessions WHERE id = ? AND teacher_id = ?').run(id, teacherId);
}

function verifySessionPasskey(passkey) {
    return getDb().prepare(`
        SELECT cs.*, t.name as teacher_name, m.name as module_name, m.code as module_code
        FROM class_sessions cs
        JOIN teachers t ON cs.teacher_id = t.id
        LEFT JOIN modules m ON cs.module_id = m.id
        WHERE cs.passkey = ? AND cs.is_active = 1
    `).get(passkey);
}

// ========================================
// Attendance functions
// ========================================

function recordAttendance(sessionId, studentId, ipAddress, deviceInfo, browser, os) {
    try {
        return getDb().prepare(
            'INSERT INTO attendance (session_id, student_id, ip_address, device_info, browser, os) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(sessionId, studentId, ipAddress, deviceInfo, browser, os);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { duplicate: true };
        }
        throw err;
    }
}

function getSessionAttendance(sessionId) {
    return getDb().prepare(`
        SELECT a.*, s.name as student_name, s.name_fa as student_name_fa, s.student_id as student_number
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

function getStudentsForSession(moduleId, sessionId) {
    return getDb().prepare(`
        SELECT s.*,
               CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_present
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        WHERE s.module_id = ?
        ORDER BY s.name
    `).all(sessionId, moduleId);
}

// Legacy function for backward compatibility
function getStudentsForSessionByTeacher(teacherId, sessionId) {
    return getDb().prepare(`
        SELECT s.*,
               CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_present
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        WHERE s.teacher_id = ?
        ORDER BY s.name
    `).all(sessionId, teacherId);
}

// Get module attendance summary
function getModuleAttendanceSummary(moduleId) {
    return getDb().prepare(`
        SELECT s.id, s.name, s.name_fa, s.student_id as student_number,
               COUNT(DISTINCT a.session_id) as classes_attended,
               (SELECT COUNT(*) FROM class_sessions WHERE module_id = ? AND is_active = 0) as total_classes
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        LEFT JOIN class_sessions cs ON a.session_id = cs.id AND cs.module_id = ?
        WHERE s.module_id = ?
        GROUP BY s.id
        ORDER BY s.name
    `).all(moduleId, moduleId, moduleId);
}

// ========================================
// Settings functions
// ========================================

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
    // Teacher
    findTeacherByUsername,
    findTeacherById,
    updateTeacherPassword,
    // Module
    createModule,
    getAllModules,
    getModuleById,
    updateModule,
    deleteModule,
    // Student
    getAllStudents,
    getStudentsByModule,
    addStudent,
    addMultipleStudents,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    deleteModuleStudents,
    // Session
    createSession,
    getActiveSession,
    getActiveSessions,
    countActiveSessions,
    getAllSessions,
    getSessionsByModule,
    getSessionById,
    updateSession,
    toggleSession,
    deleteSession,
    verifySessionPasskey,
    // Attendance
    recordAttendance,
    getSessionAttendance,
    getAttendanceByIp,
    checkStudentAttendance,
    getStudentsForSession,
    getStudentsForSessionByTeacher,
    getModuleAttendanceSummary,
    // Settings
    getSetting,
    setSetting
};
