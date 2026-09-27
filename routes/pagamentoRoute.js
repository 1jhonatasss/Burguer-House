const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/PagamentoController');

router.post('/pix', pagamentoController.criarPagamentoPix.bind(pagamentoController));
router.post('/cartao', pagamentoController.criarPagamentoCartao.bind(pagamentoController));
router.post('/webhook', pagamentoController.webhookMercadoPago.bind(pagamentoController));
router.get('/status/:pagamentoId', pagamentoController.consultarPagamento.bind(pagamentoController));
router.get('/config', pagamentoController.obterPublicKey.bind(pagamentoController));
router.get('/status-maquininha', pagamentoController.statusMaquininha.bind(pagamentoController));

module.exports = router;