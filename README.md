# Student Attendance System

A modern, professional web application for classroom attendance management. Teachers can manage students, create class sessions, and track attendance in real-time. Students can register their attendance using a passkey without logging in.

## Features

- **Teacher Dashboard**
  - Secure login with username/password
  - Manage student list (add, edit, delete, bulk import)
  - Create class sessions with unique passkeys
  - Activate/deactivate student attendance link
  - Real-time attendance monitoring
  - Export attendance to CSV
  - Session history with detailed reports

- **Student Attendance**
  - No login required - just enter the class passkey
  - Search and select name from the list
  - One-click attendance registration
  - Supports English and Farsi (Persian) names

- **Security Features**
  - Session-based authentication for teachers
  - Unique passkey for each class session
  - IP address and device tracking
  - Limit on registrations per IP address
  - Prevents duplicate attendance

- **Responsive Design**
  - Works on desktop, tablet, and mobile devices
  - Modern UI with smooth animations
  - RTL support for Farsi text

## Requirements

- Node.js 16.0 or higher
- npm or yarn

## Installation

1. **Clone or download the project**
   ```bash
   cd Web-Attendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:3000`
   - Teacher Login: `http://localhost:3000/teacher`
   - Student Page: `http://localhost:3000/student`

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

> **Important:** Change the default password after your first login!

## Usage Guide

### For Teachers

1. **Login** to the dashboard using your credentials
2. **Add Students** - Go to "Manage Students" tab
   - Add students one by one, or
   - Use "Bulk Import" to add multiple students at once
   - Format: `English Name | Farsi Name` (Farsi is optional)

3. **Create a Session**
   - Click "Create New Session"
   - Enter a session name (e.g., "Math Class - Week 5")
   - Set a passkey for students (or generate a random one)

4. **Share the Passkey**
   - The passkey will be displayed on your dashboard
   - Share it with students when you want them to register attendance

5. **Toggle Session Status**
   - Use the toggle switch to activate/deactivate the student link
   - When inactive, students cannot register attendance

6. **Monitor Attendance**
   - The "Live Attendance" tab shows real-time attendance
   - Auto-refreshes every 10 seconds
   - Click "Refresh" for manual update

7. **Export Data**
   - Click "Export CSV" to download attendance data

### For Students

1. Go to the student page: `http://your-server:3000/student`
2. Enter the passkey provided by the teacher
3. Search for your name
4. Select your name and click "Register Attendance"
5. Done! Your attendance is recorded

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | 3000 |
| `SESSION_SECRET` | Session encryption key | (random) |
| `NODE_ENV` | Environment mode | development |

### Example Production Setup

```bash
export PORT=3000
export SESSION_SECRET="your-super-secret-key-here"
export NODE_ENV=production
npm start
```

## Running with PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "attendance-app"

# Auto-start on system reboot
pm2 startup
pm2 save
```

## Running with systemd (Linux)

Create `/etc/systemd/system/attendance.service`:

```ini
[Unit]
Description=Student Attendance System
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Web-Attendance
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable attendance
sudo systemctl start attendance
```

## Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name attendance.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database

The application uses SQLite for data storage. The database file is created automatically at:
```
./database/attendance.db
```

To backup your data, simply copy this file.

## Project Structure

```
Web-Attendance/
├── server.js           # Main application entry
├── package.json        # Dependencies
├── database/
│   └── db.js          # Database operations
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── students.js    # Student management
│   ├── sessions.js    # Session management
│   └── attendance.js  # Attendance tracking
└── public/
    ├── index.html     # Home page
    ├── teacher.html   # Teacher login
    ├── student.html   # Student attendance
    ├── dashboard.html # Teacher dashboard
    ├── css/
    │   └── style.css  # Styles
    └── js/
        └── dashboard.js # Dashboard logic
```

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues and feature requests, please create an issue in the repository.
