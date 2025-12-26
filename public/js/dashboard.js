// Global state
let currentUser = null;
let activeSession = null;      // Currently selected/viewed active session
let activeSessions = [];       // All active sessions
let allModules = [];           // All modules
let allStudents = [];
let allSessions = [];
let currentDetailsSessionId = null;
let currentModuleId = null;    // Currently viewed module
let currentModuleData = null;  // Current module full data
let refreshInterval = null;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    lang.init();
    updatePageLanguage();
    setupLanguageSwitcher();
    checkAuth();
    setupEventListeners();
    setupTabs();
});

function setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            lang.setLanguage(btn.dataset.lang);
            updatePageLanguage();
            // Re-render dynamic content
            if (allStudents.length > 0) {
                renderStudentsTable(allStudents);
            }
            if (allSessions.length > 0) {
                renderSessionsTable(allSessions);
            }
            if (activeSession) {
                loadSessionAttendance(activeSession.id);
            }
            updateSessionUI();
        });
    });
}

function updatePageLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang.getLanguage());
    });
    document.title = t('appName') + ' - Dashboard';
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = '/teacher';
            return;
        }

        currentUser = data.user;
        document.getElementById('userName').textContent = currentUser.name || currentUser.username;

        // Load initial data
        await Promise.all([
            loadModules(),
            loadActiveSession(),
            loadSessions()
        ]);

        // Start auto-refresh for active session
        startAutoRefresh();
    } catch (err) {
        console.error('Auth check failed:', err);
        window.location.href = '/teacher';
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Forms
    document.getElementById('newSessionForm').addEventListener('submit', createSession);
    document.getElementById('addStudentForm').addEventListener('submit', addStudent);
    document.getElementById('editStudentForm').addEventListener('submit', updateStudent);
    document.getElementById('bulkImportForm').addEventListener('submit', bulkImportStudents);

    // Session toggle
    document.getElementById('sessionToggle').addEventListener('change', toggleSession);

    // Module forms
    document.getElementById('addModuleForm').addEventListener('submit', createModule);
    document.getElementById('moduleSessionForm').addEventListener('submit', createModuleSession);

    // Module detail tabs
    document.querySelectorAll('[data-module-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.moduleTab;
            // Update tab buttons
            document.querySelectorAll('[data-module-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Update tab content - hide all, show selected
            document.querySelectorAll('.module-tab-content').forEach(tc => {
                tc.classList.remove('active');
                tc.classList.add('hidden');
            });
            const targetTab = document.getElementById(`module${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Tab`);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.classList.remove('hidden');
            }
        });
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tabs > .tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            if (!tabId) return; // Skip module detail tabs

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            const tabContent = document.getElementById(`${tabId}Tab`);
            if (tabContent) tabContent.classList.add('active');
        });
    });
}

// ========================================
// Module Management
// ========================================

async function loadModules() {
    try {
        const response = await fetch('/api/modules');
        allModules = await response.json();
        renderModulesGrid();
        updateModuleDropdowns();

        // Update total students count from all modules
        const totalStudents = allModules.reduce((sum, m) => sum + (m.student_count || 0), 0);
        document.getElementById('totalStudents').textContent = totalStudents;
    } catch (err) {
        console.error('Failed to load modules:', err);
    }
}

function renderModulesGrid() {
    const grid = document.getElementById('modulesList');
    const noModules = document.getElementById('noModules');
    const content = document.getElementById('modulesContent');

    if (allModules.length === 0) {
        noModules.classList.remove('hidden');
        content.classList.add('hidden');
        return;
    }

    noModules.classList.add('hidden');
    content.classList.remove('hidden');

    grid.innerHTML = allModules.map(m => `
        <div class="module-card" onclick="openModuleDetails(${m.id})">
            <div class="module-card-header">
                <h4>${escapeHtml(m.name)}</h4>
                ${m.code ? `<span class="module-code">${escapeHtml(m.code)}</span>` : ''}
            </div>
            <div class="module-card-body">
                <div class="module-stats">
                    <div class="module-stat">
                        <div class="module-stat-value">${m.student_count || 0}</div>
                        <div class="module-stat-label">${t('students')}</div>
                    </div>
                    <div class="module-stat">
                        <div class="module-stat-value">${m.session_count || 0}</div>
                        <div class="module-stat-label">${t('sessions')}</div>
                    </div>
                </div>
            </div>
            ${m.semester ? `<div class="module-card-footer">${escapeHtml(m.semester)}</div>` : ''}
        </div>
    `).join('');
}

function updateModuleDropdowns() {
    const sessionModuleSelect = document.getElementById('sessionModule');
    if (sessionModuleSelect) {
        const currentValue = sessionModuleSelect.value;
        sessionModuleSelect.innerHTML = `<option value="">${t('noModule') || '-- No Module --'}</option>` +
            allModules.map(m => `<option value="${m.id}">${escapeHtml(m.name)} ${m.code ? `(${escapeHtml(m.code)})` : ''}</option>`).join('');
        sessionModuleSelect.value = currentValue;
    }
}

function openAddModuleModal() {
    document.getElementById('addModuleForm').reset();
    openModal('addModuleModal');
}

async function createModule(e) {
    e.preventDefault();

    const name = document.getElementById('moduleName').value.trim();
    const code = document.getElementById('moduleCode').value.trim();
    const semester = document.getElementById('moduleSemester').value.trim();
    const totalClasses = document.getElementById('moduleTotalClasses').value;

    try {
        const response = await fetch('/api/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, code, semester, total_classes: parseInt(totalClasses) })
        });

        if (response.ok) {
            closeModal('addModuleModal');
            showToast(t('moduleCreated') || 'Module created successfully!', 'success');
            await loadModules();
        } else {
            const data = await response.json();
            showToast(data.error || t('failedToCreate'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

async function openModuleDetails(moduleId) {
    try {
        const response = await fetch(`/api/modules/${moduleId}`);
        const data = await response.json();

        currentModuleId = moduleId;
        currentModuleData = data;

        document.getElementById('currentModuleId').value = moduleId;
        document.getElementById('moduleDetailsTitle').textContent = data.module.name;
        document.getElementById('moduleInfoCode').textContent = data.module.code || '-';
        document.getElementById('moduleInfoSemester').textContent = data.module.semester || '-';
        document.getElementById('moduleInfoStudents').textContent = data.students.length;
        document.getElementById('moduleInfoSessions').textContent = data.sessions.length;

        renderModuleStudents(data.students);
        renderModuleSessions(data.sessions);

        openModal('moduleDetailsModal');
    } catch (err) {
        showToast(t('failedToLoad'), 'error');
    }
}

function renderModuleStudents(students) {
    const tbody = document.getElementById('moduleStudentsBody');
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${t('noStudentsAdded')}</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(s.student_id) || '-'}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.name_fa) || '-'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteModuleStudent(${s.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderModuleSessions(sessions) {
    const tbody = document.getElementById('moduleSessionsBody');
    if (sessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${t('noSessionHistory')}</td></tr>`;
        return;
    }

    tbody.innerHTML = sessions.map(s => {
        const status = s.is_active ?
            `<span class="badge badge-success">${t('active')}</span>` :
            `<span class="badge badge-secondary">${t('closed')}</span>`;

        return `
            <tr>
                <td>${s.week_number || '-'}</td>
                <td>${escapeHtml(s.name)}</td>
                <td><code>${escapeHtml(s.passkey)}</code></td>
                <td>${status}</td>
                <td>${s.attendance_count || 0}</td>
                <td>
                    <button class="btn btn-sm ${s.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleModuleSession(${s.id}, ${!s.is_active})">
                        ${s.is_active ? t('pause') || 'Pause' : t('activate') || 'Activate'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openModuleAddStudentModal() {
    document.getElementById('addStudentForm').reset();
    openModal('addStudentModal');
}

function openModuleBulkImportModal() {
    document.getElementById('bulkImportForm').reset();
    openModal('bulkImportModal');
}

function openModuleSessionModal() {
    document.getElementById('moduleSessionForm').reset();
    openModal('moduleSessionModal');
}

function generateModulePasskey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let passkey = '';
    for (let i = 0; i < 6; i++) {
        passkey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('moduleSessionPasskey').value = passkey;
}

async function createModuleSession(e) {
    e.preventDefault();

    const weekNumber = document.getElementById('moduleSessionWeek').value;
    const name = document.getElementById('moduleSessionName').value.trim();
    const passkey = document.getElementById('moduleSessionPasskey').value.trim();

    try {
        const response = await fetch(`/api/modules/${currentModuleId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, passkey, week_number: weekNumber ? parseInt(weekNumber) : null })
        });

        if (response.ok) {
            closeModal('moduleSessionModal');
            showToast(t('sessionCreated'), 'success');
            await openModuleDetails(currentModuleId);
            await loadActiveSession();
            await loadSessions();
        } else {
            const data = await response.json();
            showToast(data.error || t('failedToCreate'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

async function toggleModuleSession(sessionId, isActive) {
    try {
        const response = await fetch(`/api/sessions/${sessionId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: isActive })
        });

        if (response.ok) {
            await openModuleDetails(currentModuleId);
            await loadActiveSession();
            await loadSessions();
        }
    } catch (err) {
        showToast(t('failedToUpdate'), 'error');
    }
}

async function deleteModuleStudent(studentId) {
    if (!confirm(t('confirmDeleteStudent'))) return;

    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(t('studentDeleted'), 'success');
            await openModuleDetails(currentModuleId);
        }
    } catch (err) {
        showToast(t('failedToDelete'), 'error');
    }
}

async function deleteCurrentModule() {
    if (!confirm(t('confirmDeleteModule') || 'Are you sure you want to delete this module? All students and sessions will be lost.')) return;

    try {
        const response = await fetch(`/api/modules/${currentModuleId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeModal('moduleDetailsModal');
            showToast(t('moduleDeleted') || 'Module deleted', 'success');
            await loadModules();
            await loadSessions();
        }
    } catch (err) {
        showToast(t('failedToDelete'), 'error');
    }
}

// ========================================
// Session Management
// ========================================

async function loadActiveSession() {
    try {
        const response = await fetch('/api/sessions/active');
        const data = await response.json();

        // Handle multiple active sessions
        activeSessions = data.sessions || [];
        activeSession = data.current || (activeSessions.length > 0 ? activeSessions[0] : null);

        updateSessionUI();

        if (activeSession) {
            await loadSessionAttendance(activeSession.id);
        }
    } catch (err) {
        console.error('Failed to load active session:', err);
    }
}

function updateSessionUI() {
    const noSession = document.getElementById('noActiveSession');
    const sessionContent = document.getElementById('activeSessionContent');
    const sessionStatus = document.getElementById('sessionStatus');
    const noSessionAttendance = document.getElementById('noSessionAttendance');
    const attendanceContent = document.getElementById('attendanceContent');

    // Update active session count display
    const activeCountEl = document.getElementById('activeSessionCount');
    if (activeCountEl) {
        activeCountEl.textContent = activeSessions.length;
    }

    // Update session selector dropdown if multiple sessions
    updateSessionSelector();

    if (activeSession) {
        noSession.classList.add('hidden');
        sessionContent.classList.remove('hidden');

        document.getElementById('activeSessionName').textContent = activeSession.name;
        document.getElementById('activePasskey').textContent = activeSession.passkey;

        const isActive = activeSession.is_active === 1;
        document.getElementById('sessionToggle').checked = isActive;
        document.getElementById('toggleLabel').textContent = isActive ? t('active') : t('inactive');

        // Show count of active sessions
        const activeCountBadge = activeSessions.length > 1
            ? ` <span class="badge badge-primary">${activeSessions.length} ${t('active')}</span>`
            : '';

        sessionStatus.innerHTML = isActive
            ? `<span class="session-active"><span class="pulse-dot"></span> ${t('active')}</span>${activeCountBadge}`
            : `<span class="badge badge-warning">${t('paused')}</span>`;

        noSessionAttendance.classList.add('hidden');
        attendanceContent.classList.remove('hidden');
    } else {
        noSession.classList.remove('hidden');
        sessionContent.classList.add('hidden');
        sessionStatus.innerHTML = `<span class="badge badge-danger">${t('noActiveSession')}</span>`;

        noSessionAttendance.classList.remove('hidden');
        attendanceContent.classList.add('hidden');
    }
}

function updateSessionSelector() {
    // Create or update session selector if multiple active sessions
    let selector = document.getElementById('activeSessionSelector');

    if (activeSessions.length > 1) {
        if (!selector) {
            // Create selector
            const container = document.getElementById('activeSessionContent');
            const nameEl = document.getElementById('activeSessionName');
            if (nameEl && container) {
                selector = document.createElement('select');
                selector.id = 'activeSessionSelector';
                selector.className = 'form-control';
                selector.style.cssText = 'margin-bottom: 1rem; font-weight: 600;';
                selector.addEventListener('change', switchActiveSession);
                nameEl.parentNode.insertBefore(selector, nameEl);
                nameEl.style.display = 'none';
            }
        }

        if (selector) {
            selector.innerHTML = activeSessions.map(s =>
                `<option value="${s.id}" ${s.id === activeSession?.id ? 'selected' : ''}>${escapeHtml(s.name)} (${s.passkey})</option>`
            ).join('');
            selector.style.display = 'block';
        }
    } else if (selector) {
        selector.style.display = 'none';
        const nameEl = document.getElementById('activeSessionName');
        if (nameEl) nameEl.style.display = 'block';
    }
}

async function switchActiveSession(e) {
    const sessionId = parseInt(e.target.value);
    activeSession = activeSessions.find(s => s.id === sessionId);

    if (activeSession) {
        document.getElementById('activeSessionName').textContent = activeSession.name;
        document.getElementById('activePasskey').textContent = activeSession.passkey;
        document.getElementById('sessionToggle').checked = activeSession.is_active === 1;
        await loadSessionAttendance(activeSession.id);
    }
}

async function createSession(e) {
    e.preventDefault();

    const moduleId = document.getElementById('sessionModule').value;
    const name = document.getElementById('sessionName').value.trim();
    const passkey = document.getElementById('sessionPasskey').value.trim();

    try {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                passkey,
                module_id: moduleId ? parseInt(moduleId) : null
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(t('sessionCreated'), 'success');
            closeModal('newSessionModal');
            document.getElementById('newSessionForm').reset();
            await Promise.all([loadActiveSession(), loadSessions()]);
        } else {
            showToast(data.error || t('failedToCreate'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

async function toggleSession(e) {
    if (!activeSession) return;

    const isActive = e.target.checked;

    try {
        const response = await fetch(`/api/sessions/${activeSession.id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: isActive })
        });

        if (response.ok) {
            activeSession.is_active = isActive ? 1 : 0;
            // Reload active sessions list to update the count
            await loadActiveSession();
            await loadSessions();
            showToast(isActive ? t('sessionActivated') : t('sessionPaused'), 'success');
        }
    } catch (err) {
        e.target.checked = !isActive;
        showToast(t('failedToUpdate'), 'error');
    }
}

async function loadSessionAttendance(sessionId) {
    try {
        const response = await fetch(`/api/attendance/session/${sessionId}`);
        const data = await response.json();

        renderAttendanceTable(data.students, data.attendance);
        updateStats(data.summary);
    } catch (err) {
        console.error('Failed to load attendance:', err);
    }
}

function renderAttendanceTable(students, attendance) {
    const tbody = document.getElementById('attendanceTableBody');
    const attendanceLookup = {};

    attendance.forEach(a => {
        attendanceLookup[a.student_id] = a;
    });

    tbody.innerHTML = students.map((student, index) => {
        const att = attendanceLookup[student.id];
        const statusBadge = student.is_present
            ? `<span class="badge badge-success">${t('present')}</span>`
            : `<span class="badge badge-danger">${t('absent')}</span>`;
        const time = att ? new Date(att.registered_at).toLocaleTimeString() : '-';
        const device = att ? `${att.device_info}` : '-';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(student.name)}</td>
                <td class="rtl">${student.name_fa ? escapeHtml(student.name_fa) : '-'}</td>
                <td>${statusBadge}</td>
                <td>${time}</td>
                <td style="font-size:0.75rem;color:var(--gray-500);">${device}</td>
            </tr>
        `;
    }).join('');
}

function updateStats(summary) {
    document.getElementById('presentCount').textContent = summary?.present || 0;
    document.getElementById('absentCount').textContent = summary?.absent || 0;
}

async function refreshAttendance() {
    if (activeSession) {
        await loadSessionAttendance(activeSession.id);
        showToast(t('attendanceRefreshed'), 'success');
    }
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);

    refreshInterval = setInterval(async () => {
        if (activeSession) {
            await loadSessionAttendance(activeSession.id);
        }
    }, 10000); // Refresh every 10 seconds
}

function exportAttendance() {
    if (!activeSession) return;
    window.location.href = `/api/attendance/export/${activeSession.id}`;
}

// ========================================
// Student Management
// ========================================

async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        allStudents = await response.json();

        renderStudentsTable(allStudents);
        document.getElementById('totalStudents').textContent = allStudents.length;
    } catch (err) {
        console.error('Failed to load students:', err);
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    const noStudents = document.getElementById('noStudents');
    const studentsContent = document.getElementById('studentsContent');

    if (students.length === 0) {
        noStudents.classList.remove('hidden');
        studentsContent.classList.add('hidden');
        return;
    }

    noStudents.classList.add('hidden');
    studentsContent.classList.remove('hidden');

    tbody.innerHTML = students.map((student, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.name)}</td>
            <td class="rtl">${student.name_fa ? escapeHtml(student.name_fa) : '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal(${student.id}, '${escapeHtml(student.name)}', '${escapeHtml(student.name_fa || '')}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        ${t('edit')}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterStudents(e) {
    const query = e.target.value.toLowerCase();
    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.name_fa && s.name_fa.includes(query))
    );
    renderStudentsTable(filtered);
}

async function addStudent(e) {
    e.preventDefault();

    const name = document.getElementById('studentName').value.trim();
    const name_fa = document.getElementById('studentNameFa').value.trim();

    // Check if we're adding to a module
    if (currentModuleId) {
        try {
            const response = await fetch(`/api/modules/${currentModuleId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, name_fa })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast(t('studentAdded'), 'success');
                closeModal('addStudentModal');
                document.getElementById('addStudentForm').reset();
                await openModuleDetails(currentModuleId);
            } else {
                showToast(data.error || t('failedToCreate'), 'error');
            }
        } catch (err) {
            showToast(t('connectionError'), 'error');
        }
    } else {
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, name_fa })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast(t('studentAdded'), 'success');
                closeModal('addStudentModal');
                document.getElementById('addStudentForm').reset();
                await loadStudents();
            } else {
                showToast(data.error || t('failedToCreate'), 'error');
            }
        } catch (err) {
            showToast(t('connectionError'), 'error');
        }
    }
}

async function updateStudent(e) {
    e.preventDefault();

    const id = document.getElementById('editStudentId').value;
    const name = document.getElementById('editStudentName').value.trim();
    const name_fa = document.getElementById('editStudentNameFa').value.trim();

    try {
        const response = await fetch(`/api/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, name_fa })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(t('studentUpdated'), 'success');
            closeModal('editStudentModal');
            await loadStudents();
        } else {
            showToast(data.error || t('failedToUpdate'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm(t('confirmDeleteStudent'))) return;

    try {
        const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(t('studentDeleted'), 'success');
            await loadStudents();
        } else {
            showToast(t('failedToDelete'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

async function bulkImportStudents(e) {
    e.preventDefault();

    const text = document.getElementById('bulkStudents').value.trim();
    const lines = text.split('\n').filter(line => line.trim());

    const students = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
            name: parts[0],
            name_fa: parts[1] || null,
            student_id: parts[2] || null
        };
    }).filter(s => s.name);

    if (students.length === 0) {
        showToast(t('studentNameRequired'), 'error');
        return;
    }

    try {
        let response;
        if (currentModuleId) {
            // Import students to specific module
            response = await fetch(`/api/modules/${currentModuleId}/students/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students })
            });
        } else {
            // Import students to teacher (legacy)
            response = await fetch('/api/students/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students })
            });
        }

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(`${students.length} ${t('studentsImported')}`, 'success');
            closeModal('bulkImportModal');
            document.getElementById('bulkImportForm').reset();
            if (currentModuleId) {
                await openModuleDetails(currentModuleId);
            } else {
                await loadStudents();
            }
        } else {
            showToast(data.error || t('failedToCreate'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

// ========================================
// Session History
// ========================================

async function loadSessions() {
    try {
        const response = await fetch('/api/sessions');
        allSessions = await response.json();

        renderSessionsTable(allSessions);
        document.getElementById('totalSessions').textContent = allSessions.length;
    } catch (err) {
        console.error('Failed to load sessions:', err);
    }
}

function renderSessionsTable(sessions) {
    const tbody = document.getElementById('historyTableBody');
    const noHistory = document.getElementById('noHistory');
    const historyContent = document.getElementById('historyContent');

    if (sessions.length === 0) {
        noHistory.classList.remove('hidden');
        historyContent.classList.add('hidden');
        return;
    }

    noHistory.classList.add('hidden');
    historyContent.classList.remove('hidden');

    tbody.innerHTML = sessions.map(session => {
        const date = new Date(session.created_at).toLocaleDateString();
        const statusBadge = session.is_active
            ? `<span class="badge badge-success">${t('active')}</span>`
            : `<span class="badge badge-secondary">${t('closed')}</span>`;
        const moduleName = session.module_name
            ? `${escapeHtml(session.module_name)}${session.module_code ? ` (${escapeHtml(session.module_code)})` : ''}`
            : '-';

        return `
            <tr>
                <td>${moduleName}</td>
                <td>${escapeHtml(session.name)}</td>
                <td>${date}</td>
                <td>${statusBadge}</td>
                <td>${session.attendance_count} ${t('students')}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewSessionDetails(${session.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            ${t('view')}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSession(${session.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewSessionDetails(sessionId) {
    currentDetailsSessionId = sessionId;

    try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        document.getElementById('sessionDetailsTitle').textContent = data.session.name;
        document.getElementById('detailsPresent').textContent = data.summary.present;
        document.getElementById('detailsAbsent').textContent = data.summary.absent;

        const attendanceLookup = {};
        data.attendance.forEach(a => {
            attendanceLookup[a.student_id] = a;
        });

        const tbody = document.getElementById('sessionDetailsBody');
        tbody.innerHTML = data.students.map(student => {
            const att = attendanceLookup[student.id];
            const status = student.is_present
                ? `<span class="badge badge-success">${t('present')}</span>`
                : `<span class="badge badge-danger">${t('absent')}</span>`;
            const time = att ? new Date(att.registered_at).toLocaleString() : '-';
            const ip = att ? att.ip_address : '-';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(student.name)}</strong>
                        ${student.name_fa ? `<br><span class="rtl text-muted">${escapeHtml(student.name_fa)}</span>` : ''}
                    </td>
                    <td>${status}</td>
                    <td>${time}</td>
                    <td style="font-size:0.8rem;">${ip}</td>
                </tr>
            `;
        }).join('');

        openModal('sessionDetailsModal');
    } catch (err) {
        showToast(t('failedToLoad'), 'error');
    }
}

function exportSessionAttendance() {
    if (!currentDetailsSessionId) return;
    window.location.href = `/api/attendance/export/${currentDetailsSessionId}`;
}

async function deleteSession(id) {
    if (!confirm(t('confirmDeleteSession'))) return;

    try {
        const response = await fetch(`/api/sessions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(t('sessionDeleted'), 'success');
            await Promise.all([loadActiveSession(), loadSessions()]);
        } else {
            showToast(t('failedToDelete'), 'error');
        }
    } catch (err) {
        showToast(t('connectionError'), 'error');
    }
}

// ========================================
// Auth
// ========================================

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/teacher';
    } catch (err) {
        window.location.href = '/teacher';
    }
}

function openChangePasswordModal() {
    document.getElementById('changePasswordForm').reset();
    document.getElementById('passwordError').classList.add('hidden');
    openModal('changePasswordModal');
}

// Setup change password form
document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
});

async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const passwordError = document.getElementById('passwordError');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        passwordError.textContent = t('passwordsDoNotMatch');
        passwordError.classList.remove('hidden');
        return;
    }

    // Validate minimum length
    if (newPassword.length < 6) {
        passwordError.textContent = t('passwordMinLength');
        passwordError.classList.remove('hidden');
        return;
    }

    passwordError.classList.add('hidden');

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(t('passwordUpdated'), 'success');
            closeModal('changePasswordModal');
            document.getElementById('changePasswordForm').reset();
        } else {
            passwordError.textContent = data.error || t('failedToUpdate');
            passwordError.classList.remove('hidden');
        }
    } catch (err) {
        passwordError.textContent = t('connectionError');
        passwordError.classList.remove('hidden');
    }
}

// ========================================
// Modal Functions
// ========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openNewSessionModal() {
    document.getElementById('newSessionForm').reset();
    openModal('newSessionModal');
}

function openAddStudentModal() {
    document.getElementById('addStudentForm').reset();
    openModal('addStudentModal');
}

function openEditStudentModal(id, name, nameFa) {
    document.getElementById('editStudentId').value = id;
    document.getElementById('editStudentName').value = name;
    document.getElementById('editStudentNameFa').value = nameFa;
    openModal('editStudentModal');
}

function openBulkImportModal() {
    document.getElementById('bulkImportForm').reset();
    openModal('bulkImportModal');
}

function generateRandomPasskey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let passkey = '';
    for (let i = 0; i < 6; i++) {
        passkey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('sessionPasskey').value = passkey;
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// ========================================
// Utility Functions
// ========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success'
                ? '<polyline points="20 6 9 17 4 12"/>'
                : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
            }
        </svg>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
