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
    const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

exports.getAuthUrl = (req, res) => {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(500).json({ message: 'Credentials not found' });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
        ],
    });
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
        console.error('Error retrieving access token', error);
        res.status(500).send('Error retrieving access token');
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
            console.log('[DEBUG] Classroom API call failed (non-auth); returning error');
            return res.status(500).json({ message: 'Erro ao acessar Google Classroom' });
        }
    } catch (err) {
        console.error('[ERROR] Unexpected error in /api/classroom/atividades:', err);
        return res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
};
