// routes/adminRoute.js (VERSÃO FINAL CORRIGIDA)
const express = require('express');
const router = express.Router();

// ✅ IMPORTAR OS MODELS E CONTROLLERS
const PedidoModel = require('../models/Pedido');
const ProdutoModel = require('../models/Produto');
const ProdutoController = require('../controllers/ProdutoController');

const produtoController = new ProdutoController();

// ✅ ROTA DO DASHBOARD ADMIN
router.get('/', async (req, res) => {
    try {
        console.log('📊 CARREGANDO DASHBOARD ADMIN');
        
        let pedido = new PedidoModel();
        let produto = new ProdutoModel();
        
        const pedidos = await pedido.listar();
        const produtos = await produto.listar();
        
        console.log('📊 DASHBOARD - Pedidos:', pedidos.length);
        console.log('📊 DASHBOARD - Produtos:', produtos.length);
        
        res.render('admin/dashboard', {
            title: 'Admin - Burger House',
            pedidos: pedidos,
            produtos: produtos
        });
    } catch (error) {
        console.error('❌ ERRO NO DASHBOARD:', error);
        res.render('admin/dashboard', {
            title: 'Admin - Burger House',
            pedidos: [],
            produtos: []
        });
    }
});

// ✅ ROTA PARA LISTAR PRODUTOS (usando a lógica original que funciona)
router.get('/produtos', async (req, res) => {
    try {
        console.log('📦 CARREGANDO PÁGINA DE PRODUTOS - ADMIN');
        
        let produto = new ProdutoModel();
        let lista = await produto.listar();
        
        console.log('📦 PRODUTOS ENCONTRADOS:', lista.length);
        
        // ✅ CORREÇÃO: Formatar produtos corretamente
        const produtosFormatados = lista.map(prod => ({
            produtoId: prod.produtoId,
            produtoNome: prod.produtoNome,
            produtoDescricao: prod.produtoDescricao,
            produtoPreco: prod.produtoPreco,
            produtoCategoria: prod.produtoCategoria,
            produtoImagemUrl: prod.produtoImagemUrl,
            produtoEmPromocao: prod.produtoEmPromocao,
            produtoPrecoPromocional: prod.produtoPrecoPromocional,
            produtoDisponivel: prod.produtoDisponivel
        }));

        res.render('admin/produtos', {
            title: 'Produtos - Admin',
            produtos: produtosFormatados
        });
    } catch (error) {
        console.error('❌ ERRO AO CARREGAR PRODUTOS:', error);
        res.render('admin/produtos', {
            title: 'Produtos - Admin',
            produtos: []
        });
    }
});

// ✅ ROTAS DE PRODUTOS QUE USAM O CONTROLLER (para cadastro/edição com ingredientes)
router.get('/produtos/cadastrar', produtoController.cadastrarView.bind(produtoController));
router.get('/produtos/editar/:id', produtoController.editarView.bind(produtoController));
router.post('/produtos/cadastrar', produtoController.cadastrar.bind(produtoController));
router.post('/produtos/atualizar', produtoController.atualizar.bind(produtoController));

// ✅ ROTA PARA EXCLUIR PRODUTOS
router.post('/produtos/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ EXCLUINDO PRODUTO - ID:', id);
        
        if (!id) {
            return res.json({ok: false, msg: "ID do produto não fornecido"});
        }

        const idNumerico = parseInt(id);
        if (isNaN(idNumerico)) {
            return res.json({ok: false, msg: "ID do produto inválido"});
        }

        let produto = new ProdutoModel();
        const result = await produto.excluir(idNumerico);
        
        if(result) {
            res.json({ok: true, msg: "Produto excluído com sucesso!"});
        } else {
            res.json({ok: false, msg: "Erro ao excluir produto do banco!"});
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.json({ok: false, msg: "Erro interno ao excluir produto"});
    }
});

// ✅ ROTA PARA PRODUTOS EM DESTAQUE
router.get('/produtos/destaque', async (req, res) => {
    try {
        let produto = new ProdutoModel();
        let produtos = await produto.listar();
        
        const produtosDestaque = produtos
            .filter(p => p.produtoEmPromocao === 1 && p.produtoDisponivel === 1)
            .map(prod => ({
                produtoId: prod.produtoId,
                produtoNome: prod.produtoNome,
                produtoDescricao: prod.produtoDescricao,
                produtoPreco: prod.produtoPreco,
                produtoCategoria: prod.produtoCategoria,
                produtoImagemUrl: prod.produtoImagemUrl,
                produtoEmPromocao: prod.produtoEmPromocao,
                produtoPrecoPromocional: prod.produtoPrecoPromocional,
                produtoDisponivel: prod.produtoDisponivel
            }));

        res.render('admin/produtos-destaque', {
            title: 'Produtos em Destaque - Admin',
            produtos: produtosDestaque
        });
    } catch (error) {
        console.error('Erro ao carregar produtos em destaque:', error);
        res.render('admin/produtos-destaque', {
            title: 'Produtos em Destaque - Admin',
            produtos: []
        });
    }
});

// ✅ ROTAS DE PEDIDOS
router.get('/pedidos', async (req, res) => {
    try {
        console.log('📋 CARREGANDO PEDIDOS PARA ADMIN');
        
        let pedido = new PedidoModel();
        let lista = await pedido.listar();
        
        console.log('📋 PEDIDOS ENCONTRADOS:', lista.length);
        
        res.render('admin/pedidos', {
            title: 'Pedidos - Admin',
            pedidos: lista
        });
    } catch (error) {
        console.error('❌ ERRO AO CARREGAR PEDIDOS:', error);
        res.render('admin/pedidos', {
            title: 'Pedidos - Admin',
            pedidos: []
        });
    }
});

router.post('/pedidos/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.json({ok: false, msg: "ID do pedido não fornecido"});
        }

        const idNumerico = parseInt(id);
        if (isNaN(idNumerico) || idNumerico <= 0) {
            return res.json({ok: false, msg: "ID do pedido não é um número válido"});
        }

        let pedido = new PedidoModel();
        const result = await pedido.excluir(idNumerico);
        
        if(result) {
            res.json({ok: true, msg: "Pedido excluído com sucesso!"});
        } else {
            res.json({ok: false, msg: "Erro ao excluir pedido do banco!"});
        }
    } catch (error) {
        console.error('🔴 ERRO COMPLETO AO EXCLUIR PEDIDO:', error);
        res.json({ok: false, msg: "Erro interno: " + error.message});
    }
});

router.post('/pedidos/status/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        
        if (!id || !status) {
            return res.json({ok: false, msg: "ID e status são obrigatórios!"});
        }

        const idNumerico = parseInt(id);
        if (isNaN(idNumerico)) {
            return res.json({ok: false, msg: "ID inválido"});
        }

        let pedido = new PedidoModel();
        const result = await pedido.atualizarStatus(idNumerico, status);
        
        if(result) {
            res.json({ok: true, msg: "Status do pedido atualizado com sucesso!"});
        } else {
            res.json({ok: false, msg: "Erro ao atualizar o status do pedido!"});
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.json({ok: false, msg: "Erro interno ao atualizar status"});
    }
});

// ✅ ROTAS DE API
router.get('/api/teste-pedidos', async (req, res) => {
    try {
        let pedido = new PedidoModel();
        let lista = await pedido.listar();
        
        const Database = require('../utils/database');
        const banco = new Database();
        const sql = "SELECT * FROM TB_PEDIDO LIMIT 3";
        const rows = await banco.ExecutaComando(sql);
        
        res.json({
            ok: true,
            viaModel: lista,
            viaBanco: rows,
            comparacao: {
                modelCount: lista.length,
                bancoCount: rows.length,
                primeiroModel: lista[0],
                primeiroBanco: rows[0]
            }
        });
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        res.json({
            ok: false,
            error: error.message
        });
    }
});

router.get('/api/debug', async (req, res) => {
    try {
        let pedido = new PedidoModel();
        let produto = new ProdutoModel();
        
        const pedidos = await pedido.listar();
        const produtos = await produto.listar();
        
        res.json({
            ok: true,
            pedidos: {
                total: pedidos.length,
                dados: pedidos.slice(0, 3)
            },
            produtos: {
                total: produtos.length,
                dados: produtos.slice(0, 3)
            }
        });
    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
        res.json({
            ok: false,
            error: error.message
        });
    }
});

router.get('/api/pedidos', async (req, res) => {
    try {
        let pedido = new PedidoModel();
        let lista = await pedido.listar();
        
        res.json({ 
            ok: true, 
            pedidos: lista,
            total: lista.length
        });
    } catch (error) {
        console.error('❌ ERRO NA API PEDIDOS:', error);
        res.json({ 
            ok: false, 
            msg: error.message,
            pedidos: [],
            total: 0
        });
    }
});

router.get('/api/produtos', async (req, res) => {
    try {
        let produto = new ProdutoModel();
        let lista = await produto.listar();
        
        const produtosFormatados = lista.map(prod => ({
            produtoId: prod.produtoId,
            produtoNome: prod.produtoNome,
            produtoDescricao: prod.produtoDescricao,
            produtoPreco: prod.produtoPreco,
            produtoCategoria: prod.produtoCategoria,
            produtoImagemUrl: prod.produtoImagemUrl,
            produtoEmPromocao: prod.produtoEmPromocao,
            produtoPrecoPromocional: prod.produtoPrecoPromocional,
            produtoDisponivel: prod.produtoDisponivel
        }));
        
        res.json({ 
            ok: true,
            produtos: produtosFormatados,
            total: produtosFormatados.length
        });
    } catch (error) {
        console.error('❌ ERRO NA API PRODUTOS:', error);
        res.json({ 
            ok: false,
            produtos: [],
            total: 0
        });
    }
});

module.exports = router;