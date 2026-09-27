// ============================================
// models/Banner.js
// Model para manipulação de banners no banco
// ============================================

const Database = require('../utils/database');

class Banner {
    constructor() {
        this.db = new Database();
    }

    // ============================================
    // LISTAR TODOS OS BANNERS
    // ============================================
    async listar() {
        try {
            const sql = `
                SELECT 
                    bannerId,
                    titulo,
                    imagemUrl,
                    precoOriginal,
                    precoPromocional,
                    ativo,
                    dataCriacao
                FROM TB_BANNER
                ORDER BY dataCriacao DESC
            `;
            
            const resultado = await this.db.ExecutaComando(sql);
            return resultado || [];
            
        } catch (error) {
            console.error('❌ ERRO AO LISTAR BANNERS:', error);
            return [];
        }
    }

    // ============================================
    // LISTAR APENAS BANNERS ATIVOS
    // ============================================
    async listarAtivos() {
        try {
            const sql = `
                SELECT 
                    bannerId,
                    titulo,
                    imagemUrl,
                    precoOriginal,
                    precoPromocional,
                    dataCriacao
                FROM TB_BANNER
                WHERE ativo = 1
                ORDER BY dataCriacao DESC
            `;
            
            const resultado = await this.db.ExecutaComando(sql);
            return resultado || [];
            
        } catch (error) {
            console.error('❌ ERRO AO LISTAR BANNERS ATIVOS:', error);
            return [];
        }
    }

    // ============================================
    // OBTER UM BANNER POR ID
    // ============================================
    async obter(id) {
        try {
            const sql = `
                SELECT 
                    bannerId,
                    titulo,
                    imagemUrl,
                    precoOriginal,
                    precoPromocional,
                    ativo,
                    dataCriacao
                FROM TB_BANNER
                WHERE bannerId = ?
            `;
            
            const resultado = await this.db.ExecutaComando(sql, [id]);
            return resultado && resultado.length > 0 ? resultado[0] : null;
            
        } catch (error) {
            console.error('❌ ERRO AO OBTER BANNER:', error);
            return null;
        }
    }

    // ============================================
    // GRAVAR NOVO BANNER
    // ============================================
    async gravar(dados) {
        try {
            const sql = `
                INSERT INTO TB_BANNER (
                    titulo,
                    imagemUrl,
                    precoOriginal,
                    precoPromocional,
                    ativo,
                    dataCriacao
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            const params = [
                dados.titulo,
                dados.imagemUrl,
                dados.precoOriginal,
                dados.precoPromocional,
                dados.ativo || 1
            ];
            
            const resultado = await this.db.ExecutaComando(sql, params);
            
            // Retornar o ID inserido
            return resultado && resultado.insertId ? resultado.insertId : null;
            
        } catch (error) {
            console.error('❌ ERRO AO GRAVAR BANNER:', error);
            return null;
        }
    }

    // ============================================
    // ATUALIZAR BANNER
    // ============================================
    async atualizar(dados) {
        try {
            const sql = `
                UPDATE TB_BANNER SET
                    titulo = ?,
                    imagemUrl = ?,
                    precoOriginal = ?,
                    precoPromocional = ?
                WHERE bannerId = ?
            `;
            
            const params = [
                dados.titulo,
                dados.imagemUrl,
                dados.precoOriginal,
                dados.precoPromocional,
                dados.bannerId
            ];
            
            const resultado = await this.db.ExecutaComando(sql, params);
            return resultado && resultado.affectedRows > 0;
            
        } catch (error) {
            console.error('❌ ERRO AO ATUALIZAR BANNER:', error);
            return false;
        }
    }

    // ============================================
    // EXCLUIR BANNER
    // ============================================
    async excluir(id) {
        try {
            const sql = "DELETE FROM TB_BANNER WHERE bannerId = ?";
            const resultado = await this.db.ExecutaComando(sql, [id]);
            
            return resultado && resultado.affectedRows > 0;
            
        } catch (error) {
            console.error('❌ ERRO AO EXCLUIR BANNER:', error);
            return false;
        }
    }

    // ============================================
    // ATUALIZAR STATUS DO BANNER
    // ============================================
    async atualizarStatus(id, ativo) {
        try {
            const sql = `
                UPDATE TB_BANNER 
                SET ativo = ?
                WHERE bannerId = ?
            `;
            
            const resultado = await this.db.ExecutaComando(sql, [ativo, id]);
            return resultado && resultado.affectedRows > 0;
            
        } catch (error) {
            console.error('❌ ERRO AO ATUALIZAR STATUS:', error);
            return false;
        }
    }

    // ============================================
    // CONTAR BANNERS ATIVOS
    // ============================================
    async contarAtivos() {
        try {
            const sql = "SELECT COUNT(*) as total FROM TB_BANNER WHERE ativo = 1";
            const resultado = await this.db.ExecutaComando(sql);
            
            return resultado && resultado[0] ? resultado[0].total : 0;
            
        } catch (error) {
            console.error('❌ ERRO AO CONTAR BANNERS:', error);
            return 0;
        }
    }
}

module.exports = Banner;