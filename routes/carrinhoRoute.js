const express = require('express');
const router = express.Router();

// ✅ Adicionar produto ao carrinho
// ✅ Adicionar produto ao carrinho (corrigido)
router.post('/adicionar', (req, res) => {
  try {
    const {
      produtoId,
      personalizado,
      ingredientes,
      removidos,
      precoPersonalizado,
      descricaoPersonalizada
    } = req.body;

    if (!produtoId) {
      return res.json({ ok: false, msg: 'ID do produto não informado' });
    }

    // 🔹 Inicializa o carrinho se ainda não existir
    if (!req.session.carrinho) req.session.carrinho = [];
    const carrinho = req.session.carrinho;

    // 🔍 Verifica se já existe item igual (mesmo produto + mesma personalização)
    const itemExistente = carrinho.find(item =>
      item.produtoId == produtoId &&
      JSON.stringify(item.removidos || []) === JSON.stringify(removidos || []) &&
      JSON.stringify(item.ingredientes || []) === JSON.stringify(ingredientes || [])
    );

    if (itemExistente) {
      // ✅ Se já existir, soma a quantidade
      itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
    } else {
      // ✅ Novo item no carrinho
      const novoItem = {
        id: Date.now(),
        produtoId,
        nome: descricaoPersonalizada || `Produto ${produtoId}`,
        preco: precoPersonalizado || 0,
        quantidade: 1,
        personalizado: personalizado || false,
        ingredientes: ingredientes || [],
        removidos: removidos || [],
        imagem_url: null
      };

      carrinho.push(novoItem);
    }

    req.session.carrinho = carrinho;
    console.log('🛒 Carrinho atualizado:', carrinho);

    return res.json({
      ok: true,
      msg: 'Produto adicionado ao carrinho!',
      carrinho
    });

  } catch (error) {
    console.error('💥 Erro ao adicionar produto ao carrinho:', error);
    return res.json({ ok: false, msg: 'Erro interno ao adicionar produto' });
  }
});


// ✅ Atualizar ou remover item do carrinho
router.post('/atualizar', (req, res) => {
    try {
        const { itemId, quantidade } = req.body;
        if (!req.session.carrinho) req.session.carrinho = [];

        if (!itemId) {
            return res.json({ ok: false, msg: 'ID do item não informado' });
        }

        const item = req.session.carrinho.find(i => i.id == itemId);
        if (!item) {
            return res.json({ ok: false, msg: 'Item não encontrado no carrinho' });
        }

        if (quantidade <= 0) {
            // remover item
            req.session.carrinho = req.session.carrinho.filter(i => i.id != itemId);
        } else {
            item.quantidade = quantidade;
        }

        return res.json({
            ok: true,
            msg: 'Carrinho atualizado',
            carrinho: req.session.carrinho
        });
    } catch (error) {
        console.error('💥 Erro ao atualizar carrinho:', error);
        return res.json({ ok: false, msg: 'Erro ao atualizar carrinho' });
    }
});

module.exports = router;
