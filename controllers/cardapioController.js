const Database = require("../utils/database");
const ProdutoModel = require("../models/Produto");
const PedidoModel = require("../models/Pedido");
const IngredienteModel = require("../models/Ingrediente");
const BannerModel = require("../models/Banner");

// 🧠 Cache simples
let cacheCardapio = null;
let cacheTimestamp = 0;

// ============================================
// DADOS MOCK (usados quando o banco está indisponível)
// ============================================

// ✅ ADICIONAIS MOCK (fonte única de ingredientes)
const ingredientesModelMock = [
  { ingId: 1, ingNome: "Bacon extra", ingCategoria: "Adicionais", ingPrecoAdicional: 4.00 },
  { ingId: 2, ingNome: "Queijo extra", ingCategoria: "Adicionais", ingPrecoAdicional: 3.00 },
  { ingId: 3, ingNome: "Cebola caramelizada", ingCategoria: "Adicionais", ingPrecoAdicional: 2.50 },
  { ingId: 4, ingNome: "Molho especial", ingCategoria: "Molhos", ingPrecoAdicional: 1.50 },
  { ingId: 5, ingNome: "Ovo", ingCategoria: "Adicionais", ingPrecoAdicional: 3.00 },
  { ingId: 6, ingNome: "Picles", ingCategoria: "Adicionais", ingPrecoAdicional: 1.00 }
];

// ✅ Vínculo produto -> ids de ingredientes disponíveis
const produtoIngredientesMock = {
  1: [1, 2, 4],       // X-Burger Clássico
  2: [1, 2, 3, 4],    // X-Bacon
  3: [],              // Batata Frita
  4: []               // Refrigerante Lata
};

const produtosMock = [
  {
    id: 1, nome: "X-Burger Clássico", descricao: "Pão, carne, queijo, alface e tomate",
    preco: 22.90, preco_promocional: null,
    imagem_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    categoria: "hamburguer", em_promocao: false, disponivel: true,
    ingredientes: ingredientesModelMock.filter(i => produtoIngredientesMock[1].includes(i.ingId))
  },
  {
    id: 2, nome: "X-Bacon", descricao: "Pão, carne, bacon, queijo e molho especial",
    preco: 27.90, preco_promocional: 24.90,
    imagem_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500",
    categoria: "hamburguer", em_promocao: true, disponivel: true,
    ingredientes: ingredientesModelMock.filter(i => produtoIngredientesMock[2].includes(i.ingId))
  },
  {
    id: 3, nome: "Batata Frita", descricao: "Porção de batata frita crocante",
    preco: 14.90, preco_promocional: null,
    imagem_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
    categoria: "acompanhamento", em_promocao: false, disponivel: true, ingredientes: []
  },
  {
    id: 4, nome: "Refrigerante Lata", descricao: "350ml, diversos sabores",
    preco: 6.50, preco_promocional: null,
    imagem_url: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=500",
    categoria: "bebida", em_promocao: false, disponivel: true, ingredientes: []
  }
];

const produtosModelMock = produtosMock.map(p => ({
  produtoId: p.id,
  produtoNome: p.nome,
  produtoDescricao: p.descricao,
  produtoPreco: p.preco,
  produtoPrecoPromocional: p.preco_promocional,
  produtoImagemUrl: p.imagem_url,
  produtoCategoria: p.categoria,
  produtoEmPromocao: p.em_promocao ? 1 : 0,
  produtoDisponivel: p.disponivel ? 1 : 0
}));

const bannersMock = [
  {
    bannerId: 1,
    titulo: "Combo Duplo em Oferta",
    imagemUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200",
    precoOriginal: 39.90,
    precoPromocional: 29.90,
    ativo: 1
  },
  {
    bannerId: 2,
    titulo: "X-Bacon Especial",
    imagemUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=1200",
    precoOriginal: 32.90,
    precoPromocional: 24.90,
    ativo: 1
  }
];

const cardapioController = {
  // ✅ CARDÁPIO PRINCIPAL
  async cardapioView(req, res) {
    try {
      const agora = Date.now();
      // ✅ Ignora cache no serverless da Vercel (instância nova a cada request)
      const cacheValido = false;

      if (cacheValido && cacheCardapio) {
        console.log("⚡ Servindo /cardapio via cache");
        return res.render("cardapio", {
          ...cacheCardapio,
          carrinho: req.session.carrinho || [],
        });
      }

      const db = new Database();
      const sql = `
        SELECT 
          p.PROD_ID, p.PROD_NOME, p.PROD_DESCRICAO, p.PROD_PRECO,
          p.PROD_CATEGORIA, p.PROD_IMAGEM_URL, p.PROD_EM_PROMOCAO,
          p.PROD_PRECO_PROMOCIONAL, p.PROD_DISPONIVEL,
          i.ING_ID, i.ING_NOME, i.ING_CATEGORIA, i.ING_PRECO_ADICIONAL
        FROM TB_PRODUTO p
        LEFT JOIN TB_PRODUTO_INGREDIENTES pi ON pi.PROD_ID = p.PROD_ID
        LEFT JOIN TB_INGREDIENTES i ON i.ING_ID = pi.ING_ID
        ORDER BY p.PROD_NOME;
      `;
      const rows = await db.ExecutaComando(sql);

      const produtosMap = new Map();
      for (const row of rows) {
        if (!produtosMap.has(row.PROD_ID)) {
          produtosMap.set(row.PROD_ID, {
            id: row.PROD_ID,
            nome: row.PROD_NOME,
            descricao: row.PROD_DESCRICAO,
            preco: row.PROD_PRECO,
            preco_promocional: row.PROD_PRECO_PROMOCIONAL,
            imagem_url: row.PROD_IMAGEM_URL,
            categoria: row.PROD_CATEGORIA,
            em_promocao: row.PROD_EM_PROMOCAO === 1,
            disponivel: row.PROD_DISPONIVEL === 1,
            ingredientes: [],
          });
        }
        if (row.ING_ID) {
          produtosMap.get(row.PROD_ID).ingredientes.push({
            ingId: row.ING_ID,
            ingNome: row.ING_NOME,
            ingCategoria: row.ING_CATEGORIA,
            ingPrecoAdicional: row.ING_PRECO_ADICIONAL,
          });
        }
      }

      const produtosComIngredientes = Array.from(produtosMap.values());

      // ✅ Se não veio nada do banco, força o fallback
      if (produtosComIngredientes.length === 0) {
        throw new Error("Banco retornou vazio — usando mock");
      }

      const categoria = req.query.categoria || "todos";
      const produtosFiltrados =
        categoria === "todos"
          ? produtosComIngredientes.filter((p) => p.disponivel)
          : produtosComIngredientes.filter(
              (p) => p.disponivel && p.categoria === categoria
            );

      const bannerModel = new BannerModel();
      const banners = await bannerModel.listarAtivos();

      if (!req.session.carrinho) req.session.carrinho = [];

      const dataRender = {
        title: "Cardápio - Burger House",
        produtos: produtosFiltrados,
        banners: banners || [],
        categoriaAtiva: categoria,
      };

      cacheCardapio = dataRender;
      cacheTimestamp = agora;

      console.log(`✅ ${produtosFiltrados.length} produtos renderizados`);
      res.render("cardapio", { ...dataRender, carrinho: req.session.carrinho });
    } catch (error) {
      console.warn("⚠️ Banco indisponível, usando dados de demonstração (cardapioView)");

      if (!req.session.carrinho) req.session.carrinho = [];
      const categoria = req.query.categoria || "todos";
      const produtosFiltrados =
        categoria === "todos"
          ? produtosMock.filter((p) => p.disponivel)
          : produtosMock.filter((p) => p.disponivel && p.categoria === categoria);

      const dataRender = {
        title: "Cardápio - Burger House",
        produtos: produtosFiltrados,
        banners: bannersMock,
        categoriaAtiva: categoria,
      };

      res.render("cardapio", { ...dataRender, carrinho: req.session.carrinho });
    }
  },

  // ✅ INGREDIENTES (modal de personalização)
  async obterIngredientesProduto(req, res) {
    try {
      const { produtoId } = req.params;
      const ingrediente = new IngredienteModel();
      const ingredientes = await ingrediente.listarPorProduto(produtoId);

      if (!ingredientes || ingredientes.length === 0) {
        throw new Error("Nenhum ingrediente encontrado no banco");
      }

      const agrupados = ingredientes.reduce((acc, ing) => {
        if (!acc[ing.ingCategoria]) acc[ing.ingCategoria] = [];
        acc[ing.ingCategoria].push(ing);
        return acc;
      }, {});
      res.json({ ok: true, ingredientes: agrupados });
    } catch (error) {
      console.warn("⚠️ Banco indisponível, usando dados de demonstração (obterIngredientesProduto)");
      const produtoId = parseInt(req.params.produtoId, 10);
      const idsPermitidos = produtoIngredientesMock[produtoId] || [];
      const ingredientesDoProduto = ingredientesModelMock.filter(i => idsPermitidos.includes(i.ingId));

      const agrupados = ingredientesDoProduto.reduce((acc, ing) => {
        if (!acc[ing.ingCategoria]) acc[ing.ingCategoria] = [];
        acc[ing.ingCategoria].push(ing);
        return acc;
      }, {});
      res.json({ ok: true, ingredientes: agrupados });
    }
  },

  // ✅ FILTRAGEM DE CATEGORIA VIA AJAX
  async filtrarCategoriaAPI(req, res) {
    try {
      const { categoria } = req.query;
      const produto = new ProdutoModel();
      const produtos = await produto.listar();

      if (!produtos || produtos.length === 0) {
        throw new Error("Nenhum produto encontrado no banco");
      }

      let produtosFiltrados = produtos.filter((p) => p.produtoDisponivel === 1);
      if (categoria && categoria !== "todos") {
        produtosFiltrados = produtosFiltrados.filter(
          (p) => p.produtoCategoria === categoria
        );
      }
      res.json({ ok: true, produtos: produtosFiltrados });
    } catch (error) {
      console.warn("⚠️ Banco indisponível, usando dados de demonstração (filtrarCategoriaAPI)");
      const { categoria } = req.query;
      let produtosFiltrados = produtosModelMock.filter((p) => p.produtoDisponivel === 1);
      if (categoria && categoria !== "todos") {
        produtosFiltrados = produtosFiltrados.filter((p) => p.produtoCategoria === categoria);
      }
      res.json({ ok: true, produtos: produtosFiltrados });
    }
  },

  // ✅ ADICIONAR AO CARRINHO (COM ÍNDICE ÚNICO)
  async adicionarAoCarrinho(req, res) {
    try {
      const { produtoId, personalizado, ingredientes, precoPersonalizado, descricaoPersonalizada, removidos } = req.body;

      if (!produtoId) {
        return res.json({ ok: false, msg: "ID do produto não informado" });
      }

      const produtoModel = new ProdutoModel();
      const ingredienteModel = new IngredienteModel();
      let produto = await produtoModel.obterPorId(produtoId);

      if (!produto || produto.produtoDisponivel !== 1) {
        throw new Error("Produto não encontrado no banco"); // ✅ força cair no catch/fallback
      }

      if (!req.session.carrinho) req.session.carrinho = [];

      let precoFinal, nomeProduto, ingredientesFormatados = [];

      if (personalizado && precoPersonalizado) {
        precoFinal = parseFloat(precoPersonalizado);
        nomeProduto = descricaoPersonalizada || produto.produtoNome;

        if (ingredientes && Array.isArray(ingredientes)) {
          const todosIngredientes = await ingredienteModel.listarTodos();
          ingredientes.forEach(ing => {
            const ingReal = todosIngredientes.find(i => i.ingId == ing.ingId);
            if (ingReal) {
              ingredientesFormatados.push({
                ingId: ing.ingId,
                ingNome: ingReal.ingNome,
                preco: ing.preco || 0
              });
            }
          });
        }
      } else {
        precoFinal = produto.produtoEmPromocao === 1
          ? produto.produtoPrecoPromocional
          : produto.produtoPreco;
        nomeProduto = produto.produtoNome;
      }

      const itemId = Date.now() + Math.floor(Math.random() * 10000);
      const itemIndex = req.session.carrinho.length;

      const novoItem = {
        id: itemId,
        itemIndex: itemIndex,
        produtoId: produto.produtoId,
        nome: nomeProduto,
        preco: precoFinal,
        quantidade: 1,
        imagem_url: produto.produtoImagemUrl,
        personalizado: personalizado || false,
        ingredientes: ingredientesFormatados,
        removidos: Array.isArray(removidos) ? removidos : []
      };

      req.session.carrinho.push(novoItem);

      req.session.save(err => {
        if (err) return res.json({ ok: false, msg: "Erro ao salvar sessão" });
        res.json({
          ok: true,
          msg: `${nomeProduto} adicionado ao carrinho!`,
          carrinho: req.session.carrinho
        });
      });
    } catch (error) {
      console.warn("⚠️ Banco indisponível, usando dados de demonstração (adicionarAoCarrinho)");
      const { produtoId, personalizado, ingredientes, precoPersonalizado, descricaoPersonalizada, removidos } = req.body;
      const produto = produtosModelMock.find(p => p.produtoId == produtoId);

      if (!produto) {
        return res.json({ ok: false, msg: "Produto indisponível" });
      }

      if (!req.session.carrinho) req.session.carrinho = [];

      let ingredientesFormatados = [];
      if (personalizado && Array.isArray(ingredientes)) {
        ingredientes.forEach(ing => {
          const ingReal = ingredientesModelMock.find(i => i.ingId == ing.ingId);
          if (ingReal) {
            ingredientesFormatados.push({
              ingId: ingReal.ingId,
              ingNome: ingReal.ingNome,
              preco: ing.preco || ingReal.ingPrecoAdicional || 0
            });
          }
        });
      }

      const precoFinal = personalizado && precoPersonalizado
        ? parseFloat(precoPersonalizado)
        : (produto.produtoEmPromocao === 1 ? produto.produtoPrecoPromocional : produto.produtoPreco);
      const nomeProduto = descricaoPersonalizada || produto.produtoNome;

      const novoItem = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        itemIndex: req.session.carrinho.length,
        produtoId: produto.produtoId,
        nome: nomeProduto,
        preco: precoFinal,
        quantidade: 1,
        imagem_url: produto.produtoImagemUrl,
        personalizado: personalizado || false,
        ingredientes: ingredientesFormatados,
        removidos: Array.isArray(removidos) ? removidos : []
      };

      req.session.carrinho.push(novoItem);
      req.session.save(err => {
        if (err) return res.json({ ok: false, msg: "Erro ao salvar sessão" });
        res.json({ ok: true, msg: `${nomeProduto} adicionado ao carrinho!`, carrinho: req.session.carrinho });
      });
    }
  },

  // ✅ ATUALIZAR CARRINHO
  async atualizarCarrinho(req, res) {
    try {
      const { itemId, quantidade } = req.body;

      if (!itemId) {
        return res.json({ ok: false, msg: "ID do item não informado" });
      }

      if (!req.session.carrinho) {
        return res.json({ ok: false, msg: "Carrinho vazio" });
      }

      const index = req.session.carrinho.findIndex(item => item.id == itemId);

      if (index === -1) {
        return res.json({ ok: false, msg: "Item não encontrado" });
      }

      const itemAtual = req.session.carrinho[index];
      const quantidadeAtual = itemAtual.quantidade || 1;

      if (quantidade > quantidadeAtual) {
        const novoItem = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          itemIndex: req.session.carrinho.length,
          produtoId: itemAtual.produtoId,
          nome: itemAtual.nome,
          preco: itemAtual.preco,
          quantidade: 1,
          imagem_url: itemAtual.imagem_url,
          personalizado: itemAtual.personalizado || false,
          ingredientes: itemAtual.ingredientes || [],
          removidos: itemAtual.removidos || []
        };

        req.session.carrinho.push(novoItem);
      }
      else if (quantidade < quantidadeAtual) {
        const ultimoIndex = req.session.carrinho
          .map((item, idx) => ({ item, idx }))
          .reverse()
          .find(({ item }) => item.produtoId === itemAtual.produtoId)?.idx;

        if (ultimoIndex !== undefined) {
          req.session.carrinho.splice(ultimoIndex, 1);
        }
      }

      req.session.save(err => {
        if (err) return res.json({ ok: false, msg: "Erro ao salvar sessão" });
        res.json({ ok: true, carrinho: req.session.carrinho });
      });
    } catch (error) {
      console.error("❌ Erro ao atualizar carrinho:", error);
      res.json({ ok: false, msg: "Erro interno" });
    }
  },

  // ✅ LIMPAR CARRINHO
  async limparCarrinho(req, res) {
    try {
      req.session.carrinho = [];
      req.session.save(err => {
        if (err) return res.json({ ok: false, msg: "Erro ao limpar carrinho" });
        res.json({ ok: true, msg: "Carrinho limpo com sucesso" });
      });
    } catch (error) {
      console.error("❌ Erro ao limpar carrinho:", error);
      res.json({ ok: false, msg: "Erro interno" });
    }
  },

  async finalizarPedido(req, res) {
    try {
      if (!req.session.carrinho || req.session.carrinho.length === 0) {
        return res.json({ ok: false, msg: "Carrinho vazio" });
      }

      const numeroPedido = Date.now().toString().slice(-6);
      const total = req.session.carrinho.reduce(
        (sum, item) => sum + item.preco * item.quantidade, 0
      );

      const itensDetalhados = req.session.carrinho.map((item, index) => ({
        itemIndex: index,
        itemId: item.id,
        produtoId: item.produtoId,
        nome: item.nome,
        quantidade: 1,
        precoUnitario: item.preco,
        subtotal: item.preco * 1,
        personalizado: item.personalizado || false,
        adicionais: (item.ingredientes || []).map(ing => ({
          nome: ing.ingNome,
          preco: ing.preco || 0
        })),
        removidos: item.removidos || []
      }));

      req.session.pedidoPendente = {
        numeroPedido,
        total,
        itens: itensDetalhados,
        observacoes: req.body.observacoes || ''
      };

      res.json({
        ok: true,
        msg: 'Pedido criado. Aguardando pagamento.',
        numeroPedido,
        total: total,
        carrinho: req.session.carrinho
      });

    } catch (error) {
      console.error("❌ Erro ao finalizar pedido:", error);
      res.json({ ok: false, msg: "Erro interno ao finalizar pedido" });
    }
  },

  async confirmarPedidoPago(req, res) {
    try {
      const { numeroPedido, pagamentoId } = req.body;

      if (!req.session.pedidoPendente) {
        return res.json({ ok: false, msg: 'Nenhum pedido pendente' });
      }

      const { itens, total, observacoes } = req.session.pedidoPendente;

      const adicionaisTexto = itens
        .filter(item => item.adicionais.length > 0)
        .map(item => {
          const listaAdic = item.adicionais
            .map(ad => `${ad.nome}${ad.preco > 0 ? ` (+R$ ${ad.preco.toFixed(2)})` : ''}`)
            .join(', ');
          return `[Item ${item.itemIndex + 1}] ${item.nome}: ${listaAdic}`;
        })
        .join(' | ');

      const removidosTexto = itens
        .filter(item => item.removidos.length > 0)
        .map(item => `[Item ${item.itemIndex + 1}] ${item.nome}: ${item.removidos.join(', ')}`)
        .join(' | ');

      try {
        const pedido = new PedidoModel(
          0,
          numeroPedido,
          JSON.stringify(itens),
          total,
          "pago",
          observacoes,
          null,
          null,
          adicionaisTexto || null,
          removidosTexto || null
        );

        const resultado = await pedido.cadastrar();

        if (resultado) {
          req.session.carrinho = [];
          req.session.pedidoPendente = null;

          return res.json({
            ok: true,
            msg: 'Pedido confirmado e salvo!',
            numeroPedido
          });
        }

        return res.json({ ok: false, msg: 'Erro ao salvar pedido' });
      } catch (dbError) {
        console.warn("⚠️ Banco indisponível — pedido confirmado apenas em memória (modo demonstração)");
        req.session.carrinho = [];
        req.session.pedidoPendente = null;
        return res.json({ ok: true, msg: 'Pedido confirmado! (modo demonstração, sem banco)', numeroPedido });
      }

    } catch (error) {
      console.error('❌ Erro ao confirmar pedido:', error);
      res.json({ ok: false, msg: 'Erro ao confirmar pedido' });
    }
  },

  async limparSessao(req, res) {
    try {
      req.session.carrinho = [];
      req.session.pedidoPendente = null;
      req.session.destroy();

      res.json({ ok: true, msg: 'Sessão limpa' });
    } catch (error) {
      res.json({ ok: false, msg: 'Erro ao limpar sessão' });
    }
  },

  async listarPedidosView(req, res) {
    try {
      const pedido = new PedidoModel();
      const pedidos = await pedido.listar();
      res.render("pedidos", { title: "Meus Pedidos", pedidos });
    } catch (error) {
      console.warn("⚠️ Banco indisponível, usando dados de demonstração (listarPedidosView)");
      res.render("pedidos", { title: "Meus Pedidos", pedidos: [] });
    }
  }
};

module.exports = cardapioController;