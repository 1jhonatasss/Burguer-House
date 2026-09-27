const Database = require("../utils/database");

class IngredienteModel {
  #ingId;
  #ingNome;
  #ingCategoria;
  #ingPrecoAdicional;
  #ingDisponivel;

  get ingId() { return this.#ingId; }
  set ingId(v) { this.#ingId = v; }

  get ingNome() { return this.#ingNome; }
  set ingNome(v) { this.#ingNome = v; }

  get ingCategoria() { return this.#ingCategoria; }
  set ingCategoria(v) { this.#ingCategoria = v; }

  get ingPrecoAdicional() { return this.#ingPrecoAdicional; }
  set ingPrecoAdicional(v) { this.#ingPrecoAdicional = v; }

  get ingDisponivel() { return this.#ingDisponivel; }
  set ingDisponivel(v) { this.#ingDisponivel = v; }

  constructor(id, nome, categoria, precoAdicional, disponivel) {
    this.#ingId = id;
    this.#ingNome = nome;
    this.#ingCategoria = categoria;
    this.#ingPrecoAdicional = precoAdicional;
    this.#ingDisponivel = disponivel;
  }

  // ✅ Listar todos os ingredientes disponíveis
  async listarTodos() {
    try {
      const db = new Database();
      const sql = `
        SELECT ING_ID, ING_NOME, ING_CATEGORIA, ING_PRECO_ADICIONAL, ING_DISPONIVEL
        FROM TB_INGREDIENTES
        WHERE ING_DISPONIVEL = 1
        ORDER BY ING_NOME;
      `;
      const rows = await db.ExecutaComando(sql);
      return rows.map(r => ({
        ingId: r.ING_ID,
        ingNome: r.ING_NOME,
        ingCategoria: r.ING_CATEGORIA,
        ingPrecoAdicional: r.ING_PRECO_ADICIONAL,
        ingDisponivel: r.ING_DISPONIVEL
      }));
    } catch (err) {
      console.error("❌ Erro ao listar todos os ingredientes:", err);
      return [];
    }
  }

  // ✅ Listar ingredientes de um produto (JOIN otimizado)
  async listarPorProduto(produtoId) {
    try {
      const db = new Database();
      const sql = `
        SELECT 
          i.ING_ID, i.ING_NOME, i.ING_CATEGORIA, 
          i.ING_PRECO_ADICIONAL, i.ING_DISPONIVEL
        FROM TB_PRODUTO_INGREDIENTES pi
        INNER JOIN TB_INGREDIENTES i ON i.ING_ID = pi.ING_ID
        WHERE pi.PROD_ID = ? AND i.ING_DISPONIVEL = 1
        ORDER BY i.ING_CATEGORIA, i.ING_NOME;
      `;
      const rows = await db.ExecutaComando(sql, [produtoId]);

      return rows.map(r => ({
        ingId: r.ING_ID,
        ingNome: r.ING_NOME,
        ingCategoria: r.ING_CATEGORIA,
        ingPrecoAdicional: r.ING_PRECO_ADICIONAL,
        ingDisponivel: r.ING_DISPONIVEL
      }));
    } catch (err) {
      console.error("❌ Erro ao listar ingredientes do produto:", err);
      return [];
    }
  }

  // ✅ Buscar ingrediente específico (por ID)
  async obterPorId(id) {
    try {
      const db = new Database();
      const sql = `
        SELECT ING_ID, ING_NOME, ING_CATEGORIA, ING_PRECO_ADICIONAL, ING_DISPONIVEL
        FROM TB_INGREDIENTES
        WHERE ING_ID = ?;
      `;
      const rows = await db.ExecutaComando(sql, [id]);

      if (rows.length === 0) return null;

      const r = rows[0];
      const ing = new IngredienteModel();
      ing.ingId = r.ING_ID;
      ing.ingNome = r.ING_NOME;
      ing.ingCategoria = r.ING_CATEGORIA;
      ing.ingPrecoAdicional = r.ING_PRECO_ADICIONAL;
      ing.ingDisponivel = r.ING_DISPONIVEL;
      return ing;
    } catch (err) {
      console.error("❌ Erro ao obter ingrediente:", err);
      return null;
    }
  }

  // ✅ Cadastrar ingrediente
  async cadastrar() {
    try {
      const db = new Database();
      const sql = `
        INSERT INTO TB_INGREDIENTES
        (ING_NOME, ING_CATEGORIA, ING_PRECO_ADICIONAL, ING_DISPONIVEL)
        VALUES (?, ?, ?, ?);
      `;
      const valores = [
        this.#ingNome,
        this.#ingCategoria,
        this.#ingPrecoAdicional,
        this.#ingDisponivel
      ];
      const insertId = await db.ExecutaComandoLastInserted(sql, valores);
      console.log("🧩 Novo ingrediente cadastrado com ID:", insertId);
      return { insertId };
    } catch (err) {
      console.error("❌ Erro ao cadastrar ingrediente:", err);
      return false;
    }
  }

  // ✅ Atualizar ingrediente
  async atualizar() {
    try {
      const db = new Database();
      const sql = `
        UPDATE TB_INGREDIENTES
        SET ING_NOME = ?, ING_CATEGORIA = ?, ING_PRECO_ADICIONAL = ?, ING_DISPONIVEL = ?
        WHERE ING_ID = ?;
      `;
      const valores = [
        this.#ingNome,
        this.#ingCategoria,
        this.#ingPrecoAdicional,
        this.#ingDisponivel,
        this.#ingId
      ];
      const result = await db.ExecutaComandoNonQuery(sql, valores);
      console.log(`🧩 Ingrediente ${this.#ingId} atualizado.`);
      return result;
    } catch (err) {
      console.error("❌ Erro ao atualizar ingrediente:", err);
      return false;
    }
  }

  // ✅ Excluir ingrediente (com limpeza de vínculo)
  async excluir(id) {
    try {
      const db = new Database();
      await db.ExecutaComandoNonQuery(
        "DELETE FROM TB_PRODUTO_INGREDIENTES WHERE ING_ID = ?",
        [id]
      );
      const result = await db.ExecutaComandoNonQuery(
        "DELETE FROM TB_INGREDIENTES WHERE ING_ID = ?",
        [id]
      );
      console.log(`🗑️ Ingrediente ${id} removido com sucesso.`);
      return result;
    } catch (err) {
      console.error("❌ Erro ao excluir ingrediente:", err);
      return false;
    }
  }
}

module.exports = IngredienteModel;
