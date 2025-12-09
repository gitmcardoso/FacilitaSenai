/* src/controllers/googleClassroomController.js - Server */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const db = require('../config/db');

const CREDENTIALS_PATH = path.join(__dirname, '../classroom/google-credentials.json');
const TOKENS_PATH = path.join(__dirname, '../classroom/.google-classroom-tokens.json');


function loadCredentials() {
    if (fs.existsSync(CREDENTIALS_PATH)) {
        return JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    }
    return null;
}


function readTokens() {
    if (fs.existsSync(TOKENS_PATH)) {
        return JSON.parse(fs.readFileSync(TOKENS_PATH));
    }
    return null;
}


function saveTokens(tokens) {
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens));
}


function getOAuth2Client() {
    const creds = loadCredentials();
    if (!creds) return null;
    const cfg = creds.installed || creds.web;
    if (!cfg) {
        console.error('[ERROR] Google credentials file is missing expected `installed` or `web` object');
        return null;
    }
    const client_id = cfg.client_id;
    const client_secret = cfg.client_secret;
    const redirect_uris = cfg.redirect_uris || cfg.redirectUris || [];
    if (!client_id || !client_secret) {
        console.error('[ERROR] Google credentials are incomplete (client_id/client_secret missing)');
        return null;
    }
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

exports.getAuthUrl = (req, res) => {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(500).json({ message: 'Credentials not found' });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
        ],
    });
    console.log('[DEBUG] Generated Google authUrl:', authUrl);
    // If debug flag provided, return the URL as JSON for troubleshooting
    if (req.query && String(req.query.debug) === '1') {
        return res.json({ authUrl });
    }
    res.redirect(authUrl);
};

exports.authCallback = async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(500).json({ message: 'Credentials not found' });

    try {
        const { tokens } = await oauth2Client.getToken(code);
        saveTokens(tokens);
        res.send('Authentication successful! You can close this tab.');
    } catch (error) {
        console.error('Error retrieving access token', error && (error.stack || error));
        const detail = (error && (error.response && error.response.data)) ? error.response.data : (error && error.message) ? error.message : 'unknown error';
        // Return details to browser to help debugging redirect_uri_mismatch or other OAuth errors
        return res.status(500).json({ message: 'Error retrieving access token', detail });
    }
};

exports.clearTokens = (req, res) => {
    try {
        if (fs.existsSync(TOKENS_PATH)) {
            fs.unlinkSync(TOKENS_PATH);
            console.log('[DEBUG] Tokens file deleted');
        }
        return res.json({ message: 'Tokens cleared. Please reauthorize.' });
    } catch (err) {
        console.error('[ERROR] Error clearing tokens:', err && err.message);
        return res.status(500).json({ message: 'Failed to clear tokens', detail: err && err.message });
    }
};

exports.status = (req, res) => {
    try {
        const creds = loadCredentials();
        const tokens = readTokens();

        const now = Date.now();
        const info = {
            credentials: Boolean(creds),
            tokens: Boolean(tokens),
            token_scopes: tokens && tokens.scope ? tokens.scope : null,
            expiry_date: tokens && tokens.expiry_date ? tokens.expiry_date : null,
            expired: tokens && tokens.expiry_date ? (Number(tokens.expiry_date) <= now) : null
        };

        return res.json(info);
    } catch (err) {
        console.error('Error in googleClassroom status:', err);
        return res.status(500).json({ message: 'Failed to read google classroom status', detail: err && err.message });
    }
};

async function getClassroomActivities(code, classroom, requestUser) {
    try {
        console.log('[DEBUG] Getting classroom activities for code:', code);

        
        const coursesResp = await classroom.courses.list({
            pageSize: 200,
            fields: 'courses(id,name,section,enrollmentCode,description)'
        });

        const courses = coursesResp.data.courses || [];
        console.log('[DEBUG] Found', courses.length, 'classroom courses');

        
        let matchedCourse = null;

        
        if (code.length > 5) {
            matchedCourse = courses.find(c => c.id === code || c.enrollmentCode === code);
        }

        
        if (!matchedCourse && /^\d+$/.test(code)) {
            try {
                const [rows] = await db.execute('SELECT * FROM classes WHERE id = ?', [Number(code)]);
                const turma = rows[0];
                if (turma && turma.name) {
                    matchedCourse = courses.find(c =>
                        (c.name && c.name.toLowerCase().includes(turma.name.toLowerCase())) ||
                        (c.section && c.section.toLowerCase().includes(turma.name.toLowerCase()))
                    );
                }
            } catch (e) {
                console.error('Error fetching local class:', e);
            }
        }

        if (matchedCourse) {
            console.log('[DEBUG] Found matching course:', matchedCourse.name);
            const coursework = await classroom.courses.courseWork.list({
                courseId: matchedCourse.id,
                pageSize: 100,
                orderBy: 'dueDate desc',
                fields: 'courseWork(id,title,description,dueDate,creationTime,materials,workType,state,maxPoints)'
            });

            if (coursework && coursework.data && coursework.data.courseWork) {
                console.log('[DEBUG] Found', coursework.data.courseWork.length, 'activities');
                return coursework.data.courseWork.map(work => ({
                    id: work.id,
                    courseId: matchedCourse.id,
                    courseName: matchedCourse.name,
                    title: work.title || 'Sem título',
                    description: work.description || '',
                    dueDate: work.dueDate ? new Date(work.dueDate.year, (work.dueDate.month || 1) - 1, work.dueDate.day).toISOString() : null,
                    type: work.workType || 'ASSIGNMENT',
                    state: work.state || 'PUBLISHED',
                    points: work.maxPoints || null,
                    materials: work.materials || []
                }));
            }
        }

        console.log('[DEBUG] No direct course match found, fetching from first few courses');
        
        const coursesToFetch = courses.slice(0, 5);
        const allActivities = [];

        for (const course of coursesToFetch) {
            try {
                const coursework = await classroom.courses.courseWork.list({
                    courseId: course.id,
                    pageSize: 20,
                    orderBy: 'dueDate desc',
                    fields: 'courseWork(id,title,description,dueDate,creationTime,materials,workType,state,maxPoints)'
                });

                const courseActivities = (coursework.data.courseWork || []).map(work => ({
                    id: work.id,
                    courseId: course.id,
                    courseName: course.name,
                    title: work.title || 'Sem título',
                    description: work.description || '',
                    dueDate: work.dueDate ? new Date(work.dueDate.year, (work.dueDate.month || 1) - 1, work.dueDate.day).toISOString() : null,
                    type: work.workType || 'ASSIGNMENT',
                    state: work.state || 'PUBLISHED',
                    points: work.maxPoints || null,
                    materials: work.materials || []
                }));

                allActivities.push(...courseActivities);
            } catch (error) {
                console.warn('[DEBUG] Error fetching coursework for', course.name, error.message);
            }
        }

        return allActivities;
    } catch (error) {
        console.error('[DEBUG] Error in getClassroomActivities:', error);
        throw error;
    }
}

function getMockActivities(code) {
    
    try {
        const now = Date.now();
        const activities = [
            {
                id: 'a1',
                title: 'Exercício 1 (Mock)',
                description: 'Leia o material e responda as questões.',
                dueDate: new Date(now + 2 * 24 * 3600 * 1000).toISOString(),
                type: 'Tarefa',
                points: 10
            },
            {
                id: 'a2',
                title: 'Trabalho em grupo (Mock)',
                description: 'Apresentação em grupos de 3.',
                dueDate: new Date(now + 7 * 24 * 3600 * 1000).toISOString(),
                type: 'Apresentação',
                points: 30
            },
            {
                id: 'a3',
                title: 'Quiz rápido (Mock)',
                description: 'Quiz sobre conceitos básicos.',
                dueDate: new Date(now + 1 * 24 * 3600 * 1000).toISOString(),
                type: 'Quiz',
                points: 5
            }
        ];
        return activities;
    } catch (mockError) {
        console.error('[ERROR] Failed to generate mock activities:', mockError);
        return [];
    }
}

exports.getActivities = async (req, res) => {
    try {
        const code = String(req.params.code || '').trim();
        const requestUser = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
        console.log('[DEBUG] GET /api/classroom/atividades');
        console.log('[DEBUG] Code:', code);

        
        const tokens = readTokens();
        if (!tokens) {
            console.warn('[ERROR] No Google Classroom tokens found');
            
            return res.status(401).json({ message: 'Google authentication required' });
        }

        
        const oauth2Client = getOAuth2Client();
        if (!oauth2Client) {
            console.warn('[ERROR] Failed to create OAuth2 client');
            return res.status(500).json({ message: 'Google credentials not configured' });
        }

        oauth2Client.setCredentials(tokens);

        // If token appears expired but we have a refresh_token, try to refresh and persist new tokens
        try {
            const now = Date.now();
            const tokenExpiry = tokens && tokens.expiry_date ? Number(tokens.expiry_date) : null;
            if (tokenExpiry && tokenExpiry <= now && tokens.refresh_token) {
                console.log('[DEBUG] Access token expired — attempting refresh');
                await oauth2Client.getAccessToken();
                const updated = oauth2Client.credentials || {};
                if (!updated.refresh_token && tokens.refresh_token) updated.refresh_token = tokens.refresh_token;
                try {
                    saveTokens(updated);
                    console.log('[DEBUG] Refreshed tokens saved');
                } catch (e) {
                    console.warn('[DEBUG] Failed to save refreshed tokens', e && e.message);
                }
                oauth2Client.setCredentials(updated);
            }
        } catch (refreshErr) {
            console.warn('[DEBUG] Token refresh attempt failed:', refreshErr && (refreshErr.message || refreshErr));
        }

        try {
            const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
            const activities = await getClassroomActivities(code, classroom, requestUser);

            
            activities.sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                return dateB - dateA; 
            });

            return res.json(activities);
        } catch (err) {
            console.warn('[DEBUG] Classroom API call failed:', err && (err.message || err));
            
            const status = err && err.code ? err.code : (err && err.response && err.response.status ? err.response.status : null);
            if (status === 401) {
                console.warn('[DEBUG] Classroom API auth error - returning 401');
                return res.status(401).json({ message: 'Google authentication required' });
            }
            if (status === 403) {
                console.warn('[DEBUG] Classroom API permission error - returning 403');
                return res.status(403).json({ message: 'Insufficient Google Classroom permissions/scopes. Reauthorize via /api/auth/google/classroom' });
            }
            console.log('[DEBUG] Classroom API call failed (non-auth); returning error');
            const msg = (err && (err.message || (err.response && err.response.data) || JSON.stringify(err))) || 'Erro ao acessar Google Classroom';
            return res.status(500).json({ message: 'Erro ao acessar Google Classroom', detail: msg });
        }
    } catch (err) {
        console.error('[ERROR] Unexpected error in /api/classroom/atividades:', err);
        return res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
};

exports.sync = async (req, res) => {
    try {
        const code = String(req.params.code || '').trim();
        const userId = req.userId || null; 

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const tokens = readTokens();
        if (!tokens) return res.status(401).json({ message: 'Google authentication required' });

        const oauth2Client = getOAuth2Client();
        if (!oauth2Client) return res.status(500).json({ message: 'Google credentials not configured' });
        oauth2Client.setCredentials(tokens);

        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        const activities = await getClassroomActivities(code, classroom, { id: userId });

        if (!activities || activities.length === 0) return res.json({ message: 'No activities found', synced: 0 });

        let synced = 0;
        for (const act of activities) {
            try {
                const due = act.dueDate || null;
                const title = act.title || '';
                const desc = act.description || '';

                const [rows] = await db.execute('SELECT id FROM classroom_activities WHERE title = ? AND (due_date IS ? OR due_date = ?)', [title, due, due]);
                if (rows && rows.length > 0) {
                    continue;
                }

                await db.execute('INSERT INTO classroom_activities (title, description, due_date, created_by) VALUES (?, ?, ?, ?)', [title, desc, due, userId]);
                synced++;
            } catch (e) {
                console.warn('Error inserting activity', e && e.message);
            }
        }

        return res.json({ message: 'Sync completed', synced });
    } catch (err) {
        console.error('Sync error', err);
        return res.status(500).json({ message: 'Sync failed', error: err && err.message });
    }
};
