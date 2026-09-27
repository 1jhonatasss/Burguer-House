class WebSocketManager {
    constructor() {
        this.clients = new Set();
        this.wss = null;
        console.log('✅ WebSocketManager inicializado');
    }

    init(server) {
        const WebSocket = require('ws');
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws) => {
            console.log('🔌 Cliente conectado ao WebSocket');
            this.clients.add(ws);

            ws.on('close', () => {
                console.log('🔌 Cliente desconectado');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ Erro WebSocket:', error);
                this.clients.delete(ws);
            });

            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Conectado ao sistema de notificações'
            }));
        });

        console.log('✅ WebSocket Server iniciado');
    }

    notificar(tipo, dados) {
        const mensagem = JSON.stringify({
            type: tipo,
            data: dados,
            timestamp: new Date().toISOString()
        });

        let clientesNotificados = 0;
        this.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(mensagem);
                clientesNotificados++;
            }
        });

        console.log(`📢 Notificação enviada: ${tipo} (${clientesNotificados} clientes)`);
        return clientesNotificados;
    }

    notificarNovoPedido(pedido) {
        return this.notificar('novo_pedido', pedido);
    }

    notificarMudancaStatus(pedidoId, novoStatus) {
        return this.notificar('status_pedido', { pedidoId, status: novoStatus });
    }

    notificarPedidoExcluido(pedidoId) {
        return this.notificar('pedido_excluido', { pedidoId });
    }

    stats() {
        return {
            clientesConectados: this.clients.size,
            ativo: !!this.wss
        };
    }
}

module.exports = new WebSocketManager();