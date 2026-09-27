// ============================================
// utils/CacheManager.js
// Sistema centralizado de cache com invalidação inteligente
// ============================================

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        
        // ✅ Durações de cache por tipo
        this.durations = {
            cardapio: 30 * 60 * 1000,      // 30 minutos
            produtos: 30 * 60 * 1000,      // 30 minutos
            ingredientes: 60 * 60 * 1000,  // 1 hora
            banners: 10 * 60 * 1000        // 10 minutos
        };

        console.log('✅ CacheManager inicializado');
    }

    // ============================================
    // OBTER VALOR DO CACHE
    // ============================================
    get(key, duration = null) {
        const cached = this.cache.get(key);
        const timestamp = this.timestamps.get(key);

        if (!cached || !timestamp) {
            return null;
        }

        // ✅ Usar duração customizada ou padrão
        const maxAge = duration || this.durations[key] || 30 * 60 * 1000;
        const age = Date.now() - timestamp;

        if (age > maxAge) {
            // Cache expirado
            this.invalidate(key);
            return null;
        }

        console.log(`⚡ Cache HIT: ${key} (idade: ${Math.round(age / 1000)}s)`);
        return cached;
    }

    // ============================================
    // SALVAR NO CACHE
    // ============================================
    set(key, value) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
        console.log(`💾 Cache SET: ${key}`);
        return value;
    }

    // ============================================
    // INVALIDAR CACHE ESPECÍFICO
    // ============================================
    invalidate(key) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            console.log(`🔄 Cache INVALIDADO: ${key}`);
            return true;
        }
        return false;
    }

    // ============================================
    // INVALIDAR MÚLTIPLOS CACHES
    // ============================================
    invalidateMultiple(keys) {
        keys.forEach(key => this.invalidate(key));
        console.log(`🔄 Cache INVALIDADO (múltiplo): ${keys.join(', ')}`);
    }

    // ============================================
    // INVALIDAR TUDO
    // ============================================
    invalidateAll() {
        const count = this.cache.size;
        this.cache.clear();
        this.timestamps.clear();
        console.log(`🔄 Cache LIMPO (${count} itens removidos)`);
    }

    // ============================================
    // INVALIDAR CARDÁPIO (quando produto muda)
    // ============================================
    invalidarCardapio() {
        this.invalidateMultiple(['cardapio', 'produtos']);
        console.log('🍔 Cache do cardápio invalidado');
    }

    // ============================================
    // INVALIDAR INGREDIENTES
    // ============================================
    invalidarIngredientes() {
        this.invalidate('ingredientes');
        console.log('🧩 Cache de ingredientes invalidado');
    }

    // ============================================
    // INVALIDAR BANNERS
    // ============================================
    invalidarBanners() {
        this.invalidate('banners');
        console.log('🎨 Cache de banners invalidado');
    }

    // ============================================
    // ESTATÍSTICAS
    // ============================================
    stats() {
        const stats = {
            total: this.cache.size,
            items: []
        };

        this.cache.forEach((value, key) => {
            const timestamp = this.timestamps.get(key);
            const age = timestamp ? Math.round((Date.now() - timestamp) / 1000) : 0;
            
            stats.items.push({
                key,
                age: `${age}s`,
                size: JSON.stringify(value).length
            });
        });

        return stats;
    }
}

// ✅ Singleton - única instância compartilhada
module.exports = new CacheManager();