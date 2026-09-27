const Database = require("../utils/database");

class ProdutoModel {

    #produtoId;
    #produtoNome;
    #produtoDescricao;
    #produtoPreco;
    #produtoCategoria;
    #produtoImagemUrl;
    #produtoEmPromocao;
    #produtoPrecoPromocional;
    #produtoDisponivel;

    get produtoId() {
        return this.#produtoId;
    }

    set produtoId(value) {
        this.#produtoId = value;
    }

    get produtoNome() {
        return this.#produtoNome;
    }

    set produtoNome(value) {
        this.#produtoNome = value;
    }

    get produtoDescricao() {
        return this.#produtoDescricao;
    }

    set produtoDescricao(value) {
        this.#produtoDescricao = value;
    }

    get produtoPreco() {
        return this.#produtoPreco;
    }

    set produtoPreco(value) {
        this.#produtoPreco = value;
    }

    get produtoCategoria() {
        return this.#produtoCategoria;
    }

    set produtoCategoria(value) {
        this.#produtoCategoria = value;
    }

    get produtoImagemUrl() {
        return this.#produtoImagemUrl;
    }

    set produtoImagemUrl(value) {
        this.#produtoImagemUrl = value;
    }

    get produtoEmPromocao() {
        return this.#produtoEmPromocao;
    }

    set produtoEmPromocao(value) {
        this.#produtoEmPromocao = value;
    }

    get produtoPrecoPromocional() {
        return this.#produtoPrecoPromocional;
    }

    set produtoPrecoPromocional(value) {
        this.#produtoPrecoPromocional = value;
    }

    get produtoDisponivel() {
        return this.#produtoDisponivel;
    }

    set produtoDisponivel(value) {
        this.#produtoDisponivel = value;
    }

    constructor(id, nome, descricao, preco, categoria, imagemUrl, emPromocao, precoPromocional, disponivel) {
        this.#produtoId = id;
        this.#produtoNome = nome;
        this.#produtoDescricao = descricao;
        this.#produtoPreco = preco;
        this.#produtoCategoria = categoria;
        this.#produtoImagemUrl = imagemUrl;
        this.#produtoEmPromocao = emPromocao;
        this.#produtoPrecoPromocional = precoPromocional;
        this.#produtoDisponivel = disponivel;
    }

    async listar() {
        try {
            // ✅ CORREÇÃO: SQL correto para produtos
            const sql = `SELECT 
                PROD_ID,
                PROD_NOME, 
                PROD_DESCRICAO, 
                PROD_PRECO, 
                PROD_CATEGORIA, 
                PROD_IMAGEM_URL, 
                PROD_EM_PROMOCAO, 
                PROD_PRECO_PROMOCIONAL, 
                PROD_DISPONIVEL
            FROM TB_PRODUTO ORDER BY PROD_NOME`;
            
            const banco = new Database();
            const rows = await banco.ExecutaComando(sql);

            let listaProdutoModel = [];
            for(let i = 0; i < rows.length; i++) {
                let produto = new ProdutoModel();
                produto.produtoId = rows[i]["PROD_ID"];
                produto.produtoNome = rows[i]["PROD_NOME"];
                produto.produtoDescricao = rows[i]["PROD_DESCRICAO"];
                produto.produtoPreco = rows[i]["PROD_PRECO"];
                produto.produtoCategoria = rows[i]["PROD_CATEGORIA"];
                produto.produtoImagemUrl = rows[i]["PROD_IMAGEM_URL"];
                produto.produtoEmPromocao = rows[i]["PROD_EM_PROMOCAO"];
                produto.produtoPrecoPromocional = rows[i]["PROD_PRECO_PROMOCIONAL"];
                produto.produtoDisponivel = rows[i]["PROD_DISPONIVEL"];

                listaProdutoModel.push(produto);
            }

            return listaProdutoModel;
        } catch (error) {
            console.error('❌ Erro no ProdutoModel.listar:', error);
            return [];
        }
    }

async obterPorId(id) {
    try {
        const sql = `SELECT 
            PROD_ID,
            PROD_NOME, 
            PROD_DESCRICAO, 
            PROD_PRECO, 
            PROD_CATEGORIA, 
            PROD_IMAGEM_URL, 
            PROD_EM_PROMOCAO, 
            PROD_PRECO_PROMOCIONAL, 
            PROD_DISPONIVEL
        FROM TB_PRODUTO WHERE PROD_ID = ?`;
        
        const valores = [id];
        const banco = new Database();
        const rows = await banco.ExecutaComando(sql, valores);

        // ✅ ADICIONE ESTE LOG AQUI
        console.log('🔍 DEBUG - Row do banco:', rows[0]);

        if (rows.length > 0) {
            let produto = new ProdutoModel();
            produto.produtoId = rows[0]["PROD_ID"];
            produto.produtoNome = rows[0]["PROD_NOME"];
            produto.produtoDescricao = rows[0]["PROD_DESCRICAO"];
            produto.produtoPreco = rows[0]["PROD_PRECO"];
            produto.produtoCategoria = rows[0]["PROD_CATEGORIA"];
            produto.produtoImagemUrl = rows[0]["PROD_IMAGEM_URL"];
            produto.produtoEmPromocao = rows[0]["PROD_EM_PROMOCAO"];
            produto.produtoPrecoPromocional = rows[0]["PROD_PRECO_PROMOCIONAL"];
            produto.produtoDisponivel = rows[0]["PROD_DISPONIVEL"];

            // ✅ E ESTE LOG AQUI
            console.log('🔍 DEBUG - Produto montado:', {
                id: produto.produtoId,
                nome: produto.produtoNome,
                categoria: produto.produtoCategoria
            });

            return produto;
        }
        return null;
    } catch (error) {
        console.error('❌ Erro no ProdutoModel.obterPorId:', error);
        return null;
    }
}

async cadastrar() {
    const sql = `
        INSERT INTO TB_PRODUTO
        (PROD_NOME, PROD_DESCRICAO, PROD_PRECO, PROD_CATEGORIA,
         PROD_IMAGEM_URL, PROD_EM_PROMOCAO, PROD_PRECO_PROMOCIONAL, PROD_DISPONIVEL)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
        this.#produtoNome,
        this.#produtoDescricao,
        this.#produtoPreco,
        this.#produtoCategoria,
        this.#produtoImagemUrl,
        this.#produtoEmPromocao,
        this.#produtoPrecoPromocional,
        this.#produtoDisponivel
    ];

    try {
        const banco = new Database();
        const insertId = await banco.ExecutaComandoLastInserted(sql, valores); // ✅ esse método retorna o novo ID
        console.log("🆕 Novo produto inserido com ID:", insertId);
        return { insertId };
    } catch (error) {
        console.error("❌ Erro no ProdutoModel.cadastrar:", error);
        return false;
    }
}

    async atualizar() {
        const sql = "UPDATE TB_PRODUTO SET PROD_NOME = ?, PROD_DESCRICAO = ?, PROD_PRECO = ?, PROD_CATEGORIA = ?, PROD_IMAGEM_URL = ?, PROD_EM_PROMOCAO = ?, PROD_PRECO_PROMOCIONAL = ?, PROD_DISPONIVEL = ? WHERE PROD_ID = ?";

        const valores = [
            this.#produtoNome,
            this.#produtoDescricao,
            this.#produtoPreco,
            this.#produtoCategoria,
            this.#produtoImagemUrl,
            this.#produtoEmPromocao,
            this.#produtoPrecoPromocional,
            this.#produtoDisponivel,
            this.#produtoId
        ];

        const banco = new Database();
        const result = await banco.ExecutaComandoNonQuery(sql, valores);

        return result;
    }

async excluir(id) {
    const banco = new Database();
    try {
        // 🧩 1️⃣ Remover vínculos de ingredientes antes de excluir o produto
        const sqlDeleteVinculos = "DELETE FROM TB_PRODUTO_INGREDIENTES WHERE PROD_ID = ?";
        await banco.ExecutaComandoNonQuery(sqlDeleteVinculos, [id]);
        console.log(`🔗 Vínculos de ingredientes do produto ${id} removidos.`);

        // 🧩 2️⃣ Agora excluir o produto da tabela principal
        const sqlDeleteProduto = "DELETE FROM TB_PRODUTO WHERE PROD_ID = ?";
        const result = await banco.ExecutaComandoNonQuery(sqlDeleteProduto, [id]);
        console.log(`🗑️ Produto ${id} excluído com sucesso.`);

        return result;
    } catch (error) {
        console.error("❌ Erro ao excluir produto e vínculos:", error);
        throw error;
    }
}

    async listarPorCategoria(categoria) {
        const sql = "SELECT * FROM TB_PRODUTO WHERE PROD_CATEGORIA = ? AND PROD_DISPONIVEL = 1";
        const valores = [categoria];

        const banco = new Database();
        const rows = await banco.ExecutaComando(sql, valores);

        let listaProdutoModel = [];
        for(let i = 0; i < rows.length; i++) {
            let produto = new ProdutoModel();
            produto.produtoId = rows[i]["PROD_ID"];
            produto.produtoNome = rows[i]["PROD_NOME"];
            produto.produtoDescricao = rows[i]["PROD_DESCRICAO"];
            produto.produtoPreco = rows[i]["PROD_PRECO"];
            produto.produtoCategoria = rows[i]["PROD_CATEGORIA"];
            produto.produtoImagemUrl = rows[i]["PROD_IMAGEM_URL"];
            produto.produtoEmPromocao = rows[i]["PROD_EM_PROMOCAO"];
            produto.produtoPrecoPromocional = rows[i]["PROD_PRECO_PROMOCIONAL"];
            produto.produtoDisponivel = rows[i]["PROD_DISPONIVEL"];

            listaProdutoModel.push(produto);
        }

        return listaProdutoModel;
    }

    async listarPromocoes() {
        const sql = "SELECT * FROM TB_PRODUTO WHERE PROD_EM_PROMOCAO = 1 AND PROD_DISPONIVEL = 1 LIMIT 3";

        const banco = new Database();
        const rows = await banco.ExecutaComando(sql);

        let listaProdutoModel = [];
        for(let i = 0; i < rows.length; i++) {
            let produto = new ProdutoModel();
            produto.produtoId = rows[i]["PROD_ID"];
            produto.produtoNome = rows[i]["PROD_NOME"];
            produto.produtoDescricao = rows[i]["PROD_DESCRICAO"];
            produto.produtoPreco = rows[i]["PROD_PRECO"];
            produto.produtoCategoria = rows[i]["PROD_CATEGORIA"];
            produto.produtoImagemUrl = rows[i]["PROD_IMAGEM_URL"];
            produto.produtoEmPromocao = rows[i]["PROD_EM_PROMOCAO"];
            produto.produtoPrecoPromocional = rows[i]["PROD_PRECO_PROMOCIONAL"];
            produto.produtoDisponivel = rows[i]["PROD_DISPONIVEL"];

            listaProdutoModel.push(produto);
        }

        return listaProdutoModel;
    }

}

module.exports = ProdutoModel;