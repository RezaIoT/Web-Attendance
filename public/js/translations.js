// Translations for Student Attendance System
const translations = {
    en: {
        // Common
        appName: "Student Attendance System",
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        back: "Back",
        search: "Search",
        actions: "Actions",
        yes: "Yes",
        no: "No",
        confirm: "Confirm",
        success: "Success",
        error: "Error",
        warning: "Warning",

        // Home Page
        homeTitle: "Student Attendance System",
        homeSubtitle: "Modern and easy-to-use classroom attendance tracking",
        teacherLogin: "Teacher Login",
        studentAttendance: "Student Attendance",
        featureSecure: "Secure Access",
        featureSecureDesc: "Session-based passkeys for each class",
        featureMultiDevice: "Multi-Device",
        featureMultiDeviceDesc: "Works on desktop and mobile",
        featureExport: "Export Data",
        featureExportDesc: "Download attendance as CSV",
        featureRealtime: "Real-time",
        featureRealtimeDesc: "Instant attendance updates",

        // Login Page
        loginTitle: "Teacher Login",
        loginSubtitle: "Enter your credentials to access the dashboard",
        username: "Username",
        password: "Password",
        enterUsername: "Enter your username",
        enterPassword: "Enter your password",
        signIn: "Sign In",
        signingIn: "Signing in...",
        backToHome: "Back to Home",
        invalidCredentials: "Invalid username or password",
        connectionError: "Connection error. Please try again.",

        // Student Page
        studentTitle: "Student Attendance",
        studentSubtitle: "Enter the class passkey provided by your teacher",
        classPasskey: "Class Passkey",
        enterPasskey: "Enter passkey",
        verifyPasskey: "Verify Passkey",
        verifying: "Verifying...",
        invalidPasskey: "Invalid passkey or session is not active",
        selectYourName: "Select your name and register your attendance",
        searchYourName: "Search your name",
        registerAttendance: "Register Attendance",
        registering: "Registering...",
        attendanceRegistered: "Attendance Registered!",
        attendanceRecorded: "Your attendance has been recorded.",
        alreadyRegistered: "You have already registered your attendance",
        noStudentsFound: "No students found",
        backToHome: "Back to Home",
        time: "Time",

        // Dashboard
        welcome: "Welcome",
        logout: "Logout",

        // Active Session
        activeSession: "Active Session",
        noActiveSession: "No Active Session",
        createSessionPrompt: "Create a new session to start taking attendance",
        createNewSession: "Create New Session",
        sessionName: "Session Name",
        studentLinkStatus: "Student Link Status",
        active: "Active",
        inactive: "Inactive",
        paused: "Paused",
        sharePasskey: "Share this passkey with students",
        newSession: "New Session",
        refresh: "Refresh",

        // Stats
        totalStudents: "Total Students",
        present: "Present",
        absent: "Absent",
        totalSessions: "Total Sessions",

        // Tabs
        liveAttendance: "Live Attendance",
        manageStudents: "Manage Students",
        sessionHistory: "Session History",

        // Attendance Tab
        studentName: "Student Name",
        nameFarsi: "Name (Farsi)",
        nameEnglish: "Name (English)",
        status: "Status",
        deviceInfo: "Device Info",
        exportCsv: "Export CSV",
        attendanceRefreshed: "Attendance refreshed",

        // Students Tab
        searchStudents: "Search students...",
        addStudent: "Add Student",
        bulkImport: "Bulk Import",
        noStudentsAdded: "No Students Added",
        addStudentsPrompt: "Add students to start tracking attendance",
        studentAdded: "Student added successfully!",
        studentUpdated: "Student updated successfully!",
        studentDeleted: "Student deleted",
        confirmDeleteStudent: "Are you sure you want to delete this student?",

        // Session History Tab
        date: "Date",
        closed: "Closed",
        students: "students",
        view: "View",
        noSessionHistory: "No Session History",
        pastSessionsPrompt: "Past sessions will appear here",
        sessionDeleted: "Session deleted",
        confirmDeleteSession: "Are you sure you want to delete this session? All attendance records will be lost.",

        // Modals
        createSession: "Create Session",
        sessionNamePlaceholder: "e.g., Math Class - Week 5",
        passkeyForStudents: "Passkey for Students",
        passkeyPlaceholder: "e.g., MATH2024",
        passkeyHint: "This passkey will be shared with students to register attendance",
        generateRandom: "Generate Random",
        sessionCreated: "Session created successfully!",
        passkeyInUse: "This passkey is already in use by another active session",

        addStudentTitle: "Add Student",
        editStudentTitle: "Edit Student",
        studentNameRequired: "Student name is required",
        nameEnglishLabel: "Name (English)",
        nameFarsiLabel: "Name (Farsi) - Optional",
        enterStudentName: "Enter student name",

        bulkImportTitle: "Bulk Import Students",
        bulkImportInstructions: "Enter student names (one per line)",
        bulkImportPlaceholder: "John Doe\nJane Smith\nAli Rezaei | علی رضایی\nSara Ahmadi | سارا احمدی",
        bulkImportHint: "Format: English Name | Farsi Name (Farsi name is optional)",
        importStudents: "Import Students",
        studentsImported: "students added successfully",

        sessionDetails: "Session Details",
        ipAddress: "IP Address",

        // Session Toggle
        sessionActivated: "Session activated",
        sessionPaused: "Session paused",

        // Errors
        failedToLoad: "Failed to load data",
        failedToCreate: "Failed to create",
        failedToUpdate: "Failed to update",
        failedToDelete: "Failed to delete",

        // Language
        language: "Language",
        english: "English",
        farsi: "فارسی",

        // Password Change
        changePassword: "Password",
        changePasswordTitle: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        passwordMinLength: "Minimum 6 characters",
        updatePassword: "Update Password",
        passwordUpdated: "Password updated successfully!",
        passwordsDoNotMatch: "New passwords do not match",
        currentPasswordIncorrect: "Current password is incorrect",

        // Modules (University Format)
        modules: "Modules",
        manageModules: "Manage Modules",
        addModule: "Add Module",
        editModule: "Edit Module",
        moduleName: "Module Name",
        moduleCode: "Module Code",
        semester: "Semester",
        totalClasses: "Total Classes",
        moduleNamePlaceholder: "e.g., Mathematics 101",
        moduleCodePlaceholder: "e.g., MATH101",
        semesterPlaceholder: "e.g., Fall 2024",
        noModulesAdded: "No Modules Added",
        addModulesPrompt: "Create your first module to start organizing classes",
        moduleCreated: "Module created successfully!",
        moduleUpdated: "Module updated successfully!",
        moduleDeleted: "Module deleted",
        confirmDeleteModule: "Are you sure you want to delete this module? All students and session records will be lost.",
        moduleDetails: "Module Details",
        moduleStudents: "Students",
        moduleSessions: "Sessions",
        weekNumber: "Week",
        selectModule: "Select Module",
        noModule: "No Module (All Students)",
        week: "Week",
        createSessionForModule: "Create Session",
        studentId: "Student ID",
        studentIdPlaceholder: "e.g., 123456789",
        bulkImportHintExtended: "Format: English Name | Farsi Name | Student ID (Farsi name and ID are optional)",
        classes: "classes",
        viewModule: "View Details",

        // Reports
        reports: "Reports",
        analyticsReports: "Analytics & Reports",
        avgAttendance: "Avg. Attendance",
        totalModules: "Total Modules",
        attendanceTrend: "Attendance Trend",
        attendanceOverview: "Attendance Overview",
        modulePerformance: "Module Performance",
        studentAttendanceReport: "Student Attendance Report",
        sessionsAttended: "Sessions Attended",
        attendanceRate: "Attendance Rate",
        exportReport: "Export Report",
        allModules: "All Modules",
        excellent: "Excellent",
        good: "Good",
        needsImprovement: "Needs Improvement",
        critical: "Critical",

        // Dashboard Overview
        dashboardOverview: "Dashboard Overview",
        activeSessions: "Active Sessions",
        todayAttendance: "Today's Attendance",
        pendingStudents: "Pending Students",
        weeklyTrend: "Weekly Trend",
        liveUpdates: "Live Updates",
        noActiveSessions: "No Active Sessions",
        pauseSession: "Pause",
        viewSession: "View",
        filterByModule: "Filter by Module",
        autoRefresh: "Auto-refresh",
        createSession: "Create Session",
        attendanceToday: "Attendance Today",
        currentActiveSessions: "Current Active Sessions",
        yourModules: "Your Modules",
        noData: "No Data",

        // Delegation
        delegateSession: "Delegate Session",
        delegateDescription: "Share this session with another person. They can view attendance using the access code.",
        delegateName: "Delegate Name",
        accessCode: "Access Code",
        accessCodeHint: "The delegate will use this code to access the session",
        delegate: "Delegate",
        sessionDelegated: "Session delegated successfully!",
        failedToDelegate: "Failed to delegate session",
        confirmRevokeDelegation: "Are you sure you want to revoke this delegation?",
        delegationRevoked: "Delegation revoked"
    },

    fa: {
        // Common
        appName: "سیستم حضور و غیاب دانشجویان",
        loading: "در حال بارگذاری...",
        save: "ذخیره",
        cancel: "انصراف",
        delete: "حذف",
        edit: "ویرایش",
        close: "بستن",
        back: "بازگشت",
        search: "جستجو",
        actions: "عملیات",
        yes: "بله",
        no: "خیر",
        confirm: "تایید",
        success: "موفق",
        error: "خطا",
        warning: "هشدار",

        // Home Page
        homeTitle: "سیستم حضور و غیاب دانشجویان",
        homeSubtitle: "ثبت حضور و غیاب کلاسی به روش مدرن و آسان",
        teacherLogin: "ورود استاد",
        studentAttendance: "حضور و غیاب دانشجو",
        featureSecure: "دسترسی امن",
        featureSecureDesc: "کلید عبور اختصاصی برای هر جلسه",
        featureMultiDevice: "چند دستگاهی",
        featureMultiDeviceDesc: "کار با کامپیوتر و موبایل",
        featureExport: "خروجی گرفتن",
        featureExportDesc: "دانلود حضور و غیاب به صورت CSV",
        featureRealtime: "بلادرنگ",
        featureRealtimeDesc: "بروزرسانی آنی حضور و غیاب",

        // Login Page
        loginTitle: "ورود استاد",
        loginSubtitle: "نام کاربری و رمز عبور خود را وارد کنید",
        username: "نام کاربری",
        password: "رمز عبور",
        enterUsername: "نام کاربری را وارد کنید",
        enterPassword: "رمز عبور را وارد کنید",
        signIn: "ورود",
        signingIn: "در حال ورود...",
        backToHome: "بازگشت به صفحه اصلی",
        invalidCredentials: "نام کاربری یا رمز عبور نادرست است",
        connectionError: "خطا در اتصال. لطفا دوباره تلاش کنید.",

        // Student Page
        studentTitle: "حضور و غیاب دانشجو",
        studentSubtitle: "کلید عبور کلاس را که استاد داده است وارد کنید",
        classPasskey: "کلید عبور کلاس",
        enterPasskey: "کلید عبور را وارد کنید",
        verifyPasskey: "تایید کلید عبور",
        verifying: "در حال بررسی...",
        invalidPasskey: "کلید عبور نامعتبر یا جلسه فعال نیست",
        selectYourName: "نام خود را انتخاب و حضور خود را ثبت کنید",
        searchYourName: "جستجوی نام شما",
        registerAttendance: "ثبت حضور",
        registering: "در حال ثبت...",
        attendanceRegistered: "حضور شما ثبت شد!",
        attendanceRecorded: "حضور شما با موفقیت ثبت گردید.",
        alreadyRegistered: "شما قبلا حضور خود را ثبت کرده‌اید",
        noStudentsFound: "دانشجویی یافت نشد",
        time: "زمان",

        // Dashboard
        welcome: "خوش آمدید",
        logout: "خروج",

        // Active Session
        activeSession: "جلسه فعال",
        noActiveSession: "جلسه فعالی وجود ندارد",
        createSessionPrompt: "برای شروع ثبت حضور و غیاب یک جلسه جدید ایجاد کنید",
        createNewSession: "ایجاد جلسه جدید",
        sessionName: "نام جلسه",
        studentLinkStatus: "وضعیت لینک دانشجو",
        active: "فعال",
        inactive: "غیرفعال",
        paused: "متوقف",
        sharePasskey: "این کلید عبور را با دانشجویان به اشتراک بگذارید",
        newSession: "جلسه جدید",
        refresh: "بروزرسانی",

        // Stats
        totalStudents: "کل دانشجویان",
        present: "حاضر",
        absent: "غایب",
        totalSessions: "کل جلسات",

        // Tabs
        liveAttendance: "حضور و غیاب زنده",
        manageStudents: "مدیریت دانشجویان",
        sessionHistory: "تاریخچه جلسات",

        // Attendance Tab
        studentName: "نام دانشجو",
        nameFarsi: "نام (فارسی)",
        nameEnglish: "نام (انگلیسی)",
        status: "وضعیت",
        deviceInfo: "اطلاعات دستگاه",
        exportCsv: "خروجی CSV",
        attendanceRefreshed: "حضور و غیاب بروزرسانی شد",

        // Students Tab
        searchStudents: "جستجوی دانشجو...",
        addStudent: "افزودن دانشجو",
        bulkImport: "ورود گروهی",
        noStudentsAdded: "دانشجویی اضافه نشده",
        addStudentsPrompt: "برای شروع ثبت حضور و غیاب دانشجویان را اضافه کنید",
        studentAdded: "دانشجو با موفقیت اضافه شد!",
        studentUpdated: "دانشجو با موفقیت بروزرسانی شد!",
        studentDeleted: "دانشجو حذف شد",
        confirmDeleteStudent: "آیا از حذف این دانشجو مطمئن هستید؟",

        // Session History Tab
        date: "تاریخ",
        closed: "بسته شده",
        students: "دانشجو",
        view: "مشاهده",
        noSessionHistory: "تاریخچه جلسه‌ای وجود ندارد",
        pastSessionsPrompt: "جلسات گذشته اینجا نمایش داده می‌شوند",
        sessionDeleted: "جلسه حذف شد",
        confirmDeleteSession: "آیا از حذف این جلسه مطمئن هستید؟ تمام سوابق حضور و غیاب از بین می‌رود.",

        // Modals
        createSession: "ایجاد جلسه",
        sessionNamePlaceholder: "مثال: کلاس ریاضی - هفته ۵",
        passkeyForStudents: "کلید عبور برای دانشجویان",
        passkeyPlaceholder: "مثال: MATH2024",
        passkeyHint: "این کلید عبور برای ثبت حضور به دانشجویان داده می‌شود",
        generateRandom: "تولید تصادفی",
        sessionCreated: "جلسه با موفقیت ایجاد شد!",
        passkeyInUse: "این کلید عبور قبلا توسط جلسه دیگری استفاده شده است",

        addStudentTitle: "افزودن دانشجو",
        editStudentTitle: "ویرایش دانشجو",
        studentNameRequired: "نام دانشجو الزامی است",
        nameEnglishLabel: "نام (انگلیسی)",
        nameFarsiLabel: "نام (فارسی) - اختیاری",
        enterStudentName: "نام دانشجو را وارد کنید",

        bulkImportTitle: "ورود گروهی دانشجویان",
        bulkImportInstructions: "نام دانشجویان را وارد کنید (هر خط یک نام)",
        bulkImportPlaceholder: "John Doe\nJane Smith\nعلی رضایی | Ali Rezaei\nسارا احمدی | Sara Ahmadi",
        bulkImportHint: "فرمت: نام انگلیسی | نام فارسی (نام فارسی اختیاری است)",
        importStudents: "ورود دانشجویان",
        studentsImported: "دانشجو با موفقیت اضافه شد",

        sessionDetails: "جزئیات جلسه",
        ipAddress: "آدرس IP",

        // Session Toggle
        sessionActivated: "جلسه فعال شد",
        sessionPaused: "جلسه متوقف شد",

        // Errors
        failedToLoad: "خطا در بارگذاری اطلاعات",
        failedToCreate: "خطا در ایجاد",
        failedToUpdate: "خطا در بروزرسانی",
        failedToDelete: "خطا در حذف",

        // Language
        language: "زبان",
        english: "English",
        farsi: "فارسی",

        // Password Change
        changePassword: "رمز عبور",
        changePasswordTitle: "تغییر رمز عبور",
        currentPassword: "رمز عبور فعلی",
        newPassword: "رمز عبور جدید",
        confirmPassword: "تکرار رمز عبور جدید",
        passwordMinLength: "حداقل ۶ کاراکتر",
        updatePassword: "بروزرسانی رمز عبور",
        passwordUpdated: "رمز عبور با موفقیت تغییر کرد!",
        passwordsDoNotMatch: "رمزهای عبور جدید مطابقت ندارند",
        currentPasswordIncorrect: "رمز عبور فعلی صحیح نیست",

        // Modules (University Format)
        modules: "ماژول‌ها",
        manageModules: "مدیریت ماژول‌ها",
        addModule: "افزودن ماژول",
        editModule: "ویرایش ماژول",
        moduleName: "نام ماژول",
        moduleCode: "کد ماژول",
        semester: "ترم",
        totalClasses: "تعداد کلاس‌ها",
        moduleNamePlaceholder: "مثال: ریاضی ۱۰۱",
        moduleCodePlaceholder: "مثال: MATH101",
        semesterPlaceholder: "مثال: پاییز ۱۴۰۳",
        noModulesAdded: "ماژولی اضافه نشده",
        addModulesPrompt: "اولین ماژول خود را برای شروع سازماندهی کلاس‌ها ایجاد کنید",
        moduleCreated: "ماژول با موفقیت ایجاد شد!",
        moduleUpdated: "ماژول با موفقیت بروزرسانی شد!",
        moduleDeleted: "ماژول حذف شد",
        confirmDeleteModule: "آیا از حذف این ماژول مطمئن هستید؟ تمام دانشجویان و سوابق جلسات حذف خواهند شد.",
        moduleDetails: "جزئیات ماژول",
        moduleStudents: "دانشجویان",
        moduleSessions: "جلسات",
        weekNumber: "هفته",
        selectModule: "انتخاب ماژول",
        noModule: "بدون ماژول (همه دانشجویان)",
        week: "هفته",
        createSessionForModule: "ایجاد جلسه",
        studentId: "شماره دانشجویی",
        studentIdPlaceholder: "مثال: ۱۲۳۴۵۶۷۸۹",
        bulkImportHintExtended: "فرمت: نام انگلیسی | نام فارسی | شماره دانشجویی (نام فارسی و شماره دانشجویی اختیاری است)",
        classes: "کلاس",
        viewModule: "مشاهده جزئیات",

        // Reports
        reports: "گزارش‌ها",
        analyticsReports: "تحلیل و گزارش‌ها",
        avgAttendance: "میانگین حضور",
        totalModules: "کل ماژول‌ها",
        attendanceTrend: "روند حضور و غیاب",
        attendanceOverview: "نمای کلی حضور",
        modulePerformance: "عملکرد ماژول‌ها",
        studentAttendanceReport: "گزارش حضور دانشجویان",
        sessionsAttended: "جلسات حاضر",
        attendanceRate: "نرخ حضور",
        exportReport: "خروجی گزارش",
        allModules: "همه ماژول‌ها",
        excellent: "عالی",
        good: "خوب",
        needsImprovement: "نیاز به بهبود",
        critical: "بحرانی",

        // Dashboard Overview
        dashboardOverview: "نمای کلی داشبورد",
        activeSessions: "جلسات فعال",
        todayAttendance: "حضور امروز",
        pendingStudents: "دانشجویان در انتظار",
        weeklyTrend: "روند هفتگی",
        liveUpdates: "بروزرسانی زنده",
        noActiveSessions: "جلسه فعالی وجود ندارد",
        pauseSession: "توقف",
        viewSession: "مشاهده",
        filterByModule: "فیلتر بر اساس ماژول",
        autoRefresh: "بروزرسانی خودکار",
        createSession: "ایجاد جلسه",
        attendanceToday: "حضور امروز",
        currentActiveSessions: "جلسات فعال فعلی",
        yourModules: "ماژول‌های شما",
        noData: "بدون داده",

        // Delegation
        delegateSession: "واگذاری جلسه",
        delegateDescription: "این جلسه را با شخص دیگری به اشتراک بگذارید. آنها می‌توانند با کد دسترسی حضور را مشاهده کنند.",
        delegateName: "نام نماینده",
        accessCode: "کد دسترسی",
        accessCodeHint: "نماینده از این کد برای دسترسی به جلسه استفاده می‌کند",
        delegate: "واگذاری",
        sessionDelegated: "جلسه با موفقیت واگذار شد!",
        failedToDelegate: "واگذاری جلسه ناموفق بود",
        confirmRevokeDelegation: "آیا از لغو این واگذاری مطمئن هستید؟",
        delegationRevoked: "واگذاری لغو شد"
    }
};

// Language Manager
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.listeners = [];
    }

    get(key) {
        return translations[this.currentLang][key] || translations['en'][key] || key;
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
            document.body.classList.toggle('rtl', lang === 'fa');
            this.notifyListeners();
        }
    }

    getLanguage() {
        return this.currentLang;
    }

    isRTL() {
        return this.currentLang === 'fa';
    }

    onLanguageChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentLang));
    }

    init() {
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'fa' ? 'rtl' : 'ltr';
        document.body.classList.toggle('rtl', this.currentLang === 'fa');
    }
}

// Create global instance
const lang = new LanguageManager();

// Helper function for translations
function t(key) {
    return lang.get(key);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    lang.init();
});
