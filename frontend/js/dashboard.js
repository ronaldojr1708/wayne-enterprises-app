document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos do dashboard
    const resourcesTbody = document.getElementById('resources-tbody');
    const logoutButton = document.getElementById('logout-button');
    const addResourceBtn = document.getElementById('add-resource-btn');

    // Modal de formulário
    const modal = document.getElementById('resource-modal');
    const closeButton = document.querySelector('.close-button');
    const resourceForm = document.getElementById('resource-form');
    const modalTitle = document.getElementById('modal-title');
    const resourceIdInput = document.getElementById('resource-id');

    // Modal de confirmação
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    let resourceIdToDelete = null;

    // Notificações
    const showNotification = (message, type='success') => {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    // -------------------- FUNÇÕES --------------------

    // Fechar modal de formulário
    const closeModal = () => {
        modal.style.display = 'none';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
    };

    // Fechar modal de confirmação
    const closeConfirmModal = () => {
        confirmModal.style.display = 'none';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        resourceIdToDelete = null;
    };

    // Buscar e renderizar recursos
    const fetchAndRenderResources = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/recursos', {
                headers: { 'x-access-token': token }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }

            const data = await response.json();
            resourcesTbody.innerHTML = '';

            data.forEach(r => {
                const row = document.createElement('tr');
                row.classList.add('fade-in');
                row.innerHTML = `
                    <td>${r.id}</td>
                    <td>${r.nome}</td>
                    <td>${r.tipo}</td>
                    <td>${r.status}</td>
                    <td>${r.descricao}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" data-id="${r.id}">Editar</button>
                            <button class="btn-delete" data-id="${r.id}">Excluir</button>
                        </div>
                    </td>`;
                resourcesTbody.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            showNotification('Falha ao carregar recursos.', 'error');
        }
    };

    // Renderizar gráfico de status
    const renderStatusChart = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/stats', {
                headers: { 'x-access-token': token }
            });
            const statsData = await response.json();

            const labels = statsData.map(item => item.status);
            const data = statsData.map(item => item.count);

            const ctx = document.getElementById('statusChart').getContext('2d');

            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: ['#89CFF0','#F6B6B6','#F4D35E'],
                        borderColor: ['#fff'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#2c3e50', font: { size: 14 } }
                        }
                    }
                }
            });

            document.getElementById('statusChart').classList.add('fade-in');

        } catch (error) {
            console.error('Erro ao carregar dados do gráfico:', error);
        }
    };

    // -------------------- EVENTOS --------------------

    // Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Abrir modal de adicionar
    addResourceBtn.addEventListener('click', () => {
        resourceForm.reset();
        resourceIdInput.value = '';
        modalTitle.textContent = 'Adicionar Novo Recurso';
        modal.style.display = 'block';
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
    });

    // Fechar modal
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
        if (event.target === confirmModal) closeConfirmModal();
    });

    // Enviar formulário (adicionar/editar)
    resourceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = resourceIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const apiUrl = id ? `http://127.0.0.1:5000/api/recursos/${id}` : 'http://127.0.0.1:5000/api/recursos';

        const resourceData = {
            nome: document.getElementById('nome').value,
            tipo: document.getElementById('tipo').value,
            status: document.getElementById('status').value,
            descricao: document.getElementById('descricao').value
        };

        try {
            const response = await fetch(apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(resourceData)
            });

            const data = await response.json();
            if (response.ok) {
                closeModal();
                showNotification(`Recurso ${id ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
                fetchAndRenderResources();
            } else {
                showNotification(`Erro: ${data.message}`, 'error');
            }
        } catch (error) {
            showNotification('Ocorreu um erro de rede.', 'error');
        }
    });

    // Ações de tabela (editar/excluir)
    resourcesTbody.addEventListener('click', async (event) => {
        const target = event.target;

        // Deletar
        if (target.classList.contains('btn-delete')) {
            resourceIdToDelete = target.dataset.id;
            const resourceName = target.closest('tr').children[1].textContent;
            confirmMessage.textContent = `Tem certeza de que deseja excluir "${resourceName}"?`;
            confirmModal.style.display = 'block';
            document.documentElement.classList.add('modal-open');
            document.body.classList.add('modal-open');
        }

        // Editar
        if (target.classList.contains('btn-edit')) {
            const resourceId = target.dataset.id;
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/recursos/${resourceId}`, {
                    headers: { 'x-access-token': token }
                });
                if (!response.ok) throw new Error('Recurso não encontrado.');
                const r = await response.json();

                modalTitle.textContent = `Editar Recurso #${r.id}`;
                resourceIdInput.value = r.id;
                document.getElementById('nome').value = r.nome;
                document.getElementById('tipo').value = r.tipo;
                document.getElementById('status').value = r.status;
                document.getElementById('descricao').value = r.descricao;

                modal.style.display = 'block';
                document.documentElement.classList.add('modal-open');
                document.body.classList.add('modal-open');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });

    // Modal de confirmação
    confirmNoBtn.addEventListener('click', closeConfirmModal);
    confirmYesBtn.addEventListener('click', async () => {
        if (!resourceIdToDelete) return;
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/recursos/${resourceIdToDelete}`, {
                method: 'DELETE',
                headers: { 'x-access-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Recurso deletado com sucesso!', 'success');
                fetchAndRenderResources();
            } else {
                showNotification(`Erro: ${data.message}`, 'error');
            }
        } catch (error) {
            showNotification('Ocorreu um erro de rede.', 'error');
        }
        closeConfirmModal();
    });

    // -------------------- INICIAL --------------------
    fetchAndRenderResources();
    renderStatusChart();
});
