const mysql = require('mysql2');

class Database {
    static #instance = null;
    static #pool = null;

    constructor() {
        // ✅ SINGLETON: Retorna a mesma instância sempre
        if (Database.#instance) {
            return Database.#instance;
        }

        // ✅ Cria o pool apenas UMA VEZ
        if (!Database.#pool) {
            Database.#pool = mysql.createPool({
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectionLimit: 50,
                waitForConnections: true,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0,
                maxIdle: 10, // máximo de conexões ociosas
                idleTimeout: 60000 // timeout de 60 segundos
            });

            console.log('✅ Pool de conexões MySQL criado (uma única vez)');
            
            // ✅ Monitoramento opcional (remova se não quiser logs)
            this.#setupMonitoring();
        }

        Database.#instance = this;
    }

    // ✅ Método para monitorar o pool (opcional)
    #setupMonitoring() {
        setInterval(() => {
            const pool = Database.#pool;
            if (pool && pool._allConnections) {
                console.log('📊 Pool Status:', {
                    total: pool._allConnections.length,
                    livre: pool._freeConnections.length,
                    emUso: pool._allConnections.length - pool._freeConnections.length
                });
            }
        }, 30000); // A cada 30 segundos
    }

    get conexao() {
        return Database.#pool;
    }

    ExecutaComando(sql, valores) {
        const pool = Database.#pool;
        return new Promise(function(res, rej) {
            pool.query(sql, valores, function (error, results, fields) {
                if (error) {
                    console.error('❌ Erro SQL:', error.message);
                    rej(error);
                } else {
                    res(results);
                }
            });
        });
    }
    
    ExecutaComandoNonQuery(sql, valores) {
        const pool = Database.#pool;
        return new Promise(function(res, rej) {
            pool.query(sql, valores, function (error, results, fields) {
                if (error) {
                    console.error('❌ Erro SQL NonQuery:', error.message);
                    rej(error);
                } else {
                    res(results.affectedRows > 0);
                }
            });
        });
    }

    ExecutaComandoLastInserted(sql, valores) {
        const pool = Database.#pool;
        return new Promise(function(res, rej) {
            pool.query(sql, valores, function (error, results, fields) {
                if (error) {
                    console.error('❌ Erro SQL LastInserted:', error.message);
                    rej(error);
                } else {
                    res(results.insertId);
                }
            });
        });
    }

    // ✅ Método para fechar o pool (usar quando o servidor desligar)
    static async close() {
        if (Database.#pool) {
            return new Promise((resolve, reject) => {
                Database.#pool.end((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar pool:', err);
                        reject(err);
                    } else {
                        console.log('✅ Pool de conexões fechado');
                        Database.#pool = null;
                        Database.#instance = null;
                        resolve();
                    }
                });
            });
        }
    }

    // ✅ Método para verificar saúde da conexão
    async testConnection() {
        try {
            await this.ExecutaComando('SELECT 1');
            console.log('✅ Conexão com banco OK');
            return true;
        } catch (error) {
            console.error('❌ Falha na conexão:', error.message);
            return false;
        }
    }
}

module.exports = Database;