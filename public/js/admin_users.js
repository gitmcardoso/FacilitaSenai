/* public/js/admin_users.js - Frontend JS for UI and interactions */
async function initAdminUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado como administrador para acessar esta página.');
        window.location.href = '/login.html';
        return;
    }

    const userForm = document.getElementById('userForm');
    const usersTableBody = document.querySelector('#usersTable tbody');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const formMessage = document.getElementById('formMessage');

    let editingId = null;

    async function fetchUsers() {
        const res = await fetch('/api/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            console.error('Erro ao obter usuários', await res.text());
            return;
        }
        const users = await res.json();
        renderUsers(users);
    }

    
    async function fetchAndPopulateCourses() {
        try {
            const res = await fetch('/api/classes', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return;
            const classes = await res.json();
            const container = document.getElementById('courses');
            
            const uniq = Array.from(new Set(classes.map(c => c.course).filter(Boolean))).sort();
            
            if (container) {
                container.innerHTML = uniq.map((c, i) => `
                    <div class="course-chip">
                        <input type="checkbox" id="course_${i}" value="${c}" />
                        <label for="course_${i}">${c}</label>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Erro ao carregar cursos', err);
        }
    }

    
    async function fetchRequests() {
        try {
            const res = await fetch('/api/auth/password-requests', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return;
            const rows = await res.json();
            renderRequests(rows);
        } catch (err) {
            console.error('Erro ao carregar solicitações', err);
        }
    }

    function renderRequests(rows) {
        const tbody = document.querySelector('#requestsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${r.user_name || ''}</td>
                <td>${r.email || ''}</td>
                <td>${r.status}</td>
                <td>${r.created_at}</td>
                <td>
                    ${r.status === 'pending' ? `<button class="approve-btn" data-id="${r.id}">Aprovar</button> <button class="reject-btn" data-id="${r.id}">Rejeitar</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (!confirm('Aprovar esta solicitação e resetar a senha para padrão?')) return;
            const res = await fetch('/api/auth/password-requests/' + id + '/approve', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) return alert('Erro ao aprovar');
            fetchRequests();
        }));

        document.querySelectorAll('.reject-btn').forEach(b => b.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (!confirm('Rejeitar esta solicitação?')) return;
            const res = await fetch('/api/auth/password-requests/' + id + '/reject', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) return alert('Erro ao rejeitar');
            fetchRequests();
        }));
    }

    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.name || ''}</td>
                <td>${u.email || ''}</td>
                <td>${u.role || ''}</td>
                <td>${u.cpf || ''}</td>
                <td>${u.phone || ''}</td>
                <td>${(u.courses || []).join(', ')}</td>
                <td>${u.course_end_date || ''}</td>
                <td>
                    <button class="edit-btn" data-id="${u.id}">Editar</button>
                    <button class="delete-btn" data-id="${u.id}">Excluir</button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', onEdit));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', onDelete));
    }

    async function onEdit(e) {
        const id = e.currentTarget.dataset.id;
        const res = await fetch('/api/users/' + id, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            alert('Erro ao carregar usuário');
            return;
        }
        const user = await res.json();
        editingId = id;
        formTitle.textContent = 'Editar Usuário #' + id;
        submitBtn.textContent = 'Salvar';
        document.getElementById('userId').value = user.id;
        document.getElementById('name').value = user.name || '';
        document.getElementById('cpf').value = user.cpf || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('address').value = user.address || '';
        
        const container = document.getElementById('courses');
        const userCourses = user.courses || [];
        if (container) {
            Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
                cb.checked = userCourses.includes(cb.value);
            });
        }
        document.getElementById('course_end_date').value = user.course_end_date || '';
        document.getElementById('password').value = '';
        
        const role = user.role || 'student';
        document.querySelectorAll('input[name="role"]').forEach(r => r.checked = (r.value === role));
    }

    async function onDelete(e) {
        if (!confirm('Confirma exclusão deste usuário?')) return;
        const id = e.currentTarget.dataset.id;
        const res = await fetch('/api/users/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            alert('Erro ao excluir usuário');
            return;
        }
        fetchUsers();
    }

    userForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        formMessage.textContent = '';

            
            const selectedCourses = Array.from(document.querySelectorAll('#courses input[type="checkbox"]:checked')).map(i => i.value);

            const payload = {
            name: document.getElementById('name').value.trim(),
            cpf: document.getElementById('cpf').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            address: document.getElementById('address').value.trim(),
            role: document.querySelector('input[name="role"]:checked').value,
            courses: selectedCourses,
            course_end_date: document.getElementById('course_end_date').value || null,
            password: document.getElementById('password').value || null
        };

        try {
            let res;
            if (editingId) {
                res = await fetch('/api/users/' + editingId, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (!res.ok) {
                formMessage.textContent = data.message || 'Erro ao salvar usuário';
                return;
            }

            
            resetForm();
            fetchUsers();
        } catch (err) {
            console.error(err);
            formMessage.textContent = 'Erro de conexão';
        }
    });

    resetBtn.addEventListener('click', resetForm);

    function resetForm() {
        editingId = null;
        document.getElementById('userId').value = '';
        document.getElementById('name').value = '';
        document.getElementById('cpf').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('email').value = '';
        document.getElementById('address').value = '';
        const container = document.getElementById('courses');
        if (container) Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
        document.getElementById('course_end_date').value = '';
        document.getElementById('password').value = '';
        document.querySelectorAll('input[name="role"]').forEach(r => r.checked = (r.value === 'student'));
        formTitle.textContent = 'Criar Usuário';
        submitBtn.textContent = 'Criar';
        formMessage.textContent = '';
    }

    
    await fetchAndPopulateCourses();
    fetchUsers();
    
    fetchRequests();
}


window.initAdminUsers = initAdminUsers;
if (document.readyState !== 'loading') initAdminUsers();
else document.addEventListener('DOMContentLoaded', initAdminUsers);
