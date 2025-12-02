/* schema_sqlite.sql - Database schema SQL */
-- SQLite Schema for Facilita SENAI

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    period TEXT CHECK(period IN ('Matutino', 'Vespertino', 'Noturno')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'professor', 'student')) NOT NULL,
    class_id INTEGER,
    course_end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- User Courses Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('auditorio', 'oficina', 'mecanica', 'eletrica', 'sala_aula', 'laboratorio')) NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schedules 
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    class_id INTEGER,
    title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    position TEXT,
    schedule TEXT,
    address TEXT,
    salary TEXT,
    description TEXT NOT NULL,
    requirements TEXT,
    type TEXT CHECK(type IN ('estagio', 'emprego', 'jovem_aprendiz')) NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    indicated_by INTEGER,
    status TEXT CHECK(status IN ('applied', 'indicated', 'interviewing', 'hired', 'rejected')) DEFAULT 'applied',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (indicated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Replacements
CREATE TABLE IF NOT EXISTS replacements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    student_id INTEGER,
    subject TEXT NOT NULL,
    original_date DATETIME NOT NULL,
    requested_date DATETIME NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_notes TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset requests (admin-approved, non-token flow)
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Classroom Activities
CREATE TABLE IF NOT EXISTS classroom_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Submissions
CREATE TABLE IF NOT EXISTS activity_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'submitted', 'graded')) DEFAULT 'pending',
    submitted_at DATETIME,
    grade REAL,
    FOREIGN KEY (activity_id) REFERENCES classroom_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Data
INSERT OR IGNORE INTO classes (id, name, course, period) VALUES
(1, 'DS1-M', 'Desenvolvimento de Sistemas', 'Matutino'),
(2, 'DS2-N', 'Desenvolvimento de Sistemas', 'Noturno'),
(3, 'MEC1-V', 'Mecânica', 'Vespertino');

INSERT OR IGNORE INTO users (id, name, email, password, role, class_id) VALUES 
(1, 'Admin User', 'admin@facilita.senai.br', 'hashed_secret', 'admin', NULL),
(2, 'Professor Silva', 'prof.silva@facilita.senai.br', 'hashed_secret', 'professor', NULL),
(3, 'Aluno João', 'joao.aluno@facilita.senai.br', 'hashed_secret', 'student', 1),
(4, 'Aluno Maria', 'maria.aluno@facilita.senai.br', 'hashed_secret', 'student', 2);

INSERT OR IGNORE INTO rooms (name, type, capacity) VALUES 
('Auditório Principal', 'auditorio', 200),
('Lab. Informática 1', 'laboratorio', 30),
('Oficina Mecânica A', 'mecanica', 20);
