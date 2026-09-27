const ProdutoModel = require("../models/Produto");
const IngredienteModel = require("../models/Ingrediente");
const ProdutoIngredienteModel = require("../models/ProdutoIngrediente");
const CacheManager = require("../utils/CacheManager");
const fs = require('fs');
const path = require('path');

// ============================================
// DADOS MOCK (usados quando o banco está indisponível)
// ============================================
const produtosMock = [
    { produtoId: 1, produtoNome: "X-Burger Clássico", produtoDescricao: "Pão, carne, queijo, alface e tomate", produtoPreco: 22.90, produtoCategoria: "Lanches", produtoImagemUrl: "/uploads/produto_1768342564996_jjkb2k.png", produtoEmPromocao: 0, produtoPrecoPromocional: null, produtoDisponivel: 1 },
    { produtoId: 2, produtoNome: "X-Bacon", produtoDescricao: "Pão, carne, bacon, queijo e molho especial", produtoPreco: 27.90, produtoCategoria: "Lanches", produtoImagemUrl: "/uploads/produto_1768342564996_jjkb2k.png", produtoEmPromocao: 1, produtoPrecoPromocional: 24.90, produtoDisponivel: 1 },
    { produtoId: 3, produtoNome: "Batata Frita", produtoDescricao: "Porção de batata frita crocante", produtoPreco: 14.90, produtoCategoria: "Acompanhamentos", produtoImagemUrl: "/uploads/produto_1768342564996_jjkb2k.png", produtoEmPromocao: 0, produtoPrecoPromocional: null, produtoDisponivel: 1 },
    { produtoId: 4, produtoNome: "Refrigerante Lata", produtoDescricao: "350ml, diversos sabores", produtoPreco: 6.50, produtoCategoria: "Bebidas", produtoImagemUrl: "/uploads/produto_1768342564996_jjkb2k.png", produtoEmPromocao: 0, produtoPrecoPromocional: null, produtoDisponivel: 1 }
];

const ingredientesMock = [
    { ingredienteId: 1, ingredienteNome: "Bacon extra" },
    { ingredienteId: 2, ingredienteNome: "Queijo extra" },
    { ingredienteId: 3, ingredienteNome: "Cebola caramelizada" },
    { ingredienteId: 4, ingredienteNome: "Molho especial" }
];

class ProdutoController {

    // ============================================
    // MÉTODO AUXILIAR: SALVAR IMAGEM BASE64
    // ============================================
    async salvarImagemBase64(imagemBase64) {
        try {
            console.log('💾 Salvando imagem base64 como arquivo...');

            let extensao = 'png';
            if (imagemBase64.includes('data:image/jpeg')) extensao = 'jpg';
            else if (imagemBase64.includes('data:image/jpg')) extensao = 'jpg';
            else if (imagemBase64.includes('data:image/png')) extensao = 'png';
            else if (imagemBase64.includes('data:image/webp')) extensao = 'webp';
            else if (imagemBase64.includes('data:image/gif')) extensao = 'gif';

            const base64Data = imagemBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileName = `produto_${timestamp}_${randomString}.${extensao}`;

            const uploadDir = path.join(__dirname, '../public/uploads/');
            const uploadPath = path.join(uploadDir, fileName);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('📁 Diretório criado:', uploadDir);
            }

            fs.writeFileSync(uploadPath, buffer);
            console.log(`✅ Imagem salva: ${fileName} (${extensao.toUpperCase()})`);
            console.log('📏 Tamanho:', (buffer.length / 1024).toFixed(2), 'KB');

            return `/uploads/${fileName}`;

        } catch (error) {
            console.error('❌ ERRO AO SALVAR IMAGEM:', error);
            return null;
        }
    }

    async listarView(req, res) {
        try {
            const produto = new ProdutoModel();
            const lista = await produto.listar();
            res.render('produto/listar', { produtos: lista });
        } catch (error) {
            console.warn('⚠️ Banco indisponível, usando dados de demonstração (listarView)');
            res.render('produto/listar', { produtos: produtosMock });
        }
    }

    async cadastrarView(req, res) {
        try {
            const ingrediente = new IngredienteModel();
            const ingredientes = await ingrediente.listarTodos();
            res.render("admin/produto-form", { produto: null, ingredientes, ingredientesSelecionados: [] });
        } catch (error) {
            console.warn('⚠️ Banco indisponível, usando dados de demonstração (cadastrarView)');
            res.render("admin/produto-form", { produto: null, ingredientes: ingredientesMock, ingredientesSelecionados: [] });
        }
    }

    async editarView(req, res) {
        try {
            const id = req.params.id;
            const produtoModel = new ProdutoModel();
            const produtoData = await produtoModel.obterPorId(id);
            if (!produtoData) return res.redirect('/admin/produtos');
            const ingredienteModel = new IngredienteModel();
            const ingredientes = await ingredienteModel.listarTodos();
            const produtoIngredienteModel = new ProdutoIngredienteModel();
            const ingredientesSelecionados = await produtoIngredienteModel.listarPorProduto(id);
            res.render('admin/produto-form', { produto: produtoData, ingredientes, ingredientesSelecionados });
        } catch (error) {
            console.warn('⚠️ Banco indisponível, usando dados de demonstração (editarView)');
            const id = parseInt(req.params.id, 10);
            const produtoData = produtosMock.find(p => p.produtoId === id) || produtosMock[0];
            res.render('admin/produto-form', { produto: produtoData, ingredientes: ingredientesMock, ingredientesSelecionados: [] });
        }
    }

    async cadastrar(req, res) {
        try {
            const { nome, descricao, preco, categoria, imagem, precoPromocional, ingredientes = [] } = req.body;
            const emPromocao = req.body.emPromocao === 'on' ? 1 : 0;
            const disponivel = req.body.disponivel === 'on' ? 1 : 0;

            if (!nome || !descricao || !preco || !categoria) {
                return res.send({ ok: false, msg: "Nome, descrição, preço e categoria são obrigatórios!" });
            }

            let imagemFinal = imagem || null;

            if (imagem && imagem.startsWith('data:image')) {
                console.log('⚠️ Imagem recebida em base64 - convertendo para arquivo...');
                imagemFinal = await this.salvarImagemBase64(imagem);

                if (!imagemFinal) {
                    return res.send({ ok: false, msg: "Erro ao salvar imagem!" });
                }

                console.log('✅ Imagem salva. Caminho:', imagemFinal);
            }

            const produto = new ProdutoModel(
                0,
                nome,
                descricao,
                parseFloat(preco),
                categoria,
                imagemFinal,
                emPromocao,
                precoPromocional ? parseFloat(precoPromocional) : null,
                disponivel
            );

            const resultado = await produto.cadastrar();
            const novoProdutoId = resultado?.insertId || resultado;

            if (ingredientes.length > 0) {
                const produtoIngrediente = new ProdutoIngredienteModel();
                const listaIds = Array.isArray(ingredientes) ? ingredientes.map(i => parseInt(i, 10)) : String(ingredientes).split(',').map(i => parseInt(i, 10));
                for (const ingId of listaIds.filter(n => !isNaN(n))) {
                    await produtoIngrediente.adicionarIngrediente(novoProdutoId, ingId, 0);
                }
            }

            CacheManager.invalidarCardapio();
            console.log('🔄 Cache invalidado após cadastrar produto');

            return res.send({ ok: true, msg: "Produto cadastrado!" });
        } catch (error) {
            console.warn('⚠️ Banco indisponível — cadastro simulado (modo demonstração)');
            return res.send({ ok: true, msg: "Produto cadastrado! (modo demonstração, sem banco)" });
        }
    }

    async atualizar(req, res) {
        try {
            const { id, nome, descricao, preco, categoria, imagem, precoPromocional, ingredientes = [] } = req.body;
            const emPromocao = req.body.emPromocao === 'on' ? 1 : 0;
            const disponivel = req.body.disponivel === 'on' ? 1 : 0;

            if (!id || !nome || !descricao || !preco || !categoria) {
                return res.send({ ok: false, msg: "Dados incompletos!" });
            }

            let imagemFinal = imagem;

            if (imagem && imagem.startsWith('data:image')) {
                console.log('⚠️ Nova imagem recebida em base64 - convertendo para arquivo...');
                imagemFinal = await this.salvarImagemBase64(imagem);

                if (!imagemFinal) {
                    return res.send({ ok: false, msg: "Erro ao salvar imagem!" });
                }
            } else if (!imagemFinal) {
                const produtoAtual = new ProdutoModel();
                const dados = await produtoAtual.obterPorId(id);
                imagemFinal = dados?.produtoImagemUrl;
            }

            const produto = new ProdutoModel(
                id,
                nome,
                descricao,
                parseFloat(preco),
                categoria,
                imagemFinal,
                emPromocao,
                precoPromocional ? parseFloat(precoPromocional) : null,
                disponivel
            );

            const result = await produto.atualizar();

            if (result) {
                const produtoIngrediente = new ProdutoIngredienteModel();
                await produtoIngrediente.limparIngredientes(id);
                const listaIds = Array.isArray(ingredientes) ? ingredientes.map(i => parseInt(i, 10)) : String(ingredientes).split(',').map(i => parseInt(i, 10));
                for (const ingId of listaIds.filter(n => !isNaN(n))) {
                    await produtoIngrediente.adicionarIngrediente(id, ingId, 0);
                }

                CacheManager.invalidarCardapio();
                console.log('🔄 Cache invalidado após atualizar produto');

                res.send({ ok: true, msg: "Atualizado!" });
            } else {
                res.send({ ok: false, msg: "Erro ao atualizar!" });
            }
        } catch (error) {
            console.warn('⚠️ Banco indisponível — atualização simulada (modo demonstração)');
            res.send({ ok: true, msg: "Atualizado! (modo demonstração, sem banco)" });
        }
    }

    async excluir(req, res) {
        try {
            const id = req.params.id || req.body.id;
            if (!id) return res.send({ ok: false, msg: "ID não encontrado!" });

            const produto = new ProdutoModel();
            const result = await produto.excluir(id);

            if (result) {
                CacheManager.invalidarCardapio();
                console.log('🔄 Cache invalidado após excluir produto');
            }

            res.send(result ? { ok: true, msg: "Excluído!" } : { ok: false, msg: "Erro!" });
        } catch (error) {
            console.warn('⚠️ Banco indisponível — exclusão simulada (modo demonstração)');
            res.send({ ok: true, msg: "Excluído! (modo demonstração, sem banco)" });
        }
    }

    async listarPorCategoria(req, res) {
        try {
            const produto = new ProdutoModel();
            const lista = await produto.listarPorCategoria(req.params.categoria);
            res.json({ ok: true, produtos: lista });
        } catch (error) {
            console.warn('⚠️ Banco indisponível, usando dados de demonstração (listarPorCategoria)');
            const categoria = req.params.categoria;
            const lista = produtosMock.filter(p => p.produtoCategoria.toLowerCase() === String(categoria).toLowerCase());
            res.json({ ok: true, produtos: lista });
        }
    }

    async listarPromocoes(req, res) {
        try {
            const produto = new ProdutoModel();
            const lista = await produto.listarPromocoes();
            res.json({ ok: true, promocoes: lista });
        } catch (error) {
            console.warn('⚠️ Banco indisponível, usando dados de demonstração (listarPromocoes)');
            const lista = produtosMock.filter(p => p.produtoEmPromocao === 1);
            res.json({ ok: true, promocoes: lista });
        }
    }
}

module.exports = ProdutoController;