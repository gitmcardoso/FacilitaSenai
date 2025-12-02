/* src/classroom/classroom-activities.js - Classroom integração */

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

    
    if (!matchedCourse && /^\d+$/.test(code) && typeof db.getTurmaById === 'function') {
      const turma = await db.getTurmaById(Number(code)).catch(()=>null);
      if (turma && turma.nome) {
        matchedCourse = courses.find(c => 
          (c.name && c.name.toLowerCase().includes(turma.nome.toLowerCase())) || 
          (c.section && c.section.toLowerCase().includes(turma.nome.toLowerCase()))
        );
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
          dueDate: work.dueDate ? new Date(work.dueDate.year, (work.dueDate.month||1)-1, work.dueDate.day).toISOString() : null,
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
          dueDate: work.dueDate ? new Date(work.dueDate.year, (work.dueDate.month||1)-1, work.dueDate.day).toISOString() : null,
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

app.get('/api/classroom/:code/atividades', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim();
    const requestUser = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
    console.log('[DEBUG] GET /api/classroom/atividades');
    console.log('[DEBUG] Code:', code);
    console.log('[DEBUG] Request user:', requestUser);

    
    const tokens = await readTokens();
    if (!tokens) {
      console.warn('[ERROR] No Google Classroom tokens found - falling back to mock activities');
      return getMockActivities();
    }
    console.log('[DEBUG] Google tokens found:', JSON.stringify({
      access_token: tokens.access_token ? '(present)' : '(missing)',
      refresh_token: tokens.refresh_token ? '(present)' : '(missing)',
      scope: tokens.scope,
      expiry_date: tokens.expiry_date
    }));

    
    const creds = loadGoogleCredentials();
    if (!creds) {
      console.warn('[ERROR] No Google credentials found - falling back to mock activities');
      return getMockActivities();
    }
    console.log('[DEBUG] Google credentials loaded successfully');

    
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      console.warn('[ERROR] Failed to create OAuth2 client - falling back to mock activities');
      return getMockActivities();
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
      console.warn('[DEBUG] Classroom API call failed:', err);
      console.log('[DEBUG] Falling back to mock activities');
      
      
      try {
        let turma = null;
        if (/^\d+$/.test(code) && typeof db.getTurmaById === 'function') {
          turma = await db.getTurmaById(Number(code)).catch(()=>null);
        }
        const now = Date.now();
        const activities = [
          { 
            id: 'a1', 
            title: `Exercício 1${turma ? ' — ' + (turma.nome||'') : ''}`, 
            description: 'Leia o material e responda as questões.', 
            dueDate: new Date(now + 2*24*3600*1000).toISOString(), 
            type: 'Tarefa', 
            points: 10 
          },
          { 
            id: 'a2', 
            title: 'Trabalho em grupo', 
            description: 'Apresentação em grupos de 3.', 
            dueDate: new Date(now + 7*24*3600*1000).toISOString(), 
            type: 'Apresentação', 
            points: 30 
          },
          { 
            id: 'a3', 
            title: 'Quiz rápido', 
            description: 'Quiz sobre conceitos básicos.', 
            dueDate: new Date(now + 1*24*3600*1000).toISOString(), 
            type: 'Quiz', 
            points: 5 
          }
        ];
        return res.json(activities);
      } catch (mockError) {
        console.error('[ERROR] Failed to generate mock activities:', mockError);
        return res.status(500).json({ error: 'Erro interno ao gerar atividades' });
      }
    }
  } catch (err) {
    console.error('[ERROR] Unexpected error in /api/classroom/atividades:', err);
    return res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
});