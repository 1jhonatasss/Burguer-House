// models/ProdutoIngredienteModel.js
const Database = require("../utils/database");

class ProdutoIngredienteModel {
    #produtoId;
    #ingredienteId;
    #padrao;

    get produtoId() { return this.#produtoId; }
    set produtoId(value) { this.#produtoId = value; }

    get ingredienteId() { return this.#ingredienteId; }
    set ingredienteId(value) { this.#ingredienteId = value; }

    get padrao() { return this.#padrao; }
    set padrao(value) { this.#padrao = value; }

    constructor(produtoId, ingredienteId, padrao) {
        this.#produtoId = produtoId;
        this.#ingredienteId = ingredienteId;
        this.#padrao = padrao;
    }

    async listarPorProduto(produtoId) {
        try {
            const sql = `
                SELECT 
                    pi.ING_ID,
                    pi.PADRAO,
                    i.ING_NOME,
                    i.ING_CATEGORIA,
                    i.ING_PRECO_ADICIONAL
                FROM TB_PRODUTO_INGREDIENTES pi
                INNER JOIN TB_INGREDIENTES i ON pi.ING_ID = i.ING_ID
                WHERE pi.PROD_ID = ?
                ORDER BY i.ING_CATEGORIA, i.ING_NOME
            `;
            
            const banco = new Database();
            const rows = await banco.ExecutaComando(sql, [produtoId]);

            return rows.map(row => ({
                ingredienteId: row.ING_ID,
                padrao: row.PADRAO,
                nome: row.ING_NOME,
                categoria: row.ING_CATEGORIA,
                precoAdicional: row.ING_PRECO_ADICIONAL
            }));
        } catch (error) {
            console.error('❌ Erro no ProdutoIngredienteModel.listarPorProduto:', error);
            return [];
        }
    }

async adicionarIngrediente(produtoId, ingredienteId, padrao) {
    try {
        const banco = new Database();

        // ✅ Verifica se já existe essa combinação para evitar duplicidade
        const sqlCheck = "SELECT * FROM TB_PRODUTO_INGREDIENTES WHERE PROD_ID = ? AND ING_ID = ?";
        const existe = await banco.ExecutaComando(sqlCheck, [produtoId, ingredienteId]); // ✅ usa o produtoId recebido

        if (existe.length > 0) {
            console.log(`⚠️ Ingrediente ${ingredienteId} já existe no produto ${produtoId}, ignorando...`);
            return;
        }

        const sqlInsert = `
            INSERT INTO TB_PRODUTO_INGREDIENTES (PROD_ID, ING_ID, PADRAO)
            VALUES (?, ?, ?)
        `;
        await banco.ExecutaComandoNonQuery(sqlInsert, [produtoId, ingredienteId, padrao]);
        console.log(`✅ Ingrediente ${ingredienteId} adicionado ao produto ${produtoId}`);
    } catch (error) {
        console.error("❌ Erro no ProdutoIngredienteModel.adicionarIngrediente:", error);
    }
}

    async removerIngrediente(produtoId, ingredienteId) {
        try {
            const sql = "DELETE FROM TB_PRODUTO_INGREDIENTES WHERE PROD_ID = ? AND ING_ID = ?";
            const valores = [produtoId, ingredienteId];

            const banco = new Database();
            const result = await banco.ExecutaComandoNonQuery(sql, valores);

            return result;
        } catch (error) {
            console.error('❌ Erro no ProdutoIngredienteModel.removerIngrediente:', error);
            return false;
        }
    }

    async atualizarIngrediente(produtoId, ingredienteId, padrao) {
        try {
            const sql = "UPDATE TB_PRODUTO_INGREDIENTES SET PADRAO = ? WHERE PROD_ID = ? AND ING_ID = ?";
            const valores = [padrao, produtoId, ingredienteId];

            const banco = new Database();
            const result = await banco.ExecutaComandoNonQuery(sql, valores);

            return result;
        } catch (error) {
            console.error('❌ Erro no ProdutoIngredienteModel.atualizarIngrediente:', error);
            return false;
        }
    }

    async limparIngredientes(produtoId) {
        try {
            const sql = "DELETE FROM TB_PRODUTO_INGREDIENTES WHERE PROD_ID = ?";
            const valores = [produtoId];

            const banco = new Database();
            const result = await banco.ExecutaComandoNonQuery(sql, valores);

            return result;
        } catch (error) {
            console.error('❌ Erro no ProdutoIngredienteModel.limparIngredientes:', error);
            return false;
        }
    }
}

module.exports = ProdutoIngredienteModel;