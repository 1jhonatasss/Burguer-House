const axios = require('axios');

class PaymentCard {
    constructor() {
        this.maquininhaIP = process.env.MAQUININHA_IP;
        this.maquininhaPort = process.env.MAQUININHA_PORT || 8080;
        this.isConnected = false;
    }
    // resto do arquivo continua igual

    async conectar() {
        try {
            console.log(`🔌 Testando conexão com maquininha em ${this.maquininhaIP}:${this.maquininhaPort}`);
            
            const response = await axios.get(`http://${this.maquininhaIP}:${this.maquininhaPort}/status`, {
                timeout: 3000
            });
            
            if (response.status === 200) {
                this.isConnected = true;
                console.log('✅ Maquininha conectada via IP');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Maquininha não acessível via IP:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async processarPagamento(valor, tipo = 'credito') {
        try {
            if (!this.isConnected) {
                await this.conectar();
            }

            console.log(`💳 Processando ${tipo} de R$ ${valor}`);
            
            const response = await axios.post(
                `http://${this.maquininhaIP}:${this.maquininhaPort}/transacao`,
                {
                    tipo: tipo === 'credito' ? 'CREDIT' : 'DEBIT',
                    valor: parseFloat(valor),
                    parcelas: 1
                },
                { timeout: 120000 }
            );

            const resultado = response.data;

            if (resultado.aprovado || resultado.status === 'APROVADO') {
                return {
                    sucesso: true,
                    transacaoId: resultado.nsu || resultado.transactionId,
                    autorizacao: resultado.autorizacao || resultado.authCode,
                    mensagem: 'Pagamento aprovado!'
                };
            } else {
                return {
                    sucesso: false,
                    mensagem: resultado.mensagem || 'Pagamento negado'
                };
            }

        } catch (error) {
            console.error('❌ Erro no pagamento:', error);
            return {
                sucesso: false,
                mensagem: error.message
            };
        }
    }

    async cancelarTransacao(nsu) {
        try {
            const response = await axios.post(
                `http://${this.maquininhaIP}:${this.maquininhaPort}/cancelar`,
                { nsu: nsu },
                { timeout: 30000 }
            );
            
            return { sucesso: true, mensagem: 'Cancelamento solicitado' };
        } catch (error) {
            return { sucesso: false, mensagem: error.message };
        }
    }

    desconectar() {
        this.isConnected = false;
        console.log('🔌 Desconectado da maquininha');
    }
}

module.exports = PaymentCard;