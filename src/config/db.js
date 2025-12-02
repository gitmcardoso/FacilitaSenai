/* src/config/db.js - Project file */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const schemaPath = path.resolve(__dirname, '../../schema_sqlite.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_courses'", (err, row) => {
        if (err) {
            console.error('Error checking tables:', err && err.message);
            return;
        }

        if (!row) {
            console.log('Database appears to be missing some tables, initializing schema...');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error executing schema:', err.message);
                } else {
                    console.log('Database schema initialized or updated.');
                }
            });
        } else {
            
            db.all("PRAGMA table_info('users')", (err, cols) => {
                if (err) return console.error('Error reading users table info:', err.message);

                const existing = (cols || []).map(c => c.name);

                const needed = [
                    { name: 'cpf', sql: "ALTER TABLE users ADD COLUMN cpf TEXT UNIQUE" },
                    { name: 'phone', sql: "ALTER TABLE users ADD COLUMN phone TEXT" },
                    { name: 'address', sql: "ALTER TABLE users ADD COLUMN address TEXT" },
                    { name: 'role', sql: "ALTER TABLE users ADD COLUMN role TEXT" },
                    { name: 'class_id', sql: "ALTER TABLE users ADD COLUMN class_id INTEGER" },
                    { name: 'course_end_date', sql: "ALTER TABLE users ADD COLUMN course_end_date DATE" },
                    { name: 'created_at', sql: "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
                    { name: 'updated_at', sql: "ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
                    { name: 'must_change_password', sql: "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1" }
                ];

                needed.forEach(col => {
                    if (!existing.includes(col.name)) {
                        db.run(col.sql, (e) => {
                            if (e) {
                                
                                console.error(`Error adding column ${col.name}:`, e.message);
                            } else {
                                console.log(`Added missing column '${col.name}' to users table.`);
                            }
                        });
                    }
                });
                
                db.all("PRAGMA table_info('replacements')", (err2, cols2) => {
                    if (err2) return console.error('Error reading replacements table info:', err2.message);
                    const existingRep = (cols2 || []).map(c => c.name);
                    const repNeeded = [
                        { name: 'approved_by', sql: "ALTER TABLE replacements ADD COLUMN approved_by INTEGER" },
                        { name: 'approved_at', sql: "ALTER TABLE replacements ADD COLUMN approved_at DATETIME" }
                    ];
                    repNeeded.forEach(col => {
                        if (!existingRep.includes(col.name)) {
                            db.run(col.sql, (e) => {
                                if (e) console.error(`Error adding column ${col.name} to replacements:`, e.message);
                                else console.log(`Added missing column '${col.name}' to replacements table.`);
                            });
                        }
                    });
                });
                
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='password_resets'", (err3, row3) => {
                    if (err3) return console.error('Error checking password_resets table:', err3.message);
                    if (!row3) {
                        const create = `CREATE TABLE IF NOT EXISTS password_resets (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            token TEXT NOT NULL,
                            expires_at DATETIME NOT NULL,
                            used INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )`;
                        db.run(create, (e) => { if (e) console.error('Error creating password_resets:', e.message); else console.log('Created password_resets table'); });
                    }
                });
                
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_requests'", (err4, row4) => {
                    if (err4) return console.error('Error checking password_reset_requests table:', err4.message);
                    if (!row4) {
                        const create = `CREATE TABLE IF NOT EXISTS password_reset_requests (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            email TEXT NOT NULL,
                            status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
                            approved_by INTEGER,
                            approved_at DATETIME,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
                        )`;
                        db.run(create, (e) => { if (e) console.error('Error creating password_reset_requests:', e.message); else console.log('Created password_reset_requests table'); });
                    }
                });
                
                db.all("PRAGMA table_info('jobs')", (errJobs, colsJobs) => {
                    if (errJobs) return console.error('Error reading jobs table info:', errJobs.message);
                    const existingJobs = (colsJobs || []).map(c => c.name);
                    const jobNeeded = [
                        { name: 'position', sql: "ALTER TABLE jobs ADD COLUMN position TEXT" },
                        { name: 'schedule', sql: "ALTER TABLE jobs ADD COLUMN schedule TEXT" },
                        { name: 'address', sql: "ALTER TABLE jobs ADD COLUMN address TEXT" },
                        { name: 'salary', sql: "ALTER TABLE jobs ADD COLUMN salary TEXT" }
                    ];
                    jobNeeded.forEach(col => {
                        if (!existingJobs.includes(col.name)) {
                            db.run(col.sql, (e) => {
                                if (e) console.error(`Error adding column ${col.name} to jobs:`, e.message);
                                else console.log(`Added missing column '${col.name}' to jobs table.`);
                            });
                        }
                    });
                });
                
                db.all("PRAGMA table_info('job_applications')", (errJA, colsJA) => {
                    if (errJA) return console.error('Error reading job_applications table info:', errJA.message);
                    const existingJA = (colsJA || []).map(c => c.name);
                    const jaNeeded = [
                        { name: 'message', sql: "ALTER TABLE job_applications ADD COLUMN message TEXT" },
                        { name: 'cv', sql: "ALTER TABLE job_applications ADD COLUMN cv TEXT" }
                    ];
                    jaNeeded.forEach(col => {
                        if (!existingJA.includes(col.name)) {
                            db.run(col.sql, (e) => {
                                if (e) console.error(`Error adding column ${col.name} to job_applications:`, e.message);
                                else console.log(`Added missing column '${col.name}' to job_applications table.`);
                            });
                        }
                    });
                });
                
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'", (errN, rowN) => {
                    if (errN) return console.error('Error checking notifications table:', errN.message);
                    if (!rowN) {
                        const createNot = `CREATE TABLE IF NOT EXISTS notifications (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            title TEXT NOT NULL,
                            message TEXT,
                            url TEXT,
                            read INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )`;
                        db.run(createNot, (e) => { if (e) console.error('Error creating notifications table:', e.message); else console.log('Created notifications table'); });
                    }
                });
            });
        }
    });
}


const dbWrapper = {
    execute: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            
            const trimmedSql = sql.trim().toUpperCase();
            if (trimmedSql.startsWith('SELECT')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows, []]); 
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
                });
            }
        });
    }
};

module.exports = dbWrapper;
