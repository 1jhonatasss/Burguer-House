const PedidoModel = require("../models/Pedido");

class PedidoController {

    async listarView(req, res) {
        try {
            let pedido = new PedidoModel();
            let lista = await pedido.listar();
            res.render('pedido/listar', {pedidos: lista});
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.render('pedido/listar', {pedidos: []});
        }
    }

    async cadastrarView(req, res) {
        res.render("pedido/cadastrar");
    }

    async cadastrar(req, res) {
        console.log(req.body);
        
        let numero = req.body.numero;
        let itens = req.body.itens;
        let total = parseFloat(req.body.total);
        let status = req.body.status || 'pendente';
        let observacoes = req.body.observacoes;

        if(numero && itens && total) {           
            let pedido = new PedidoModel(
                0, 
                numero, 
                itens, 
                total, 
                status, 
                observacoes,
                null,
                null
            );
            
            let resultado = await pedido.cadastrar();
            if(resultado) {
                res.send({ok: true, msg: "Pedido cadastrado com sucesso!"});
            } else {
                res.send({ok: false, msg: "Erro ao inserir pedido no banco de dados"});
            }
        } else {
            res.send({ok: false, msg: "Faltam informações para cadastrar o pedido!"});
        }
    }

    async obterPorId(req, res) {
        try {
            let id = req.params.id;
            let pedido = new PedidoModel();
            let pedidoData = await pedido.obterPorId(id);
            
            if(pedidoData) {
                res.json({ok: true, pedido: pedidoData});
            } else {
                res.json({ok: false, msg: "Pedido não encontrado"});
            }
        } catch (error) {
            console.error('Erro ao obter pedido:', error);
            res.json({ok: false, msg: "Erro ao buscar pedido"});
        }
    }

    async obterPorNumero(req, res) {
        try {
            let numero = req.params.numero;
            let pedido = new PedidoModel();
            let pedidoData = await pedido.obterPorNumero(numero);
            
            if(pedidoData) {
                res.json({ok: true, pedido: pedidoData});
            } else {
                res.json({ok: false, msg: "Pedido não encontrado"});
            }
        } catch (error) {
            console.error('Erro ao obter pedido por número:', error);
            res.json({ok: false, msg: "Erro ao buscar pedido"});
        }
    }

    async atualizarStatus(req, res) {
        let ok;
        let msg;

        let id = req.body.id;
        let novoStatus = req.body.status;

        if(id && novoStatus) {
            let pedido = new PedidoModel();
            const result = await pedido.atualizarStatus(id, novoStatus);
            if(result) {
                ok = true;
                msg = "Status do pedido atualizado com sucesso!";
            } else {
                ok = false;
                msg = "Erro ao atualizar o status do pedido!";
            }
        } else {
            ok = false;
            msg = "ID e status são obrigatórios!";
        }

        res.send({ok: ok, msg: msg});
    }

    async excluir(req, res) {
        let ok;
        let msg;

        let id = req.body.id;
        if(id) {
            let pedido = new PedidoModel();
            const result = await pedido.excluir(id);
            if(result) {
                ok = true;
                msg = "Pedido excluído com sucesso!";
            } else {
                ok = false;
                msg = "Erro ao excluir o pedido do banco!";
            }
        } else {
            ok = false;
            msg = "ID não encontrado para exclusão!";
        }

        res.send({ok: ok, msg: msg});
    }

    async listarPorStatus(req, res) {
        try {
            let status = req.params.status;
            let pedido = new PedidoModel();
            let lista = await pedido.listarPorStatus(status);
            res.json({ok: true, pedidos: lista});
        } catch (error) {
            console.error('Erro ao listar pedidos por status:', error);
            res.json({ok: false, pedidos: []});
        }
    }

    // Métodos para integração com o frontend (API)
async finalizarPedido(req, res) {
  try {
    const { itens, total, observacoes, adicionais, removidos } = req.body;

    if (!itens || itens.length === 0) {
      return res.json({ ok: false, msg: "Carrinho vazio!" });
    }

    const numeroPedido = Date.now().toString().slice(-6);

    // ✅ Corrigida a ordem: dataCriacao, dataAtualizacao, adicionais, removidos
    const pedido = new PedidoModel(
      0,
      numeroPedido,
      itens,
      total,
      'pendente',
      observacoes,
      null,
      null,
      adicionais || [],
      removidos || []
    );

    const resultado = await pedido.cadastrar();

    if (resultado) {
      res.json({ ok: true, msg: "Pedido cadastrado com sucesso!" });
    } else {
      res.json({ ok: false, msg: "Erro ao salvar o pedido no banco." });
    }
  } catch (error) {
    console.error("💥 Erro ao finalizar pedido:", error);
    res.json({ ok: false, msg: "Erro interno ao finalizar pedido." });
  }
}


    async listarPedidosAPI(req, res) {
        try {
            let pedido = new PedidoModel();
            let lista = await pedido.listar();
            res.json({ok: true, pedidos: lista});
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.json({ok: false, pedidos: []});
        }
    }
}

module.exports = PedidoController;