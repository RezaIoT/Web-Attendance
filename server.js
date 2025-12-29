const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const useragent = require('express-useragent');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const studentRoutes = require('./routes/students');
const sessionRoutes = require('./routes/sessions');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3300;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(useragent.express());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'attendance-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Trust proxy for getting real IP behind reverse proxy
app.set('trust proxy', true);

// Get real client IP
app.use((req, res, next) => {
    req.clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.ip;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
db.initialize();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║   🎓 Student Attendance System Started Successfully! 🎓   ║
    ║                                                            ║
    ║   Server running on: http://localhost:${PORT}               ║
    ║                                                            ║
    ║   Teacher Login:  http://localhost:${PORT}/teacher          ║
    ║   Student Page:   http://localhost:${PORT}/student          ║
    ║                                                            ║
    ║   Default credentials:                                     ║
    ║   Username: admin                                          ║
    ║   Password: admin123                                       ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    `);
});
