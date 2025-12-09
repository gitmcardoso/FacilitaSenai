/* public/js/dashboard.js - Frontend JS UI */
document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = '/login.html';
        return;
    }

    const user = JSON.parse(userStr);

    
    lucide.createIcons();

    
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = translateRole(user.role);
    document.getElementById('user-initials').textContent = user.name.charAt(0).toUpperCase();

    
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsBtnSidebar = document.getElementById('notificationsBtnSidebar');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsCount = document.getElementById('notificationsCount');
    const notificationsCountSidebar = document.getElementById('notificationsCountSidebar');
    const notificationsList = document.getElementById('notificationsList');
    const notificationsClose = document.getElementById('notificationsClose');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    async function fetchNotifications() {
        try {
            const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return console.error('Failed to fetch notifications');
            const list = await res.json();
            renderNotifications(list || []);
        } catch (err) {
            console.error('fetchNotifications error', err);
        }
    }

    function renderNotifications(list) {
        if (!notificationsList) return;
        notificationsList.innerHTML = '';
        if (!list || list.length === 0) {
            const empty = document.createElement('div');
            empty.id = 'notificationsEmpty';
            empty.style.padding = '12px';
            empty.style.color = 'var(--text-secondary)';
            empty.textContent = 'Sem notificações';
            notificationsList.appendChild(empty);
            notificationsCount.style.display = 'none';
            return;
        }

        
        const unread = list.filter(n => !n.read).length;
        if (unread > 0) {
            if (notificationsCount) { notificationsCount.textContent = String(unread); notificationsCount.style.display = 'inline-block'; }
            if (notificationsCountSidebar) { notificationsCountSidebar.textContent = String(unread); notificationsCountSidebar.style.display = 'inline-block'; }
        } else {
            if (notificationsCount) notificationsCount.style.display = 'none';
            if (notificationsCountSidebar) notificationsCountSidebar.style.display = 'none';
        }

        list.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.style.padding = '10px 12px';
            item.style.borderBottom = '1px solid #f2f2f2';
            item.style.background = n.read ? 'transparent' : 'rgba(0,0,0,0.03)';

            const title = document.createElement('div');
            title.style.fontWeight = '600';
            title.style.fontSize = '0.95rem';
            title.textContent = n.title || '';

            const msg = document.createElement('div');
            msg.style.fontSize = '0.85rem';
            msg.style.color = 'var(--text-secondary)';
            msg.style.marginTop = '4px';
            msg.style.whiteSpace = 'pre-wrap';
            msg.textContent = n.message || '';

            const meta = document.createElement('div');
            meta.style.marginTop = '6px';
            meta.style.display = 'flex';
            meta.style.gap = '8px';

            const time = document.createElement('small');
            time.style.color = 'var(--text-secondary)';
            time.textContent = n.created_at ? String(n.created_at) : '';

            const openBtn = document.createElement('button');
            openBtn.className = 'small';
            openBtn.textContent = n.url ? 'Abrir' : (n.read ? 'Lida' : 'Marcar lida');
            openBtn.style.marginLeft = 'auto';
            openBtn.style.cursor = 'pointer';
            openBtn.style.background = 'transparent';
            openBtn.style.border = 'none';
            openBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!n.read) {
                    await markAsRead(n.id);
                }
                if (n.url) {
                    window.open(n.url, '_blank');
                } else {
                    await fetchNotifications();
                }
            });

            meta.appendChild(time);
            meta.appendChild(openBtn);

            item.appendChild(title);
            if (n.message) item.appendChild(msg);
            item.appendChild(meta);

            notificationsList.appendChild(item);
        });
    }

    async function markAsRead(id) {
        try {
            const res = await fetch('/api/notifications/' + id + '/read', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                await fetchNotifications();
            }
        } catch (err) { console.error('markAsRead error', err); }
    }

    async function markAllRead() {
        try {
            const res = await fetch('/api/notifications/read-all', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) await fetchNotifications();
        } catch (err) { console.error('markAllRead error', err); }
    }

    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!notificationsPanel) return;
            
            if (!notificationsPanel) return;
            
            document.body.appendChild(notificationsPanel);
            const rect = notificationsBtn.getBoundingClientRect();
            const isMobile = window.innerWidth <= 1024;
            if (isMobile) {
                notificationsPanel.classList.add('mobile');
                notificationsPanel.style.position = 'fixed';
                notificationsPanel.style.top = '0px';
                notificationsPanel.style.left = '0px';
                notificationsPanel.style.right = '0px';
                notificationsPanel.style.width = '100%';
            } else {
                notificationsPanel.classList.remove('mobile');
                notificationsPanel.style.position = 'fixed';
                notificationsPanel.style.top = (rect.bottom + 8) + 'px';
                
                const panelWidth = Math.min(360, window.innerWidth - 20);
                let left = rect.right - panelWidth;
                if (left < 8) left = 8;
                notificationsPanel.style.left = left + 'px';
                notificationsPanel.style.width = panelWidth + 'px';
            }
            const open = notificationsPanel.style.display === 'block';
            if (!open) {
                notificationsPanel.style.display = 'block';
                fetchNotifications();
            } else {
                notificationsPanel.style.display = 'none';
            }
        });
    }

    
    if (notificationsBtnSidebar) {
        notificationsBtnSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            if (!notificationsPanel) return;
            if (!notificationsPanel) return;
            document.body.appendChild(notificationsPanel);
            const rect = notificationsBtnSidebar.getBoundingClientRect();
            const isMobile = window.innerWidth <= 1024;
            if (isMobile) {
                notificationsPanel.classList.add('mobile');
                notificationsPanel.style.position = 'fixed';
                notificationsPanel.style.top = '0px';
                notificationsPanel.style.left = '0px';
                notificationsPanel.style.right = '0px';
                notificationsPanel.style.width = '100%';
            } else {
                notificationsPanel.classList.remove('mobile');
                notificationsPanel.style.position = 'fixed';
                notificationsPanel.style.top = (rect.bottom + 8) + 'px';
                const panelWidth = Math.min(360, window.innerWidth - 20);
                
                let left = rect.left;
                
                if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8;
                notificationsPanel.style.left = left + 'px';
                notificationsPanel.style.width = panelWidth + 'px';
            }
            const open = notificationsPanel.style.display === 'block';
            if (!open) {
                notificationsPanel.style.display = 'block';
                fetchNotifications();
            } else {
                notificationsPanel.style.display = 'none';
            }
        });
    }

    if (notificationsClose) notificationsClose.addEventListener('click', () => { if (notificationsPanel) notificationsPanel.style.display = 'none'; });
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', async (e) => { e.preventDefault(); await markAllRead(); });

    
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationsPanel');
        const btn = document.getElementById('notificationsBtn');
        const btnSide = document.getElementById('notificationsBtnSidebar');
        if (!panel) return;
        const clickedOnBtnOrPanel = (btn && btn.contains(e.target)) || (btnSide && btnSide.contains(e.target)) || panel.contains(e.target);
        if (!clickedOnBtnOrPanel) panel.style.display = 'none';
    });

    
    setInterval(async () => {
        try {
            const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const list = await res.json();
            const unread = (list || []).filter(n => !n.read).length;
            if (unread > 0) {
                notificationsCount.textContent = String(unread);
                notificationsCount.style.display = 'inline-block';
            } else {
                notificationsCount.style.display = 'none';
            }
        } catch (err) {  }
    }, 30000);

    
    (function setHeaderDate() {
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const now = new Date();
        const dayName = weekdays[now.getDay()];
        const dayNum = String(now.getDate()).padStart(2, '0');
        const monthName = months[now.getMonth()];
        const formatted = `${dayName}, ${dayNum} de ${monthName}`;
        const el = document.getElementById('current-date');
        if (el) el.textContent = formatted;
    })();

    
    if (user.role === 'admin') {
        document.getElementById('admin-users-link').style.display = 'block';
    }

    
    const navLinks = document.querySelectorAll('.nav-link[data-module]');
    const pageTitle = document.getElementById('page-title');
    const contentArea = document.getElementById('content-area');

    
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('open');
        });

        
        contentArea.addEventListener('click', () => {
            if (window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }

    // helper to apply active state and page title for a module
    function setActiveModule(moduleName) {
        if (!moduleName) return;
        document.querySelectorAll('.nav-link[data-module]').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const span = activeLink.querySelector('span');
            if (span && pageTitle) pageTitle.textContent = span.textContent || 'Dashboard';
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const moduleName = link.dataset.module;
            if (moduleName) {
                // set active immediately for instant visual feedback
                setActiveModule(moduleName);
                // also update hash to enable back/forward and history
                location.hash = moduleName;
                // load the module immediately (hashchange may be delayed)
                loadModule(moduleName);
            }
        });
    });

    
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    
    // load initial module from hash (if present) so direct links work
    (function loadInitialFromHash() {
        const hash = (location.hash || '').replace('#', '').trim();
        const initial = hash ? hash : 'home';
        setActiveModule(initial);
        loadModule(initial);
    })();

    // allow back/forward navigation between modules using hash
    window.addEventListener('hashchange', () => {
        const moduleName = (location.hash || '').replace('#', '').trim();
        if (moduleName) {
            setActiveModule(moduleName);
            loadModule(moduleName);
        }
    });

    function translateRole(role) {
        const map = {
            'admin': 'Administrador',
            'professor': 'Docente',
            'student': 'Aluno'
        };
        return map[role] || role;
    }

    
    function computeRangeFromMonth(year, month) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1; 
        const start = new Date(y, m, 1, 0, 0, 0, 0);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        return [start, end];
    }

    
    function computeRange(dateStr, period) {
        
        
        const d = new Date(dateStr + 'T00:00:00');
        d.setHours(0, 0, 0, 0);
        let start = new Date(d);
        let end = new Date(d);
        if (period === 'day') {
            end.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            const day = d.getDay();
            const diff = (day === 0 ? -6 : 1 - day);
            start = new Date(d);
            start.setDate(d.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }
        return [start, end];
    }

    async function loadModule(moduleName) {
        contentArea.innerHTML = '<div class="loading">Carregando...</div>';

        let html = '';
        
        try {
            switch (moduleName) {
                case 'home':
                    html = getHomeModule(user);
                    break;
                case 'schedules':
                    html = await Promise.race([
                        getSchedulesModule(user),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                    ]).catch(err => {
                        console.error('schedules load error:', err);
                        return '<div class="card"><h3>Erro ao carregar agendamentos</h3><p>Tente novamente em alguns momentos.</p></div>';
                    });
                    break;
                case 'classroom':
                    html = getClassroomModule();
                    break;
                case 'replacements':
                    html = await Promise.race([
                        getReplacementsModule(user),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                    ]).catch(err => {
                        console.error('replacements load error:', err);
                        return '<div class="card"><h3>Erro ao carregar reposições</h3><p>Tente novamente em alguns momentos.</p></div>';
                    });
                    break;
                case 'jobs':
                    html = await Promise.race([
                        getJobsModule(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                    ]).catch(err => {
                        console.error('jobs load error:', err);
                        return '<div class="card"><h3>Erro ao carregar vagas</h3><p>Tente novamente em alguns momentos.</p></div>';
                    });
                    break;
                case 'users':
                    try {
                        const res = await fetch('/admin_users.html');
                        if (!res.ok) throw new Error('Failed to load users module');
                        const text = await res.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        html = doc.body.innerHTML;
                    } catch (e) {
                        console.error(e);
                        html = '<div class="card"><h3>Erro ao carregar módulo de usuários</h3></div>';
                    }
                    break;
                default:
                    html = '<div class="card"><h3>Módulo não encontrado</h3></div>';
            }
        } catch (error) {
            console.error('loadModule error:', error);
            html = '<div class="card"><h3>Erro ao carregar módulo</h3></div>';
        }

        contentArea.innerHTML = html;
        
        // Initialize module-specific scripts
        if (moduleName === 'users') {
            if (window.initAdminUsers) {
                try { window.initAdminUsers(); } catch (e) { console.error('initAdminUsers error', e); }
            } else {
                const s = document.createElement('script');
                s.src = '/js/admin_users.js';
                s.onload = () => { if (window.initAdminUsers) window.initAdminUsers(); };
                document.body.appendChild(s);
            }
        }
        
        if (moduleName === 'home' && window.initHomeModule) {
            // delay slightly to ensure DOM is fully rendered
            setTimeout(() => {
                try { window.initHomeModule(); } catch (e) { console.error('initHomeModule error', e); }
            }, 100);
        }
        lucide.createIcons();
    }

    
    window.loadModule = loadModule;

    
    const modals = {
        schedule: document.getElementById('scheduleModal'),
        replacement: document.getElementById('replacementModal')
    };

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
    }

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) modal.classList.remove('open');
        });
    });

    
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            
            if (!data.date || !data.start_time || !data.end_time || !data.room_id) return alert('Preencha data, início, fim e sala.');

            const startIso = data.date + 'T' + data.start_time + ':00';
            const endIso = data.date + 'T' + data.end_time + ':00';
            const startDt = new Date(startIso);
            const endDt = new Date(endIso);

            if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) return alert('Horários inválidos');
            if (startDt >= endDt) return alert('A hora de início deve ser anterior à hora de término.');

            
            const earliest = 8; const latest = 21;
            const startHour = startDt.getHours();
            const endHour = endDt.getHours() + (endDt.getMinutes() > 0 || endDt.getSeconds() > 0 ? 1 : 0); 
            if (startHour < earliest || endHour > latest) return alert('Reservas só podem ser feitas entre 08:00 e 21:00.');

            
            try {
                const resAll = await fetch('/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resAll.ok) return alert('Erro ao verificar conflitos');
                const allSchedules = await resAll.json();

                
                const sameRoom = allSchedules.filter(s => String(s.room_id) === String(data.room_id));
                const newStart = startDt.getTime();
                const newEnd = endDt.getTime();

                const overlap = sameRoom.some(sch => {
                    
                    let sStart = null; let sEnd = null;
                    try {
                        if (sch.start_time) sStart = new Date((sch.start_time || '').replace(' ', 'T'));
                        if (sch.end_time) sEnd = new Date((sch.end_time || '').replace(' ', 'T'));
                    } catch (err) { console.warn('parse schedule times', err); }
                    if (!sStart || isNaN(sStart.getTime())) return false;
                    if (!sEnd || isNaN(sEnd.getTime())) {
                        
                        sEnd = new Date(sStart.getTime() + (60 * 60 * 1000));
                    }
                    const s1 = sStart.getTime();
                    const e1 = sEnd.getTime();
                    
                    return (newStart < e1 && s1 < newEnd);
                });

                if (overlap) return alert('Já existe um agendamento nesse horário e sala. Escolha outro horário ou sala.');

                
                data.start_time = `${data.date} ${data.start_time}:00`;
                data.end_time = `${data.date} ${data.end_time}:00`;
                delete data.date;

                const res = await fetch('/api/schedules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('Reserva criada com sucesso!');
                    closeModal('scheduleModal');
                    loadModule('schedules'); 
                } else {
                    const err = await res.json();
                    alert(err.message || 'Erro ao criar reserva');
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao criar reserva');
            }
        });
    }

    
    const replacementForm = document.getElementById('replacementForm');
    if (replacementForm) {
        replacementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/replacements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('Solicitação enviada!');
                    closeModal('replacementModal');
                    loadModule('replacements'); 
                } else {
                    const err = await res.json();
                    alert(err.message);
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao solicitar reposição');
            }
        });
    }

    
    const indicationForm = document.getElementById('indicationForm');
    if (indicationForm) {
        indicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch(`/api/jobs/${data.job_id}/indicate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('Indicação realizada com sucesso!');
                    closeModal('indicationModal');
                } else {
                    const err = await res.json();
                    alert(err.message);
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao indicar aluno');
            }
        });
    }

    
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const method = data.id ? 'PUT' : 'POST';
                const url = data.id ? `/api/jobs/${data.id}` : '/api/jobs';
                
                const payload = {
                    title: data.title,
                    company: data.company,
                    position: data.position || null,
                    schedule: data.schedule || null,
                    address: data.address || null,
                    salary: data.salary || null,
                    description: data.description,
                    type: data.type
                };

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert('Vaga salva com sucesso');
                    closeModal('jobModal');
                    loadModule('jobs');
                } else {
                    const err = await res.json();
                    alert(err.message || 'Erro ao salvar vaga');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }

    
    const classroomSyncForm = document.getElementById('classroomSyncForm');
    if (classroomSyncForm) {
        classroomSyncForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const code = formData.get('courseCode');
            if (!code) return alert('Informe o código da turma');

            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sincronizando...';
            btn.disabled = true;

            try {
                const res = await fetch(`/api/classroom/${code}/atividades`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    
                    if (confirm('É necessário autenticar com o Google. Redirecionar agora?')) {
                        window.location.href = '/api/auth/google/classroom';
                    }
                    return;
                }

                if (res.ok) {
                    const activities = await res.json();
                    
                    window.latestClassroomActivities = activities || [];
                    window.latestClassroomCode = code;

                    alert(`Sincronização concluída! ${window.latestClassroomActivities.length} atividades encontradas.`);
                    closeModal('classroomSyncModal');
                    loadModule('classroom'); 
                } else {
                    const err = await res.json();
                    alert(err.message || 'Erro ao sincronizar');
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    
    function openApplyModal(jobId, jobTitle) {
        const modal = document.getElementById('applyModal');
        if (!modal) return;
        const jobIdInput = document.getElementById('applyJobId');
        const jobTitleEl = modal.querySelector('.modal-header h3');
        if (jobIdInput) jobIdInput.value = jobId;
        if (jobTitleEl) jobTitleEl.textContent = `Candidatar-se: ${jobTitle}`;
        modal.classList.add('open');
    }

    
    window.openApplyModal = openApplyModal;
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const jobId = data.job_id || document.getElementById('applyJobId').value;
            try {
                const res = await fetch(`/api/jobs/${jobId}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ message: data.message || null, cv: data.cv || null })
                });
                if (res.ok) {
                    alert('Candidatura enviada com sucesso');
                    
                    document.getElementById('applyModal').classList.remove('open');
                    loadModule('jobs');
                } else {
                    const err = await res.json();
                    alert(err.message || 'Erro ao enviar candidatura');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }

    
    window.openApplicationsModal = async function (jobId, jobTitle) {
        const modal = document.getElementById('applicationsModal');
        const titleSpan = document.getElementById('applicationsJobTitle');
        const appContent = document.getElementById('appContent');
        if (!modal || !appContent) return;
        titleSpan.textContent = jobTitle || `Vaga ${jobId}`;
        appContent.innerHTML = '<div style="padding:12px;">Carregando candidaturas...</div>';

        try {
            const res = await fetch(`/api/jobs/${jobId}/applications`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                appContent.innerHTML = `<div style="padding:12px;color:#a33">Erro ao carregar candidaturas</div>`;
                modal.classList.add('open');
                return;
            }

            const apps = await res.json();

            if (!apps || apps.length === 0) {
                appContent.innerHTML = '<div style="padding:12px;">Nenhuma candidatura encontrada.</div>';
                modal.classList.add('open');
                return;
            }

            
            let html = `
                <div style="overflow:auto; max-height:480px;">
                <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background:var(--primary-color); color:white;">
                        <th style="padding:8px;text-align:left;">Aluno</th>
                        <th style="padding:8px;text-align:left;">Email</th>
                        <th style="padding:8px;text-align:left;">Status</th>
                        <th style="padding:8px;text-align:left;">Enviado Em</th>
                        <th style="padding:8px;text-align:left;">Mensagem</th>
                        <th style="padding:8px;text-align:left;">CV / Portfólio</th>
                        <th style="padding:8px;text-align:left;">Indicado Por</th>
                    </tr>
                </thead>
                <tbody>
            `;

            apps.forEach(a => {
                const sent = a.applied_at || a.created_at || '';
                const msg = a.message ? `<div style="max-width:320px; white-space:pre-wrap;">${escapeHtml(a.message)}</div>` : '';
                const cv = a.cv ? (isValidUrl(a.cv) ? `<a href="${a.cv}" target="_blank" rel="noopener">Abrir</a>` : `${escapeHtml(a.cv)}`) : '';
                html += `
                    <tr>
                        <td style="padding:8px;">${escapeHtml(a.student_name || '')}</td>
                        <td style="padding:8px;">${escapeHtml(a.student_email || '')}</td>
                        <td style="padding:8px;">${escapeHtml(a.status || '')}</td>
                        <td style="padding:8px;">${escapeHtml(sent)}</td>
                        <td style="padding:8px;">${msg}</td>
                        <td style="padding:8px;">${cv}</td>
                        <td style="padding:8px;">${escapeHtml(a.indicated_by_name || '')}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            appContent.innerHTML = html;
            modal.classList.add('open');
        } catch (err) {
            console.error('Error loading applications', err);
            appContent.innerHTML = `<div style="padding:12px;color:#a33">Erro ao carregar candidaturas</div>`;
            modal.classList.add('open');
        }
    };

    
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (s) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" })[s];
        });
    }

    function isValidUrl(s) {
        try { new URL(s); return true; } catch (e) { return false; }
    }

    function openIndicateModal(jobId, jobTitle) {
        document.getElementById('indicationJobId').value = jobId;
        document.getElementById('indicationJobTitle').textContent = `Indicar para: ${jobTitle}`;
        openModal('indicationModal');
    }

    
    window.openModal = openModal;
    window.openIndicateModal = openIndicateModal;

    function getHomeModule(user) {
        return `
            <div class="dashboard-grid">
                <!-- Hero banner (laranja) -->
                <div class="card hero-orange">
                    <div style="width:100%; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <h3 style="margin:0;">Painel Rápido</h3>
                            <p style="margin:0; opacity:0.95;">Resumo e atalhos importantes</p>
                        </div>
                        <div style="text-align:right; opacity:0.95; font-size:0.95rem;">Acesse suas ações rápidas</div>
                    </div>
                </div>
                <div class="card home-welcome" style="grid-column: 1 / -1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3>Bem-vindo, ${user.name}!</h3>
                            <p>Você está logado como ${translateRole(user.role)}.</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="font-size:0.9rem; color:var(--text-secondary);">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="card stat-card">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:50px; height:50px; border-radius:12px; background:rgba(0,69,128,0.1); display:flex; align-items:center; justify-content:center; color:var(--primary-color);">
                            <i data-lucide="calendar" style="width:24px; height:24px;"></i>
                        </div>
                        <div>
                            <h4 style="font-size:1.5rem; margin-bottom:0;">--</h4>
                            <span style="font-size:0.85rem; color:var(--text-secondary);">Agendamentos Hoje</span>
                        </div>
                    </div>
                </div>

                <div class="card stat-card">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:50px; height:50px; border-radius:12px; background:rgba(5,205,153,0.1); display:flex; align-items:center; justify-content:center; color:var(--status-success);">
                            <i data-lucide="check-circle" style="width:24px; height:24px;"></i>
                        </div>
                        <div>
                            <h4 style="font-size:1.5rem; margin-bottom:0;">--</h4>
                            <span style="font-size:0.85rem; color:var(--text-secondary);">Aulas Confirmadas</span>
                        </div>
                    </div>
                </div>

                <div class="card stat-card">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:50px; height:50px; border-radius:12px; background:rgba(255,102,0,0.1); display:flex; align-items:center; justify-content:center; color:var(--secondary-color);">
                            <i data-lucide="briefcase" style="width:24px; height:24px;"></i>
                        </div>
                        <div>
                            <h4 style="font-size:1.5rem; margin-bottom:0;">--</h4>
                            <span style="font-size:0.85rem; color:var(--text-secondary);">Vagas Abertas</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card quick-actions-card" style="grid-column: 1 / -1;">
                    <h4 style="margin-bottom:15px;">Ações Rápidas</h4>
                    <div style="display:flex; gap:15px; flex-wrap:wrap; align-items:center;">
                        ${user.role !== 'student' ? `
                        <button class="qa-btn btn qa-primary" onclick="loadModule('schedules'); setTimeout(() => openModal('scheduleModal'), 300);">
                            <i data-lucide="plus" style="width:16px; height:16px; vertical-align:middle; margin-right:8px;"></i> Nova Reserva
                        </button>
                        <button class="qa-btn btn qa-orange" onclick="loadModule('jobs'); setTimeout(() => openModal('jobModal'), 300);">
                            <i data-lucide="briefcase" style="width:16px; height:16px; vertical-align:middle; margin-right:8px;"></i> Criar Vaga
                        </button>
                        ` : ''}
                        <button class="qa-btn btn qa-orange" onclick="loadModule('replacements'); setTimeout(() => openModal('replacementModal'), 300);">
                            <i data-lucide="refresh-cw" style="width:16px; height:16px; vertical-align:middle; margin-right:8px;"></i> Solicitar Reposição
                        </button>
                    </div>
                </div>

                <div class="card large home-upcoming" id="upcomingSchedulesCard">
                    <h3>Próximos Agendamentos</h3>
                    <div id="upcomingSchedulesContent">Carregando...</div>
                </div>
                <!-- Caixa azul lateral (pequena) -->
                <div class="card side-blue" style="grid-column: 2;">
                    <div style="padding:12px; text-align:center;">
                        <h4 style="margin:0; color:#fff; font-size:1rem;">Aulas Confirmadas</h4>
                        <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.9);">--</p>
                    </div>
                </div>
                <div class="card large home-secondary" id="secondaryCard">
                    <h3 id="secondaryCardTitle">Carregando...</h3>
                    <div id="secondaryCardContent">Aguarde...</div>
                </div>
            </div>
        `;
    }

    
    window.initHomeModule = async function () {
        // Helper to wait for element to exist in DOM
        const waitForElement = (selector, timeout = 3000) => {
            return new Promise((resolve) => {
                const element = document.querySelector(selector);
                if (element) return resolve(element);
                
                const observer = new MutationObserver(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        observer.disconnect();
                        resolve(el);
                    }
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
                
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
        };
        
        try {
            // Ensure elements are in the DOM before fetching
            await waitForElement('#upcomingSchedulesContent', 2000);
            await waitForElement('#secondaryCardContent', 2000);
            
            await fetchUpcomingSchedulesCard();
            await fetchSecondaryCard();
        } catch (e) { console.error('initHomeModule error', e); }
    };

    async function fetchUpcomingSchedulesCard() {
        const container = document.getElementById('upcomingSchedulesContent');
        if (!container) return;
        container.innerHTML = 'Carregando...';
        try {
            const res = await fetch('/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { container.innerHTML = 'Erro ao carregar'; return; }
            const list = await res.json();
            const now = new Date();
            const filtered = (list || []).filter(s => {
                
                let st = null;
                try { st = new Date((s.start_time || '').replace(' ', 'T')); } catch (e) { st = new Date(s.start_time); }
                if (isNaN(st.getTime())) return false;
                if (st < now) return false;
                if (user.role === 'admin') return true;
                if (user.role === 'student') {
                    return (s.class_id && Number(s.class_id) === Number(user.class_id));
                }
                if (user.role === 'professor') {
                    return (Number(s.user_id) === Number(user.id)) || (s.class_id && Number(s.class_id) === Number(user.class_id));
                }
                return false;
            });
            filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            const items = filtered.slice(0, 5);
            if (items.length === 0) {
                container.innerHTML = '<div style="padding:12px;color:var(--text-secondary);">Nenhum agendamento próximo.</div>';
                return;
            }
            const html = items.map(s => {
                const st = new Date((s.start_time || '').replace(' ', 'T'));
                const formatted = st.toLocaleString();
                return `<div class="home-item"><strong>${escapeHtml(s.title || '')}</strong><div style="font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(s.room_name || '')} • ${formatted}${s.class_name ? ' • ' + escapeHtml(s.class_name) : ''}</div></div>`;
            }).join('');
            container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${html}</div>`;
        } catch (err) { console.error(err); container.innerHTML = 'Erro ao carregar'; }
    }

    async function fetchSecondaryCard() {
        const titleEl = document.getElementById('secondaryCardTitle');
        const container = document.getElementById('secondaryCardContent');
        if (!container || !titleEl) return;
        container.innerHTML = 'Carregando...';
        try {
            if (user.role === 'admin') {
                titleEl.textContent = 'Candidaturas Recentes';
                const res = await fetch('/api/jobs/applications/all', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) { container.innerHTML = 'Erro ao carregar candidaturas'; return; }
                const apps = await res.json();
                if (!apps || apps.length === 0) { container.innerHTML = '<div style="padding:12px;color:var(--text-secondary);">Nenhuma candidatura recente.</div>'; return; }
                const items = apps.slice(0, 6).map(a => {
                    return `<div class="home-item"><strong>${escapeHtml(a.student_name || '')}</strong><div style="font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(a.title || '')} • ${escapeHtml(a.company || '')} • ${escapeHtml(a.status || '')}</div></div>`;
                }).join('');
                container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${items}</div>`;
                return;
            }

            
            titleEl.textContent = 'Reposições (pendentes / confirmadas)';
            const res = await fetch('/api/replacements', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { container.innerHTML = 'Erro ao carregar reposições'; return; }
            const reps = await res.json();
            if (!reps || reps.length === 0) { container.innerHTML = '<div style="padding:12px;color:var(--text-secondary);">Nenhuma reposição encontrada.</div>'; return; }
            const items2 = reps.slice(0, 6).map(r => {
                const date = r.requested_date ? new Date((r.requested_date || '').replace(' ', 'T')).toLocaleString() : '';
                return `<div class="home-item"><strong>${escapeHtml(r.subject || '')}</strong><div style="font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(r.status || '')} • ${date}</div></div>`;
            }).join('');
            container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${items2}</div>`;
        } catch (err) { console.error(err); container.innerHTML = 'Erro ao carregar'; }
    }

    async function getSchedulesModule(user) {
        
        try {
            const [roomsRes, schedulesRes, classesRes] = await Promise.all([
                fetch('/api/schedules/rooms', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const rooms = await roomsRes.json();
            const schedules = await schedulesRes.json();
            const classes = await classesRes.json();

            

            
            const roomSelect = document.getElementById('roomSelect');
            if (roomSelect) {
                roomSelect.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
            }

            
            const classSelect = document.getElementById('classSelect');
            if (classSelect) {
                classSelect.innerHTML = '<option value="">Selecione uma turma...</option>' +
                    classes.map(c => `<option value="${c.id}">${c.name} (${c.period})</option>`).join('');
            }

            
            (function initScheduleTimeControls() {
                const startSel = document.getElementById('startTimeSelect');
                const endSel = document.getElementById('endTimeSelect');
                const roomSel = document.getElementById('roomSelect');
                const dateInp = document.getElementById('scheduleDateInput');
                if (!startSel || !endSel) return;

                
                function buildOpts() {
                    startSel.innerHTML = '';
                    endSel.innerHTML = '';
                    for (let h = 8; h <= 20; h++) {
                        const val = String(h).padStart(2, '0') + ':00';
                        const opt = document.createElement('option'); opt.value = val; opt.textContent = val; startSel.appendChild(opt);
                    }
                    for (let h = 9; h <= 21; h++) {
                        const val = String(h).padStart(2, '0') + ':00';
                        const opt = document.createElement('option'); opt.value = val; opt.textContent = val; endSel.appendChild(opt);
                    }
                }

                function computeOccupiedHoursFor(roomId, dateStr) {
                    const occ = new Set();
                    if (!roomId || !dateStr) return occ;
                    const dayStart = new Date(dateStr + 'T00:00:00');
                    const dayEnd = new Date(dateStr + 'T23:59:59');
                    schedules.forEach(sch => {
                        if (String(sch.room_id) !== String(roomId)) return;
                        let s = null; let e = null;
                        try { if (sch.start_time) s = new Date((sch.start_time || '').replace(' ', 'T')); if (sch.end_time) e = new Date((sch.end_time || '').replace(' ', 'T')); } catch (err) { return; }
                        if (!s || isNaN(s.getTime())) return; if (!e || isNaN(e.getTime())) e = new Date(s.getTime() + 60*60*1000);
                        
                        if (e <= dayStart || s >= dayEnd) return;
                        const intS = s < dayStart ? new Date(dayStart) : new Date(s);
                        const intE = e > dayEnd ? new Date(dayEnd) : new Date(e);
                        const cursor = new Date(intS); cursor.setMinutes(0,0,0);
                        while (cursor < intE) {
                            occ.add(cursor.getHours());
                            cursor.setHours(cursor.getHours() + 1);
                        }
                    });
                    return occ;
                }

                function updateDisabledOptions() {
                    const roomId = roomSel ? roomSel.value : null;
                    const dateVal = dateInp && dateInp.value ? dateInp.value : new Date().toISOString().slice(0,10);
                    const occupied = computeOccupiedHoursFor(roomId, dateVal);

                    
                    Array.from(startSel.options).forEach(opt => {
                        const hour = parseInt(opt.value.split(':')[0], 10);
                        opt.disabled = occupied.has(hour);
                    });

                    
                    const selStart = startSel.value ? parseInt(startSel.value.split(':')[0], 10) : null;

                    Array.from(endSel.options).forEach(opt => {
                        const endHour = parseInt(opt.value.split(':')[0], 10);
                        
                        if (selStart === null) {
                            
                            let blocked = false;
                            for (let h = 8; h < endHour; h++) if (occupied.has(h)) { blocked = true; break; }
                            opt.disabled = blocked;
                        } else {
                            if (endHour <= selStart) { opt.disabled = true; return; }
                            
                            let blocked = false;
                            for (let h = selStart; h < endHour; h++) if (occupied.has(h)) { blocked = true; break; }
                            opt.disabled = blocked;
                        }
                    });

                    
                    if (startSel.selectedIndex === -1 || startSel.options[startSel.selectedIndex].disabled) {
                        const ok = Array.from(startSel.options).findIndex(o => !o.disabled);
                        if (ok >= 0) startSel.selectedIndex = ok;
                    }
                    if (endSel.selectedIndex === -1 || endSel.options[endSel.selectedIndex].disabled) {
                        const ok2 = Array.from(endSel.options).findIndex(o => !o.disabled && parseInt(o.value.split(':')[0],10) > parseInt(startSel.value.split(':')[0],10));
                        if (ok2 >= 0) endSel.selectedIndex = ok2;
                    }
                }

                
                buildOpts();

                
                if (roomSel) roomSel.addEventListener('change', updateDisabledOptions);
                if (dateInp) dateInp.addEventListener('change', updateDisabledOptions);
                startSel.addEventListener('change', updateDisabledOptions);

                
                const schedModal = document.getElementById('scheduleModal');
                if (schedModal) {
                    const obs = new MutationObserver((mut) => {
                        mut.forEach(m => { if (m.attributeName === 'class') { if (schedModal.classList.contains('open')) updateDisabledOptions(); } });
                    });
                    obs.observe(schedModal, { attributes: true });
                }

                
                setTimeout(updateDisabledOptions, 200);
            })();

            
            const hours = Array.from({ length: 14 }, (_, i) => i + 8); 

            
            (function () { })();
            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth() + 1; 
            const yearOptions = [];
            
            for (let y = curYear - 1; y <= curYear + 3; y++) yearOptions.push(y);

            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            let monthsHtml = '';
            for (let m = 1; m <= 12; m++) {
                const disabled = (m < curMonth && curYear === curYear) ? '' : '';
                monthsHtml += `<option value="${m}" ${m < curMonth && curYear === curYear ? 'disabled' : ''}>${m.toString().padStart(2, '0')} - ${monthNames[m - 1]}</option>`;
            }

            let yearsHtml = '';
            yearOptions.forEach(y => {
                yearsHtml += `<option value="${y}" ${y < curYear ? 'disabled' : ''}>${y}</option>`;
            });

            
            const todayIso = new Date().toISOString().slice(0, 10);
            let controlsHtml = `
                <div class="period-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                    <label style="font-size:0.85rem;color:var(--text-secondary);">Data</label>
                    <input type="date" id="scheduleDateInput" value="${todayIso}" min="${todayIso}" />
                    <button id="scheduleApply" class="btn btn-secondary">Aplicar</button>
                </div>
            `;

            let gridHtml = `
                <div class="timeline-grid">
                    <div class="timeline-header">Salas / Horários</div>
                    ${hours.map(h => `<div class="timeline-header">${h}:00</div>`).join('')}
            `;

            rooms.forEach(room => {
                gridHtml += `
                    <div class="room-row">
                        <div class="room-label">${room.name} <br>${room.type}</div>
                        ${hours.map(h => `<div class="time-slot" data-room="${room.id}" data-hour="${h}"></div>`).join('')}
                    </div>
                `;
            });

            gridHtml += '</div>';

            
            function computeRangeFromMonth(year, month) {
                const y = parseInt(year, 10);
                const m = parseInt(month, 10) - 1; 
                const start = new Date(y, m, 1, 0, 0, 0, 0);
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
                return [start, end];
            }

            
            setTimeout(() => {
                function renderScheduleEvents() {
                    
                    
                    
                    
                    try {
                        const timelineView = document.querySelector('.timeline-view');
                        if (timelineView && timelineView.parentNode) {
                            const newTimeline = timelineView.cloneNode(true);
                            timelineView.parentNode.replaceChild(newTimeline, timelineView);
                            
                            void newTimeline.offsetHeight;
                            console.log('Recreated timeline DOM to avoid stale nodes');
                        }
                    } catch (e) {
                        console.warn('Timeline DOM recreation failed', e);
                    }

                    
                    document.querySelectorAll('.time-slot').forEach(s => s.innerHTML = '');

                    
                    const dateInput = document.getElementById('scheduleDateInput');
                    const dateVal = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().slice(0, 10);
                    const [start, end] = computeRange(dateVal, 'day');

                    
                    let placedCount = 0;

                    schedules.forEach(sch => {
                        
                        
                        let st;
                        try {
                            if (typeof sch.start_time === 'string' && sch.start_time.includes(' ')) {
                                st = new Date(sch.start_time.replace(' ', 'T'));
                            } else {
                                st = new Date(sch.start_time);
                            }
                        } catch (e) {
                            st = new Date(sch.start_time);
                        }

                        if (isNaN(st.getTime())) {
                            
                            try {
                                st = new Date((sch.start_time || '').replace(' ', 'T') + ':00');
                            } catch (e) {
                                console.warn('Cannot parse schedule.start_time:', sch.start_time);
                                return; 
                            }
                        }

                        
                        
                        let sStart = null; let sEnd = null;
                        try {
                            if (sch.start_time) sStart = new Date((sch.start_time || '').replace(' ', 'T'));
                            if (sch.end_time) sEnd = new Date((sch.end_time || '').replace(' ', 'T'));
                        } catch (err) { console.warn('parse schedule times', err); }
                        if (!sStart || isNaN(sStart.getTime())) return;
                        if (!sEnd || isNaN(sEnd.getTime())) {
                            
                            sEnd = new Date(sStart.getTime() + (60 * 60 * 1000));
                        }

                        
                        if (sEnd <= start || sStart >= end) {
                            
                        } else {
                            
                            const intStart = sStart < start ? new Date(start) : new Date(sStart);
                            const intEnd = sEnd > end ? new Date(end) : new Date(sEnd);

                            
                            const cursor = new Date(intStart);
                            cursor.setMinutes(0, 0, 0);

                            let firstAppended = false;
                            while (cursor < intEnd) {
                                const hour = cursor.getHours();
                                const slot = document.querySelector(`.time-slot[data-room="${sch.room_id}"][data-hour="${hour}"]`);
                                if (slot) {
                                    
                                    if (!firstAppended) {
                                        const div = document.createElement('div');
                                        div.className = 'event-block';
                                        div.textContent = `${sch.title} - ${sch.user_name || 'Usuário'}`;
                                        const classInfo = sch.class_name ? ` - ${sch.class_name}` : '';
                                        div.title = `${sch.title} (${sch.user_name})${classInfo}`;
                                        try { div.dataset.schedule = encodeURIComponent(JSON.stringify(sch)); } catch (e) { div.dataset.schedule = '' + (sch.id || ''); }
                                        div.addEventListener('click', (ev) => {
                                            ev.stopPropagation();
                                            try { const raw = div.dataset.schedule; if (!raw) return; const data = JSON.parse(decodeURIComponent(raw)); openScheduleDetailModal(data); } catch (err) { console.error('Failed to parse schedule data', err); }
                                        });
                                        slot.appendChild(div);
                                        firstAppended = true;
                                    }

                                    
                                    try {
                                        slot.classList.add('slot-highlight');
                                        if (!slot.querySelector('.slot-indicator')) {
                                            const ind = document.createElement('div');
                                            ind.className = 'slot-indicator';
                                            slot.appendChild(ind);
                                        }
                                    } catch (e) { console.warn('highlight append error', e); }
                                    placedCount++;
                                }
                                
                                cursor.setHours(cursor.getHours() + 1);
                            }
                        }
                    });

                    
                }

                
                const applyBtn = document.getElementById('scheduleApply');
                const dateInp = document.getElementById('scheduleDateInput');
                const todayIso2 = new Date().toISOString().slice(0, 10);
                if (dateInp) { dateInp.min = todayIso2; if (!dateInp.value) dateInp.value = todayIso2; }
                if (applyBtn) applyBtn.addEventListener('click', (e) => { e.preventDefault(); renderScheduleEvents(); });
                
                if (dateInp) dateInp.addEventListener('change', (e) => { renderScheduleEvents(); });

                

                
                renderScheduleEvents();
            }, 150);

            
            function openScheduleDetailModal(sch) {
                try {
                    const modal = document.getElementById('scheduleDetailModal');
                    if (!modal) return;
                    const titleEl = document.getElementById('sd_title');
                    const metaEl = document.getElementById('sd_meta');
                    const descEl = document.getElementById('sd_description');
                    const timeEl = document.getElementById('sd_time');

                    if (titleEl) titleEl.textContent = sch.title || (sch.name || 'Agendamento');
                    let meta = [];
                    if (sch.room_name) meta.push(sch.room_name);
                    if (sch.class_name) meta.push(sch.class_name);
                    if (sch.user_name) meta.push(sch.user_name);
                    if (metaEl) metaEl.textContent = meta.join(' • ');
                    if (descEl) descEl.textContent = sch.description || sch.reason || '';
                    let timeStr = '';
                    if (sch.start_time) {
                        const st = new Date((sch.start_time || '').replace(' ', 'T'));
                        timeStr = st.toLocaleString();
                    }
                    if (sch.end_time) {
                        const en = new Date((sch.end_time || '').replace(' ', 'T'));
                        timeStr += ' — ' + en.toLocaleString();
                    }
                    if (!timeStr && sch.requested_date) {
                        const d = new Date((sch.requested_date || '').replace(' ', 'T'));
                        timeStr = d.toLocaleString();
                    }
                    if (timeEl) timeEl.textContent = timeStr;

                    modal.classList.add('open');
                } catch (err) { console.error('openScheduleDetailModal error', err); }
            }

            
            const monthNamesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

            function buildScheduleCalendarHtml(baseDate) {
                const date = new Date(baseDate);
                const month = monthNamesFull[date.getMonth()];
                const year = date.getFullYear();

                
                const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
                const firstDay = new Date(year, date.getMonth(), 1).getDay(); 

                let calendarHtml = `
                    <div class="calendar-container" style="margin-bottom: 20px;">
                        <div class="calendar-header">
                            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sab</div>
                        </div>
                        <div class="calendar-body">
                `;

                
                for (let i = 0; i < firstDay; i++) {
                    calendarHtml += '<div class="calendar-day empty"></div>';
                }

                
                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDayStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    
                    const daySchedules = schedules.filter(s => {
                        let st;
                        try {
                            st = new Date((s.start_time || '').replace(' ', 'T'));
                        } catch (e) { st = new Date(s.start_time); }
                        return st.getDate() === day && st.getMonth() === date.getMonth() && st.getFullYear() === date.getFullYear();
                    });

                    const isBusy = daySchedules.length > 0;
                    const busyClass = isBusy ? 'has-events' : '';
                    const busyIndicator = isBusy ? `<div style="font-size:0.7rem; color:var(--primary-color); margin-top:2px;">${daySchedules.length} reservas</div>` : '';

                    calendarHtml += `
                        <div class="calendar-day ${busyClass}" onclick="document.getElementById('scheduleDateInput').value='${currentDayStr}'; document.getElementById('scheduleApply').click();">
                            <div class="day-number">${day}</div>
                            ${busyIndicator}
                        </div>
                    `;
                }

                calendarHtml += '</div></div>';
                return { calendarHtml, month, year };
            }

            
            const initialDate = new Date();
            const builtCal = buildScheduleCalendarHtml(initialDate);

            
            setTimeout(() => {
                const schedMonth = document.getElementById('schedMonth');
                const schedYear = document.getElementById('schedYear');
                const schedApplyCal = document.getElementById('schedApplyCal');

                function updateCalendar() {
                    const m = schedMonth.value;
                    const y = schedYear.value;
                    const d = new Date(y, m - 1, 1);
                    const built = buildScheduleCalendarHtml(d);
                    const container = document.querySelector('#scheduleCalendarWrapper');
                    if (container) {
                        container.innerHTML = built.calendarHtml;
                        const header = document.getElementById('scheduleCalendarTitle');
                        if (header) header.textContent = `Calendário - ${built.month}/${built.year}`;
                    }
                }

                if (schedApplyCal) schedApplyCal.addEventListener('click', (e) => { e.preventDefault(); updateCalendar(); });
            }, 150);

            
            const calControlsHtml = `
                <div class="period-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap; border-bottom:1px solid #eee; padding-bottom:12px;">
                    <label style="font-size:0.85rem;color:var(--text-secondary);">Mês</label>
                    <select id="schedMonth">${monthsHtml}</select>
                    <label style="font-size:0.85rem;color:var(--text-secondary);">Ano</label>
                    <select id="schedYear">${yearsHtml}</select>
                    <button id="schedApplyCal" class="btn btn-secondary">Ver Mês</button>
                </div>
            `;

            return `
                <div class="card">
                    <div class="card-header">
                        <h3>Agendamento de Salas</h3>
                        ${user.role !== 'student' ? '<button class="btn btn-primary" onclick="openModal(\'scheduleModal\')">Nova Reserva</button>' : ''}
                    </div>
                    
                    <div style="padding: 0 20px;">
                        <h4 id="scheduleCalendarTitle" style="margin-bottom:10px;">Calendário - ${builtCal.month}/${builtCal.year}</h4>
                        ${calControlsHtml}
                        <div id="scheduleCalendarWrapper">
                            ${builtCal.calendarHtml}
                        </div>
                    </div>

                    <div style="border-top:1px solid #eee; margin: 20px 0;"></div>

                    <div style="padding: 0 20px;">
                        <h4 style="margin-bottom:10px;">Visão Diária</h4>
                        ${controlsHtml}
                        <div class="timeline-view">
                            ${gridHtml}
                        </div>
                        <div class="legend">
                            <div class="legend-item"><div class="color-box" style="background: var(--primary-light)"></div> Ocupado</div>
                            <div class="legend-item"><div class="color-box" style="background: #f4f7fe; border: 1px dashed #ccc"></div> Livre</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(error);
            return '<div class="card"><h3>Erro ao carregar agendamentos</h3></div>';
        }
    }

    async function getReplacementsModule(user) {
        try {
            const res = await fetch('/api/replacements', { headers: { 'Authorization': `Bearer ${token}` } });
            const replacements = await res.json();

            
            if (user.role !== 'student') {
                const studentsRes = await fetch('/api/users/students', { headers: { 'Authorization': `Bearer ${token}` } });
                if (studentsRes.ok) {
                    const students = await studentsRes.json();
                    const studentSelect = document.getElementById('studentSelect');
                    const studentSelectGroup = document.getElementById('studentSelectGroup');

                    if (studentSelect && studentSelectGroup) {
                        studentSelect.innerHTML = '<option value="">Selecione um aluno...</option>' +
                            students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                        studentSelectGroup.style.display = 'block';
                    }
                }
            }

            
            let pendingHtml = '';
            if (user.role === 'professor' || user.role === 'admin') {
                const pending = replacements.filter(r => r.status === 'pending');
                if (pending.length > 0) {
                    pendingHtml = `
                        <div class="card" style="margin-bottom: 16px;">
                            <div class="card-header"><h4>Solicitações Pendentes</h4></div>
                            <div style="padding:12px;">
                                <table style="width:100%; border-collapse: collapse;">
                                    <thead>
                                        <tr><th>Aluno</th><th>Assunto</th><th>Data sugerida</th><th>Motivo</th><th>Ações</th></tr>
                                    </thead>
                                    <tbody>
                                        ${pending.map(p => `
                                            <tr>
                                                <td>${p.student_name || ''}</td>
                                                <td>${p.subject}</td>
                                                <td>${new Date(p.requested_date).toLocaleString()}</td>
                                                <td>${p.reason}</td>
                                                <td>
                                                    <button class="btn btn-primary" onclick="approveReplacement(${p.id})">Aprovar</button>
                                                    <button class="btn btn-secondary" onclick="rejectReplacement(${p.id})">Rejeitar</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } else {
                    pendingHtml = '<div class="card" style="margin-bottom:16px;"><div class="card-header"><h4>Solicitações Pendentes</h4></div><div style="padding:12px;">Nenhuma solicitação pendente.</div></div>';
                }
            }

            
            
            const now2 = new Date();
            const curY2 = now2.getFullYear();
            const curM2 = now2.getMonth() + 1;
            const yearOpts2 = [];
            for (let y = curY2 - 1; y <= curY2 + 3; y++) yearOpts2.push(y);
            const monthNames2 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const monthNamesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

            let monthsHtml2 = '';
            for (let m = 1; m <= 12; m++) {
                monthsHtml2 += `<option value="${m}" ${m < curM2 ? 'disabled' : ''}>${m.toString().padStart(2, '0')} - ${monthNames2[m - 1]}</option>`;
            }
            let yearsHtml2 = '';
            yearOpts2.forEach(y => { yearsHtml2 += `<option value="${y}" ${y < curY2 ? 'disabled' : ''}>${y}</option>`; });

            const controlsHtml = `
                <div class="period-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                    <label style="font-size:0.85rem;color:var(--text-secondary);">Mês</label>
                    <select id="replMonth">${monthsHtml2}</select>
                    <label style="font-size:0.85rem;color:var(--text-secondary);">Ano</label>
                    <select id="replYear">${yearsHtml2}</select>
                    <button id="replApply" class="btn btn-secondary">Aplicar</button>
                </div>
            `;

            
            function buildCalendarHtml(baseDate) {
                const date = new Date(baseDate);
                const month = monthNamesFull[date.getMonth()];
                const year = date.getFullYear();

                
                const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
                const firstDay = new Date(year, date.getMonth(), 1).getDay(); 

                let calendarHtml = `
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sab</div>
                        </div>
                        <div class="calendar-body">
                `;

                
                for (let i = 0; i < firstDay; i++) {
                    calendarHtml += '<div class="calendar-day empty"></div>';
                }

                
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayEvents = replacements.filter(r => {
                        const rDate = new Date(r.requested_date);
                        return rDate.getDate() === day && rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear();
                    });

                    const eventsHtml = dayEvents.map(r => `
                        <div class="calendar-event status-${r.status}" title="${r.subject} - ${r.reason} ${r.student_name ? '(' + r.student_name + ')' : ''}">
                            ${r.subject} ${r.student_name ? '(' + r.student_name + ')' : ''}
                        </div>
                    `).join('');

                    calendarHtml += `
                        <div class="calendar-day">
                            <div class="day-number">${day}</div>
                            ${eventsHtml}
                        </div>
                    `;
                }

                calendarHtml += '</div></div>';
                return { calendarHtml, month, year };
            }

            
            const built = buildCalendarHtml(new Date());

            setTimeout(() => {
                
                const replApply = document.getElementById('replApply');
                const replDate = document.getElementById('replDate');
                const replPeriod = document.getElementById('replPeriod');

                function computeRange(dateStr, period) {
                    
                    const d = new Date(dateStr);
                    d.setHours(0, 0, 0, 0);
                    let start = new Date(d);
                    let end = new Date(d);
                    if (period === 'day') {
                        end.setHours(23, 59, 59, 999);
                    } else if (period === 'week') {
                        const day = d.getDay();
                        const diff = (day === 0 ? -6 : 1 - day);
                        start = new Date(d);
                        start.setDate(d.getDate() + diff);
                        start.setHours(0, 0, 0, 0);
                        end = new Date(start);
                        end.setDate(start.getDate() + 6);
                        end.setHours(23, 59, 59, 999);
                    } else if (period === 'month') {
                        start = new Date(d.getFullYear(), d.getMonth(), 1);
                        start.setHours(0, 0, 0, 0);
                        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                        end.setHours(23, 59, 59, 999);
                    }
                    return [start, end];
                }

                function renderCalendarForSelection() {
                    const monthSel = document.getElementById('replMonth');
                    const yearSel = document.getElementById('replYear');
                    const selMonth = monthSel ? monthSel.value : (new Date().getMonth() + 1).toString();
                    const selYear = yearSel ? yearSel.value : new Date().getFullYear().toString();
                    const [start, end] = computeRangeFromMonth(selYear, selMonth);

                    const viewDate = new Date(selYear, parseInt(selMonth, 10) - 1, 1);
                    const builtInner = buildCalendarHtml(viewDate);
                    const calendarContainer = document.querySelector('.calendar-container');
                    if (calendarContainer) {
                        
                        calendarContainer.outerHTML = builtInner.calendarHtml;

                        
                        const card = document.querySelector('.calendar-container') ? document.querySelector('.calendar-container').closest('.card') : null;
                        if (card) {
                            const h3 = card.querySelector('.card-header h3');
                            if (h3) h3.textContent = `Reposições de Aula - ${builtInner.month}/${builtInner.year}`;
                        }
                    }
                }

                if (replApply) replApply.addEventListener('click', (e) => { e.preventDefault(); renderCalendarForSelection(); });

                
                const replMonth = document.getElementById('replMonth');
                const replYear = document.getElementById('replYear');
                if (replYear && replMonth) {
                    replYear.addEventListener('change', () => {
                        const selY = parseInt(replYear.value, 10);
                        const nowY = new Date().getFullYear();
                        const nowM = new Date().getMonth() + 1;
                        Array.from(replMonth.options).forEach(opt => {
                            const m = parseInt(opt.value, 10);
                            opt.disabled = selY === nowY ? (m < nowM) : (selY < nowY);
                        });
                    });
                    
                    replYear.value = replYear.value || new Date().getFullYear();
                    replMonth.value = replMonth.value || (new Date().getMonth() + 1);
                }
            }, 100);

            return `
                ${pendingHtml}
                <div class="card">
                    <div class="card-header">
                        <h3>Reposições de Aula - ${built.month}/${built.year}</h3>
                        <button class="btn btn-primary" onclick="openModal('replacementModal')">Nova Solicitação</button>
                    </div>
                    ${controlsHtml}
                    ${built.calendarHtml}
                </div>
            `;
        } catch (error) {
            console.error(error);
            return '<div class="card"><h3>Erro ao carregar reposições</h3></div>';
        }
    }

    
    window.approveReplacement = async function (id) {
        if (!confirm('Confirmar aprovação desta reposição?')) return;
        try {
            const res = await fetch(`/api/replacements/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'approved' })
            });
            if (res.ok) {
                alert('Reposição aprovada');
                loadModule('replacements');
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao aprovar');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao aprovar reposição');
        }
    };

    window.rejectReplacement = async function (id) {
        if (!confirm('Confirmar rejeição desta reposição?')) return;
        try {
            const res = await fetch(`/api/replacements/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (res.ok) {
                alert('Reposição rejeitada');
                loadModule('replacements');
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao rejeitar');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao rejeitar reposição');
        }
    };

    function getClassroomModule() {
        const activities = (window.latestClassroomActivities || []);
        const code = window.latestClassroomCode || '';

        const header = `
            <div class="card-header">
                <h3>Google Classroom ${code ? '• Turma: ' + code : ''}</h3>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button class="btn btn-secondary" onclick="openModal('classroomSyncModal')">Sincronizar</button>
                    <button class="btn" onclick="(async ()=>{ window.latestClassroomActivities = null; loadModule('classroom'); })()">Limpar</button>
                </div>
            </div>
        `;

        let bodyHtml = '';
        if (!activities || activities.length === 0) {
            bodyHtml = `<div class="activity-feed"><div class="activity-item" style="padding: 15px; border-bottom: 1px solid #eee;color:var(--text-secondary);">Nenhuma atividade sincronizada. Clique em \"Sincronizar\" para importar do Google Classroom.</div></div>`;
        } else {
            const items = activities.map(a => {
                const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Sem data';
                const title = a.title || a.name || 'Sem título';
                const desc = a.description ? `<div style="margin-top:6px;color:var(--text-secondary);white-space:pre-wrap;">${escapeHtml(a.description)}</div>` : '';
                return `
                    <div class="activity-item" style="padding: 12px; border-bottom: 1px solid #eee;">
                        <h4 style="margin:0 0 6px 0;">${escapeHtml(title)}</h4>
                        <div style="font-size:0.9rem;color:var(--text-secondary);">Entrega: ${escapeHtml(due)}</div>
                        ${desc}
                    </div>
                `;
            }).join('');

            bodyHtml = `<div class="activity-feed">${items}</div>`;
        }

        return `<div class="card">${header}${bodyHtml}</div>`;
    }

    async function getJobsModule() {
        try {
            const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } });
            const jobs = await res.json();

            const typeLabels = { 'estagio': 'Estágio', 'emprego': 'Emprego', 'jovem_aprendiz': 'Jovem Aprendiz' };
            const typeColors = { 'estagio': '#4CAF50', 'emprego': '#2196F3', 'jovem_aprendiz': '#FF9800' };

            let jobsHtml = '';
            if (jobs.length === 0) {
                jobsHtml = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma vaga disponível.</p>';
            } else {
                jobs.forEach(job => {
                    let btnHtml = '';

                    
                    if (user.role === 'student') {
                        btnHtml += `<button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Candidatar-se</button>`;
                    } else {
                        
                        btnHtml += `<button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" onclick="openApplicationsModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Ver Candidaturas</button>`;
                        btnHtml += `<button class="btn btn-secondary" style="width: 100%; margin-top: 8px;" onclick="openIndicateModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Indicar Aluno</button>`;
                    }

                    jobsHtml += `
                        <div class="job-card" style="border: 1px solid #eee; padding: 15px; border-radius: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <h4 style="margin: 0;">${job.title}</h4>
                                <span style="background: ${typeColors[job.type]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; white-space: nowrap;">${typeLabels[job.type]}</span>
                            </div>
                            <p style="color: var(--text-secondary); margin: 8px 0; font-weight: 600;"><i data-lucide="building-2" style="width: 16px; height: 16px;"></i> ${job.company} ${job.position ? ' - ' + job.position : ''}</p>
                            ${job.schedule ? `<p style="margin:6px 0; color:var(--text-secondary)"><strong>Horário:</strong> ${job.schedule}</p>` : ''}
                            ${job.address ? `<p style="margin:6px 0; color:var(--text-secondary)"><strong>Endereço:</strong> ${job.address}</p>` : ''}
                            ${job.salary ? `<p style="margin:6px 0; color:var(--text-secondary)"><strong>Valor:</strong> ${job.salary}</p>` : ''}
                            <p style="margin: 12px 0; line-height: 1.5;">${job.description}</p>
                            ${job.requirements ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 8px;"><strong>Requisitos:</strong> ${job.requirements}</p>` : ''}
                            ${btnHtml}
                        </div>
                    `;
                });
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <h3>Vagas de Emprego e Estágio</h3>
                        ${user.role !== 'student' ? '<button class="btn btn-primary" onclick="openModal(\'jobModal\')">Nova Vaga</button>' : ''}
                    </div>
                    <div class="jobs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px;">
                        ${jobsHtml}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(error);
            return '<div class="card"><h3>Erro ao carregar vagas</h3><p>Não foi possível carregar as vagas. Tente novamente.</p></div>';
        }
    }

    
    function getProfileHtml() {
        return `
            <div class="card">
                <div class="card-header"><h3>Perfil</h3></div>
                <div style="padding:16px;">
                    <form id="profileForm">
                        <div class="form-group"><label>Nome</label><input id="p_name" name="name" required /></div>
                        <div class="form-group"><label>CPF</label><input id="p_cpf" name="cpf" disabled /></div>
                        <div class="form-group"><label>Email</label><input id="p_email" name="email" type="email" required /></div>
                        <div class="form-group"><label>Telefone</label><input id="p_phone" name="phone" /></div>
                        <div class="form-group"><label>Endereço</label><input id="p_address" name="address" /></div>
                        <div class="form-group"><label>Cursos</label><select id="p_courses" multiple disabled style="min-height:80px;"></select></div>
                        <div class="form-group"><label>Término do curso</label><input id="p_course_end_date" name="course_end_date" type="date" disabled /></div>
                        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;"><button type="submit" class="btn btn-primary">Salvar</button></div>
                        <div id="p_message" style="margin-top:10px;color:#333;"></div>
                    </form>
                </div>
            </div>
        `;
    }

    async function initProfileModule() {
        const token = localStorage.getItem('token');
        const msg = document.getElementById('p_message');
        const pForm = document.getElementById('profileForm');
        if (!pForm) return;

        try {
            const res = await fetch('/api/users/' + user.id, { headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) { msg.textContent = 'Erro ao carregar perfil'; return; }
            const u = await res.json();

            document.getElementById('p_name').value = u.name || '';
            document.getElementById('p_cpf').value = u.cpf || '';
            document.getElementById('p_email').value = u.email || '';
            document.getElementById('p_phone').value = u.phone || '';
            document.getElementById('p_address').value = u.address || '';
            document.getElementById('p_course_end_date').value = u.course_end_date || '';

            const select = document.getElementById('p_courses');
            const classesRes = await fetch('/api/classes', { headers: { 'Authorization': 'Bearer ' + token } });
            if (classesRes.ok) {
                const classes = await classesRes.json();
                const uniq = Array.from(new Set(classes.map(c => c.course).filter(Boolean))).sort();
                select.innerHTML = uniq.map(c => `<option value="${c}">${c}</option>`).join('');
                const userCourses = u.courses || [];
                Array.from(select.options).forEach(opt => { if (userCourses.includes(opt.value)) opt.selected = true; });
            }

            pForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                msg.textContent = '';
                const selectedCourses = select ? Array.from(select.selectedOptions).map(o => o.value) : [];
                const payload = {
                    name: document.getElementById('p_name').value.trim(),
                    cpf: document.getElementById('p_cpf').value.trim(),
                    phone: document.getElementById('p_phone').value.trim(),
                    email: document.getElementById('p_email').value.trim(),
                    address: document.getElementById('p_address').value.trim(),
                    role: user.role,
                    courses: selectedCourses,
                    course_end_date: document.getElementById('p_course_end_date').value || null,
                    password: null
                };

                try {
                    const upd = await fetch('/api/users/' + user.id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify(payload)
                    });
                    const data = await upd.json();
                    if (!upd.ok) return msg.textContent = data.message || 'Erro ao salvar perfil';
                    msg.textContent = 'Perfil atualizado com sucesso';
                } catch (err) { console.error(err); msg.textContent = 'Erro de conexão'; }
            });

        } catch (err) { console.error(err); msg.textContent = 'Erro ao carregar dados'; }
    }

    
    const profileNav = document.querySelector('.nav-link[data-module="profile"]');
    if (profileNav && (user.role === 'professor' || user.role === 'student')) {
        const li = document.getElementById('profile-link'); if (li) li.style.display = 'block';
        profileNav.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link[data-module]').forEach(l => l.classList.remove('active'));
            profileNav.classList.add('active');
            document.getElementById('page-title').textContent = profileNav.querySelector('span').textContent;
            contentArea.innerHTML = getProfileHtml();
            initProfileModule();
        });
    }
});

