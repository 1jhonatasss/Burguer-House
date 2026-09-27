const Database = require("../utils/database");

class PedidoModel {
    constructor(
      id,
      numero,
      itens,
      total,
      status,
      observacoes,
      dataCriacao,
      dataAtualizacao,
      adicionais = null,
      removidos = null
    ) {
      this.pedidoId = id;
      this.pedidoNumero = numero;
      this.pedidoItens = itens;
      this.pedidoTotal = total;
      this.pedidoStatus = status;
      this.pedidoObservacoes = observacoes;
      this.pedidoDataCriacao = dataCriacao;
      this.pedidoDataAtualizacao = dataAtualizacao;
      this.pedidoAdicionais = adicionais;
      this.pedidoRemovidos = removidos;
    }

    // ✅ CORRIGIDO: Mantém o JSON original sem converter
    async listar() {
      try {
        console.log('📋 PEDIDOMODEL.LISTAR - Executando SQL...');

        const sql = `
          SELECT 
            PED_ID as pedidoId, 
            PED_NUMERO as pedidoNumero, 
            PED_ITENS as pedidoItens, 
            PED_TOTAL as pedidoTotal, 
            PED_STATUS as pedidoStatus, 
            PED_OBSERVACOES as pedidoObservacoes, 
            PED_ADICIONAIS as pedidoAdicionais, 
            PED_REMOVIDOS as pedidoRemovidos, 
            PED_DATA_CRIACAO as pedidoDataCriacao, 
            PED_DATA_ATUALIZACAO as pedidoDataAtualizacao
          FROM TB_PEDIDO 
          ORDER BY PED_DATA_CRIACAO DESC
        `;

        const banco = new Database();
        const rows = await banco.ExecutaComando(sql);

        console.log('📋 PEDIDOMODEL.LISTAR - Linhas retornadas:', rows.length);

        if (!rows || rows.length === 0) {
          console.log('📋 PEDIDOMODEL.LISTAR - Nenhum pedido encontrado');
          return [];
        }

        // ✅ RETORNA OS DADOS BRUTOS DO BANCO (sem processar)
        return rows.map(pedido => ({
          pedidoId: pedido.pedidoId,
          pedidoNumero: pedido.pedidoNumero,
          pedidoItens: pedido.pedidoItens, // ✅ JSON original preservado
          pedidoTotal: pedido.pedidoTotal,
          pedidoStatus: pedido.pedidoStatus,
          pedidoObservacoes: pedido.pedidoObservacoes,
          pedidoAdicionais: pedido.pedidoAdicionais, // ✅ String original preservada
          pedidoRemovidos: pedido.pedidoRemovidos,   // ✅ String original preservada
          pedidoDataCriacao: pedido.pedidoDataCriacao,
          pedidoDataAtualizacao: pedido.pedidoDataAtualizacao
        }));

      } catch (error) {
        console.error('❌ Erro no PedidoModel.listar:', error);
        return [];
      }
    }

    async obterPorId(id) {
        try {
            const sql = `SELECT 
                PED_ID, 
                PED_NUMERO, 
                PED_ITENS,
                PED_TOTAL, 
                PED_STATUS, 
                PED_OBSERVACOES, 
                PED_ADICIONAIS,
                PED_REMOVIDOS,
                PED_DATA_CRIACAO, 
                PED_DATA_ATUALIZACAO
            FROM TB_PEDIDO WHERE PED_ID = ?`;
            
            const valores = [id];
            const banco = new Database();
            const rows = await banco.ExecutaComando(sql, valores);

            if (rows.length > 0) {
                const pedido = rows[0];
                
                return {
                    pedidoId: pedido.PED_ID,
                    pedidoNumero: pedido.PED_NUMERO,
                    pedidoItens: pedido.PED_ITENS, // ✅ Mantém original
                    pedidoTotal: pedido.PED_TOTAL,
                    pedidoStatus: pedido.PED_STATUS,
                    pedidoObservacoes: pedido.PED_OBSERVACOES,
                    pedidoAdicionais: pedido.PED_ADICIONAIS,
                    pedidoRemovidos: pedido.PED_REMOVIDOS,
                    pedidoDataCriacao: pedido.PED_DATA_CRIACAO,
                    pedidoDataAtualizacao: pedido.PED_DATA_ATUALIZACAO
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Erro no PedidoModel.obterPorId:', error);
            return null;
        }
    }

    async obterPorNumero(numero) {
        try {
            const sql = `SELECT 
                PED_ID, 
                PED_NUMERO, 
                PED_TOTAL, 
                PED_STATUS, 
                PED_OBSERVACOES, 
                PED_DATA_CRIACAO, 
                PED_DATA_ATUALIZACAO,
                PED_ITENS,
                PED_ADICIONAIS,
                PED_REMOVIDOS
            FROM TB_PEDIDO WHERE PED_NUMERO = ?`;
            
            const valores = [numero];
            const banco = new Database();
            const rows = await banco.ExecutaComando(sql, valores);

            if (rows.length > 0) {
                return {
                    pedidoId: rows[0].PED_ID,
                    pedidoNumero: rows[0].PED_NUMERO,
                    pedidoItens: rows[0].PED_ITENS,
                    pedidoTotal: rows[0].PED_TOTAL,
                    pedidoStatus: rows[0].PED_STATUS,
                    pedidoObservacoes: rows[0].PED_OBSERVACOES,
                    pedidoAdicionais: rows[0].PED_ADICIONAIS,
                    pedidoRemovidos: rows[0].PED_REMOVIDOS,
                    pedidoDataCriacao: rows[0].PED_DATA_CRIACAO,
                    pedidoDataAtualizacao: rows[0].PED_DATA_ATUALIZACAO
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Erro no PedidoModel.obterPorNumero:', error);
            return null;
        }
    }

    async cadastrar() {
      try {
        const db = new Database();
        const sql = `
          INSERT INTO TB_PEDIDO
          (PED_NUMERO, PED_ITENS, PED_TOTAL, PED_STATUS, PED_OBSERVACOES, PED_ADICIONAIS, PED_REMOVIDOS, PED_DATA_CRIACAO)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        // ✅ Se for string JSON, mantém; se for array, converte para JSON
        let itensFormatados = '';
        if (typeof this.pedidoItens === 'string') {
          itensFormatados = this.pedidoItens;
        } else if (Array.isArray(this.pedidoItens)) {
          itensFormatados = JSON.stringify(this.pedidoItens);
        } else {
          itensFormatados = String(this.pedidoItens || '');
        }

        // ✅ Adicionais e Removidos como string (não JSON)
        const adicionaisTexto = this.pedidoAdicionais || null;
        const removidosTexto = this.pedidoRemovidos || null;

        const valores = [
          this.pedidoNumero,
          itensFormatados,
          this.pedidoTotal,
          this.pedidoStatus,
          this.pedidoObservacoes,
          adicionaisTexto,
          removidosTexto
        ];

        const resultado = await db.ExecutaComando(sql, valores);
        return resultado;

      } catch (error) {
        console.error("❌ Erro ao cadastrar pedido:", error);
        return null;
      }
    }

    async atualizarStatus(id, novoStatus) {
        try {
            console.log('✏️ PEDIDOMODEL.ATUALIZARSTATUS - ID:', id, 'Status:', novoStatus);
            
            const sql = "UPDATE TB_PEDIDO SET PED_STATUS = ?, PED_DATA_ATUALIZACAO = NOW() WHERE PED_ID = ?";
            const valores = [novoStatus, id];

            const banco = new Database();
            const result = await banco.ExecutaComandoNonQuery(sql, valores);
            
            console.log('✏️ PEDIDOMODEL.ATUALIZARSTATUS - Resultado:', result);
            
            return result;
        } catch (error) {
            console.error('❌ ERRO NO PEDIDOMODEL.ATUALIZARSTATUS:', error);
            return false;
        }
    }

    async excluir(id) {
        try {
            console.log('🗑️ PEDIDOMODEL.EXCLUIR - ID:', id);
            
            const sql = "DELETE FROM TB_PEDIDO WHERE PED_ID = ?";
            const valores = [id];

            const banco = new Database();
            const result = await banco.ExecutaComandoNonQuery(sql, valores);
            
            console.log('🗑️ PEDIDOMODEL.EXCLUIR - Resultado:', result);
            
            return result;
        } catch (error) {
            console.error('❌ ERRO NO PEDIDOMODEL.EXCLUIR:', error);
            return false;
        }
    }

    async listarPorStatus(status) {
        try {
            const sql = `SELECT 
                PED_ID, 
                PED_NUMERO, 
                PED_TOTAL, 
                PED_STATUS, 
                PED_OBSERVACOES, 
                PED_DATA_CRIACAO, 
                PED_DATA_ATUALIZACAO,
                PED_ITENS,
                PED_ADICIONAIS,
                PED_REMOVIDOS
            FROM TB_PEDIDO WHERE PED_STATUS = ?`;
            
            const valores = [status];
            const banco = new Database();
            const rows = await banco.ExecutaComando(sql, valores);

            return rows.map(row => ({
                pedidoId: row.PED_ID,
                pedidoNumero: row.PED_NUMERO,
                pedidoItens: row.PED_ITENS,
                pedidoTotal: row.PED_TOTAL,
                pedidoStatus: row.PED_STATUS,
                pedidoObservacoes: row.PED_OBSERVACOES,
                pedidoAdicionais: row.PED_ADICIONAIS,
                pedidoRemovidos: row.PED_REMOVIDOS,
                pedidoDataCriacao: row.PED_DATA_CRIACAO,
                pedidoDataAtualizacao: row.PED_DATA_ATUALIZACAO
            }));
        } catch (error) {
            console.error('❌ Erro no PedidoModel.listarPorStatus:', error);
            return [];
        }
    }
}

module.exports = PedidoModel;