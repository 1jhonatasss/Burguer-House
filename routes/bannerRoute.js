// routes/bannerRoute.js
const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/BannerController');

const bannerController = new BannerController();

// ============================================
// ROTAS DE BANNER
// ============================================

// GET - Listar todos os banners
router.get('/', bannerController.listar.bind(bannerController));

// GET - Formulário de cadastro
router.get('/cadastrar', bannerController.cadastrarView.bind(bannerController));

// POST - Salvar novo banner (suporta base64 do crop)
router.post('/cadastrar', bannerController.cadastrar.bind(bannerController));

// GET - Formulário de edição
router.get('/editar/:id', bannerController.editarView.bind(bannerController));

// POST - Atualizar banner
router.post('/atualizar', bannerController.atualizar.bind(bannerController));

// POST - Excluir banner
router.post('/excluir/:id', bannerController.excluir.bind(bannerController));

// POST - Alternar status (ativo/inativo)
router.post('/status/:id', bannerController.alternarStatus.bind(bannerController));

// GET - API - Obter banners ativos (para o cardápio)
router.get('/api/ativos', bannerController.obterAtivos.bind(bannerController));

module.exports = router;