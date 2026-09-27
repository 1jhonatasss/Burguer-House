// ============================================
// public/js/admin-dashboard.js
// WebSocket para atualização automática de pedidos
// ============================================

(function() {
    let ws = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    // Conectar ao WebSocket
    function conectarWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}`;

        console.log('🔌 Conectando WebSocket:', wsUrl);

        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
            console.log('✅ WebSocket conectado');
            reconnectAttempts = 0;
            
            // Mostrar indicador de conexão
            const indicator = document.getElementById('websocket-status');
            if (indicator) {
                indicator.textContent = '🟢 Conectado';
                indicator.style.color = '#10b981';
            }
        };

        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Mensagem recebida:', data);

                switch(data.type) {
                    case 'novo_pedido':
                        handleNovoPedido(data.data);
                        break;
                    case 'status_pedido':
                        handleStatusPedido(data.data);
                        break;
                    case 'pedido_excluido':
                        handlePedidoExcluido(data.data);
                        break;
                    case 'connection':
                        console.log('📢', data.message);
                        break;
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error);
            }
        };

        ws.onerror = function(error) {
            console.error('❌ Erro WebSocket:', error);
        };

        ws.onclose = function() {
            console.log('🔌 WebSocket desconectado');
            
            // Mostrar indicador de desconexão
            const indicator = document.getElementById('websocket-status');
            if (indicator) {
                indicator.textContent = '🔴 Desconectado';
                indicator.style.color = '#ef4444';
            }

            // Tentar reconectar
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                const delay = Math.min(1000 * reconnectAttempts, 5000);
                console.log(`🔄 Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts})`);
                setTimeout(conectarWebSocket, delay);
            }
        };
    }

    // Novo pedido recebido
    function handleNovoPedido(pedido) {
        console.log('🆕 Novo pedido:', pedido);

        // Tocar som de notificação
        tocarSomNotificacao();

        // Mostrar notificação visual
        mostrarNotificacao(`Novo pedido #${pedido.numeroPedido}`, 'success');

        // Recarregar lista de pedidos
        recarregarPedidos();
    }

    // Status de pedido alterado
    function handleStatusPedido(data) {
        console.log('📊 Status alterado:', data);
        
        // Atualizar linha do pedido se estiver visível
        const pedidoRow = document.querySelector(`tr[data-pedido-id="${data.pedidoId}"]`);
        if (pedidoRow) {
            const statusCell = pedidoRow.querySelector('.status-badge');
            if (statusCell) {
                statusCell.textContent = data.status;
                statusCell.className = `status-badge status-${data.status}`;
            }
        }
    }

    // Pedido excluído
    function handlePedidoExcluido(data) {
        console.log('🗑️ Pedido excluído:', data);
        
        const pedidoRow = document.querySelector(`tr[data-pedido-id="${data.pedidoId}"]`);
        if (pedidoRow) {
            pedidoRow.style.transition = 'opacity 0.3s';
            pedidoRow.style.opacity = '0';
            setTimeout(() => pedidoRow.remove(), 300);
        }
    }

    // Recarregar lista de pedidos
    function recarregarPedidos() {
        fetch('/admin/api/pedidos')
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    atualizarTabelaPedidos(data.pedidos);
                }
            })
            .catch(err => console.error('❌ Erro ao recarregar pedidos:', err));
    }

    // Atualizar tabela de pedidos
    function atualizarTabelaPedidos(pedidos) {
        const tbody = document.querySelector('#pedidos-tbody');
        if (!tbody) return;

        // Salvar scroll position
        const scrollPos = window.scrollY;

        // Atualizar HTML (implementar conforme seu HTML)
        // ... código específico da sua tabela ...

        // Restaurar scroll
        window.scrollTo(0, scrollPos);

        console.log(`✅ Tabela atualizada: ${pedidos.length} pedidos`);
    }

    // Tocar som de notificação
    function tocarSomNotificacao() {
        // Usar API de notificação do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🍔 Burger House', {
                body: 'Novo pedido recebido!',
                icon: '/images/logo.png',
                tag: 'novo-pedido'
            });
        }

        // Tocar beep (opcional)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLYiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyy3ksBSR3yPDdkEAKFF607Oyo=');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('🔇 Som desabilitado'));
        } catch (e) {
            // Ignorar erro de áudio
        }
    }

    // Mostrar notificação na tela
    function mostrarNotificacao(mensagem, tipo = 'info') {
        const notif = document.createElement('div');
        notif.className = `notificacao-ws notificacao-${tipo}`;
        notif.textContent = mensagem;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${tipo === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;

        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // Pedir permissão de notificação
    function pedirPermissaoNotificacao() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Adicionar CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Inicializar ao carregar página
    window.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Iniciando sistema de notificações em tempo real');
        
        // Pedir permissão de notificação
        pedirPermissaoNotificacao();
        
        // Conectar WebSocket
        conectarWebSocket();
    });

    // Reconectar ao voltar para a aba
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && (!ws || ws.readyState !== WebSocket.OPEN)) {
            console.log('👁️ Aba ativa - reconectando WebSocket');
            conectarWebSocket();
        }
    });

    // Limpar ao sair da página
    window.addEventListener('beforeunload', function() {
        if (ws) {
            ws.close();
        }
    });
})();