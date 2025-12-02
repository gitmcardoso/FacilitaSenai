/* public/js/login.js - Frontend JS UI */
document.addEventListener('DOMContentLoaded', () => {
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('roleInput');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    
    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 

            
            roleBtns.forEach(b => b.classList.remove('active'));

            
            btn.classList.add('active');

            
            const role = btn.dataset.role;
            roleInput.value = role;
        });
    });

    
    const roleToggle = document.querySelector('.role-toggle');
    const slider = document.querySelector('.role-slider');

    function updateRoleSlider() {
        try {
            if (!slider || !roleToggle) return;
            const active = document.querySelector('.role-btn.active');
            if (!active) return;
            const parentRect = roleToggle.getBoundingClientRect();
            const rect = active.getBoundingClientRect();
            const left = rect.left - parentRect.left + 6; 
            slider.style.width = rect.width + 'px';
            slider.style.transform = `translateX(${left}px)`;
        } catch (err) {  }
    }

    
    window.addEventListener('resize', updateRoleSlider);
    roleBtns.forEach(b => b.addEventListener('click', () => setTimeout(updateRoleSlider, 50)));
    
    setTimeout(updateRoleSlider, 80);

    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = roleInput.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                
                if (data.user && data.user.must_change_password) {
                    const firstAccessModal = document.getElementById('firstAccessModal');
                    if (firstAccessModal) {
                        document.getElementById('faEmail').value = email;
                        document.getElementById('faOldPassword').value = password;
                        document.getElementById('faNewPassword').value = '';
                        document.getElementById('faConfirmPassword').value = '';
                        firstAccessModal.classList.add('open');
                        return;
                    }
                }

                
                window.location.href = '/';
            } else {
                
                errorMessage.textContent = data.message || 'Erro ao realizar login';
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Erro de conexão com o servidor';
        }
    });

    
    const forgotLink = document.getElementById('forgotLink');
    const forgotModal = document.getElementById('forgotModal');
    const firstAccessLink = document.getElementById('firstAccessLink');
    const firstAccessModal = document.getElementById('firstAccessModal');
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(b => b.addEventListener('click', () => {
        forgotModal.classList.remove('open');
        firstAccessModal.classList.remove('open');
    }));

    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.classList.add('open');
    });

    firstAccessLink.addEventListener('click', (e) => {
        e.preventDefault();
        firstAccessModal.classList.add('open');
    });

    document.getElementById('sendResetBtn').addEventListener('click', async () => {
        const email = document.getElementById('forgotEmail').value.trim();
        const msg = document.getElementById('forgotMessage');
        msg.textContent = '';
        if (!email) return msg.textContent = 'Informe o e-mail';
        try {
            const res = await fetch('/api/auth/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) return msg.textContent = data.message || 'Erro';
            msg.textContent = data.message || 'Solicitação enviada. Aguarde aprovação do administrador.';
        } catch (err) {
            console.error(err);
            msg.textContent = 'Erro ao solicitar redefinição';
        }
    });

    
    document.getElementById('submitFirstAccessBtn').addEventListener('click', async () => {
        const email = document.getElementById('faEmail').value.trim();
        const oldPassword = document.getElementById('faOldPassword').value.trim();
        const newPassword = document.getElementById('faNewPassword').value.trim();
        const confirm = document.getElementById('faConfirmPassword').value.trim();
        const msg = document.getElementById('faMessage');
        msg.textContent = '';
        if (!email || !oldPassword || !newPassword) return msg.textContent = 'Preencha todos os campos';
        if (newPassword !== confirm) return msg.textContent = 'Confirmação não confere';

        try {
            
            const token = localStorage.getItem('token');
            if (token) {
                
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (!user) return msg.textContent = 'Usuário não autenticado';

                const res = await fetch('/api/users/' + user.id + '/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ oldPassword, newPassword })
                });
                const data = await res.json();
                if (!res.ok) return msg.textContent = data.message || 'Erro';
                msg.textContent = 'Senha alterada com sucesso. Redirecionando...';
                setTimeout(() => { window.location.href = '/'; }, 800);
            } else {
                
                const res = await fetch('/api/auth/first-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, oldPassword, newPassword })
                });
                const data = await res.json();
                if (!res.ok) return msg.textContent = data.message || 'Erro';
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                msg.textContent = 'Senha alterada com sucesso. Redirecionando...';
                setTimeout(() => { window.location.href = '/'; }, 800);
            }
        } catch (err) {
            console.error(err);
            msg.textContent = 'Erro ao alterar senha';
        }
    });
});
