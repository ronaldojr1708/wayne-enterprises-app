document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const notificationContainer = document.createElement('div');

    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);

    // Função para exibir notificações
    const showNotification = (message, type = 'error') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        // Animação
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    // Evento de envio do formulário
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showNotification('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                showNotification('Login realizado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800); // Pequeno delay para mostrar a notificação
            } else {
                showNotification(data.message || 'Email ou senha inválidos', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Não foi possível conectar ao servidor.', 'error');
        }
    });
});
