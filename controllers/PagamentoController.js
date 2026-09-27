require('dotenv').config();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const PaymentCard = require('../services/payment-card');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST
});

const payment = new Payment(client);
const paymentCard = new PaymentCard();

class PagamentoController {

  async criarPagamentoPix(req, res) {
    try {
      const { pedidoId, numeroPedido, total, email, cpf, nome } = req.body;

      if (!total || total <= 0) {
        return res.json({ ok: false, msg: 'Valor inválido' });
      }

      const body = {
        transaction_amount: parseFloat(total),
        description: `Pedido ${numeroPedido} - Burger House`,
        payment_method_id: 'pix',
        payer: {
          email: email || 'cliente@burgerhouse.com',
          first_name: nome || 'Cliente',
          last_name: 'Burger House',
          identification: {
            type: 'CPF',
            number: String(cpf || '00000000000').replace(/\D/g, '')
          }
        }
      };

      const result = await payment.create({ body });

      if (result && result.id) {
        return res.json({
          ok: true,
          pagamentoId: result.id,
          status: result.status,
          qrCode: result.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          copiaCola: result.point_of_interaction?.transaction_data?.qr_code,
          msg: 'PIX criado com sucesso'
        });
      }

      return res.json({ ok: false, msg: 'Erro ao criar PIX' });

    } catch (error) {
      console.error('❌ ERRO PIX:', error);
      return res.json({ ok: false, msg: 'Erro ao processar PIX', error: error.message });
    }
  }

  async criarPagamentoCartao(req, res) {
    try {
      const { numeroPedido, total, tipo } = req.body;

      if (!total || total <= 0) {
        return res.json({ ok: false, msg: 'Valor inválido' });
      }

      console.log(`💳 Processando ${tipo} de R$ ${total} - Pedido ${numeroPedido}`);

      const resultado = await paymentCard.processarPagamento(total, tipo);

      if (resultado.sucesso) {
        return res.json({
          ok: true,
          transacaoId: resultado.transacaoId,
          autorizacao: resultado.autorizacao,
          tipo: resultado.tipo,
          msg: 'Pagamento aprovado na maquininha!'
        });
      } else {
        return res.json({ ok: false, msg: resultado.mensagem });
      }

    } catch (error) {
      console.error('❌ Erro cartão:', error);
      return res.json({ ok: false, msg: error.mensagem || 'Erro ao processar cartão' });
    }
  }

  async webhookMercadoPago(req, res) {
    try {
      const { type, data } = req.body;
      console.log('🔔 Webhook:', { type, data });

      if (type === 'payment') {
        const result = await payment.get({ id: data.id });
        if (result) {
          console.log(`💰 Pagamento ${result.id} - Status: ${result.status}`);
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Erro webhook:', error);
      res.sendStatus(500);
    }
  }

  async consultarPagamento(req, res) {
    try {
      const { pagamentoId } = req.params;
      const result = await payment.get({ id: pagamentoId });

      if (result) {
        return res.json({
          ok: true,
          status: result.status,
          statusDetail: result.status_detail,
          valor: result.transaction_amount
        });
      }

      return res.json({ ok: false, msg: 'Pagamento não encontrado' });
    } catch (error) {
      console.error('❌ Erro consulta:', error);
      return res.json({ ok: false, msg: 'Erro ao consultar pagamento' });
    }
  }

  async obterPublicKey(req, res) {
    try {
      const publicKey = process.env.MP_PUBLIC_KEY;
      res.json({ ok: true, publicKey });
    } catch (error) {
      res.json({ ok: false, msg: 'Erro ao obter chave pública' });
    }
  }

  async statusMaquininha(req, res) {
    res.json({
      ok: true,
      conectada: paymentCard.isConnected,
      mensagem: paymentCard.isConnected ? 'Maquininha conectada' : 'Maquininha desconectada'
    });
  }
}

module.exports = new PagamentoController();