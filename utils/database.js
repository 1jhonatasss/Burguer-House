// utils/database.js
class Database {
    static #instance = null;

    constructor() {
        if (Database.#instance) {
            return Database.#instance;
        }
        console.log('⚠️  Database MOCK ativo — usando dados de demonstração');
        Database.#instance = this;
    }

    get conexao() {
        return null;
    }

    ExecutaComando(sql, valores) {
        return Promise.reject(new Error('MOCK: banco indisponível'));
    }

    ExecutaComandoNonQuery(sql, valores) {
        return Promise.reject(new Error('MOCK: banco indisponível'));
    }

    ExecutaComandoLastInserted(sql, valores) {
        return Promise.reject(new Error('MOCK: banco indisponível'));
    }

    static async close() {
        console.log('✅ [MOCK] Nada para fechar');
    }

    async testConnection() {
        console.log('❌ [MOCK] Sem conexão real');
        return false;
    }
}

module.exports = Database;