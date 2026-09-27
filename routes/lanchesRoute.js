const express = require('express');
const router = express.Router();
const cardapioController = require('../controllers/cardapioController');

// ✅ VERIFICAÇÃO: Se alguma função estiver undefined, o servidor não inicia
console.log('🔍 Verificando cardapioController:');
console.log('- cardapioView:', typeof cardapioController.cardapioView);
console.log('- obterIngredientesProduto:', typeof cardapioController.obterIngredientesProduto);
console.log('- filtrarCategoriaAPI:', typeof cardapioController.filtrarCategoriaAPI);
console.log('- adicionarAoCarrinho:', typeof cardapioController.adicionarAoCarrinho);
console.log('- atualizarCarrinho:', typeof cardapioController.atualizarCarrinho);
console.log('- limparCarrinho:', typeof cardapioController.limparCarrinho);
console.log('- finalizarPedido:', typeof cardapioController.finalizarPedido);
console.log('- listarPedidosView:', typeof cardapioController.listarPedidosView);

// ✅ Cardápio principal
router.get('/', cardapioController.cardapioView);

// ✅ Ingredientes de produto
router.get('/ingredientes/:produtoId', cardapioController.obterIngredientesProduto);

// ✅ Categorias e filtros
router.get('/categoria/filtrar', cardapioController.filtrarCategoriaAPI);

// ✅ Carrinho
router.post('/carrinho/adicionar', cardapioController.adicionarAoCarrinho);
router.post('/carrinho/atualizar', cardapioController.atualizarCarrinho);
router.post('/carrinho/limpar', cardapioController.limparCarrinho);

// ✅ Pedidos
router.post('/pedido/finalizar', cardapioController.finalizarPedido);
router.get('/pedidos', cardapioController.listarPedidosView);

// ✅ Confirmar pedido após pagamento
router.post('/pedido/confirmar', cardapioController.confirmarPedidoPago);

// ✅ Limpar sessão
router.post('/sessao/limpar', cardapioController.limparSessao);

// ✅ Alias
router.get('/home', cardapioController.cardapioView);
router.get('/menu', cardapioController.cardapioView);

module.exports = router;