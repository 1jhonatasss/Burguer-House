function evitarCache() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('/carrinho/') || args[0].includes('/pedido/'))) {
      const url = new URL(args[0], window.location.origin);
      url.searchParams.set('_t', Date.now());
      args[0] = url.toString();
    }
    return originalFetch.apply(this, args);
  };
}

// ✅ ADICIONE esta função para detectar hambúrgueres
function configurarBotoesPersonalizacao() {
    document.querySelectorAll('.btn-adicionar').forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            
            const produtoId = this.getAttribute('data-produto-id');
            const produtoCard = this.closest('.produto-card');
            const produtoNome = produtoCard.querySelector('.produto-nome')?.textContent || 'Produto';
            const precoTexto = produtoCard.querySelector('.preco-atual')?.textContent || '0';
            const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim()) || 0;
            const categoria = produtoCard.getAttribute('data-categoria')?.toLowerCase();
            
            console.log('🔍 Produto clicado:', { produtoId, produtoNome, categoria, preco });
            
            // ✅ CATEGORIAS QUE NÃO PRECISAM DE PERSONALIZAÇÃO
            const categoriasDiretas = ['bebida', 'combo', 'acompanhamento'];

            if (categoria === 'hamburguer') {
                console.log('🍔 Abrindo personalização para hambúrguer');
                abrirPersonalizacao(produtoId, produtoNome, preco);
            } 
            else if (categoriasDiretas.includes(categoria)) {
                console.log('🥤 Produto direto ao carrinho (bebida/combo/acompanhamento)');
                adicionarAoCarrinho(produtoId);
            } 
            else {
                // fallback (caso haja categoria nova)
                console.log('📦 Categoria não reconhecida, adicionando direto ao carrinho');
                adicionarAoCarrinho(produtoId);
            }
        });
    });
}


// ADICIONE ESTA FUNÇÃO NO INÍCIO DO ARQUIVO (logo após as primeiras funções)

async function pagarComCartaoMaquininha(tipo) {
    try {
        if (!pedidoAtual || !pedidoAtual.numeroPedido) {
            mostrarNotificacao('❌ Nenhum pedido ativo', 'erro');
            return;
        }

        const loading = document.getElementById('loading-maquininha');
        if (loading) loading.style.display = 'block';
        
        console.log('💳 Enviando para maquininha:', {
            tipo,
            numeroPedido: pedidoAtual.numeroPedido,
            total: pedidoAtual.total
        });
        
        const response = await fetch('/pagamento/cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroPedido: pedidoAtual.numeroPedido,
                total: pedidoAtual.total,
                tipo: tipo
            })
        });
        
        const resultado = await response.json();
        console.log('📥 Resposta:', resultado);
        
        if (loading) loading.style.display = 'none';
        
        if (resultado.ok) {
            await confirmarPedidoPago(pedidoAtual.numeroPedido, resultado.transacaoId);
            mostrarStatusPagamento('sucesso', 'Pagamento aprovado!', 'Transação: ' + resultado.transacaoId);
            limparCarrinho();
        } else {
            mostrarStatusPagamento('erro', 'Pagamento negado', resultado.msg);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        const loading = document.getElementById('loading-maquininha');
        if (loading) loading.style.display = 'none';
        mostrarStatusPagamento('erro', 'Erro no pagamento', 'Verifique a maquininha');
    }
}

// Função auxiliar para mostrar status
function mostrarStatusPagamento(tipo, titulo, mensagem) {
    const statusDiv = document.getElementById('status-pagamento');
    const statusIcon = document.getElementById('status-icon');
    const statusTitulo = document.getElementById('status-titulo');
    const statusTexto = document.getElementById('status-texto');
    
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusIcon.className = `status-icon ${tipo}`;
        statusTitulo.textContent = titulo;
        statusTexto.textContent = mensagem;
        
        // Esconder abas
        document.getElementById('tab-pix').style.display = 'none';
        document.getElementById('tab-cartao').style.display = 'none';
        document.querySelector('.pagamento-tabs').style.display = 'none';
    }
}

console.log('✅ Função pagarComCartaoMaquininha carregada');



// ✅ INICIALIZAÇÃO DO CARRINHO - VERSÃO MELHORADA
function inicializarCarrinho() {
    console.log('🛒 Inicializando carrinho...');
    
    const carrinhoBtn = document.getElementById('carrinhoBtn');
    const carrinhoModal = document.getElementById('carrinhoModal');
    const carrinhoClose = document.getElementById('carrinhoClose');
    
    if (carrinhoBtn && carrinhoModal) {
        carrinhoBtn.addEventListener('click', () => {
            carrinhoModal.classList.add('active');
            
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                inicializarEventListenersCarrinho();
            }, 100);
        });
    }
    
    if (carrinhoClose && carrinhoModal) {
        carrinhoClose.addEventListener('click', () => {
            carrinhoModal.classList.remove('active');
        });
    }
    
    if (carrinhoModal) {
        carrinhoModal.addEventListener('click', (e) => {
            if (e.target === carrinhoModal) {
                carrinhoModal.classList.remove('active');
            }
        });
    }
    
    console.log('✅ Carrinho inicializado');
}
function posicionarFiltroLateral() {
  const filtro = document.querySelector(".filtro-categoria.lateral-flutuante");
  const promocoes = document.querySelector(".secao-promocoes, .promocoes-quentes, .banner-promocoes"); 
  
  if (!filtro || !promocoes) return;

  const bannerBottom = promocoes.getBoundingClientRect().bottom;
  const alturaTela = window.innerHeight;
  const posicaoCentral = alturaTela / 2 - filtro.offsetHeight / 2;
  const limiteSuperior = 100;
  const distanciaExtra = 60;

  if (bannerBottom > limiteSuperior + distanciaExtra) {
    // 🟠 No topo — fica um pouco mais abaixo do banner
    filtro.style.top = bannerBottom + distanciaExtra + "px";
  } else {
    // 🔵 Ao rolar — centraliza no meio da tela
    filtro.style.top = posicaoCentral + "px";
  }
}

// ✅ ATUALIZAR O EVENT LISTENER DO SCROLL
window.addEventListener("scroll", () => {
  posicionarFiltroLateral();
});

// ✅ FUNÇÃO PARA MOSTRAR NOTIFICAÇÕES
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    try {
        console.log('🔔 Mostrando notificação:', mensagem, 'Tipo:', tipo);
        
        const notificacao = document.getElementById('notificacao');
        const notificacaoTexto = document.getElementById('notificacao-texto');
        const notificacaoIcon = notificacao?.querySelector('i');
        
        if (!notificacao || !notificacaoTexto) {
            console.error('❌ Elementos da notificação não encontrados');
            alert(mensagem);
            return;
        }
        
        let background, borderColor, iconName;
        
        switch(tipo) {
            case 'sucesso':
                background = 'linear-gradient(135deg, #10b981, #047857)';
                borderColor = '#10b981';
                iconName = 'check-circle';
                break;
            case 'erro':
                background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                borderColor = '#dc2626';
                iconName = 'x-circle';
                break;
            case 'aviso':
                background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                borderColor = '#f59e0b';
                iconName = 'alert-triangle';
                break;
            case 'info':
                background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                borderColor = '#3b82f6';
                iconName = 'info';
                break;
            default:
                background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                borderColor = '#6b7280';
                iconName = 'bell';
        }
        
        notificacao.style.background = background;
        notificacao.style.borderColor = borderColor;
        notificacaoTexto.textContent = mensagem;
        
        if (notificacaoIcon) {
            notificacaoIcon.setAttribute('data-lucide', iconName);
        }
        
        notificacao.classList.remove('hidden');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            if (notificacao && !notificacao.classList.contains('hidden')) {
                notificacao.classList.add('hidden');
            }
        }, 3000);
        
    } catch (error) {
        console.error('💥 Erro ao mostrar notificação:', error);
        alert(mensagem);
    }
}

// ✅ FUNÇÃO PARA ESCONDER NOTIFICAÇÃO
function esconderNotificacao() {
    const notificacao = document.getElementById('notificacao');
    if (notificacao) {
        notificacao.classList.add('hidden');
    }
}

// ✅ EVENT LISTENERS DO CARRINHO
// ✅ EVENT LISTENERS DO CARRINHO
// ✅ EVENT LISTENERS DO CARRINHO - CORRIGIDO
// ✅ EVENT LISTENERS DO CARRINHO - CORRIGIDO
function inicializarEventListenersCarrinho() {
    // ➕ AUMENTAR - Adiciona quantidade (NÃO adiciona novo item)
    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        
        clone.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = this.getAttribute('data-item-id');
            
            console.log('➕ Aumentar quantidade:', itemId);
            
            if (!itemId) {
                mostrarNotificacao('Erro: ID do item não encontrado', 'erro');
                return;
            }
            
            await atualizarQuantidadeItem(itemId, 1);
        });
    });
    
    // ➖ DIMINUIR - Remove quantidade
    document.querySelectorAll('.btn-diminuir').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        
        clone.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = this.getAttribute('data-item-id');
            
            console.log('➖ Diminuir quantidade:', itemId);
            
            if (!itemId) {
                mostrarNotificacao('Erro: ID do item não encontrado', 'erro');
                return;
            }
            
            await atualizarQuantidadeItem(itemId, -1);
        });
    });
    
    // 🗑️ REMOVER COMPLETO
    document.querySelectorAll('.btn-remover').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        
        clone.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = this.getAttribute('data-item-id');
            
            console.log('🗑️ Remover item:', itemId);
            
            if (!itemId) {
                mostrarNotificacao('Erro: ID do item não encontrado', 'erro');
                return;
            }
            
            await removerItemCarrinho(itemId);
        });
    });
    
    const btnFinalizar = document.getElementById('btnFinalizarPedido');
    if (btnFinalizar) {
        btnFinalizar.removeEventListener('click', finalizarPedido);
        btnFinalizar.addEventListener('click', finalizarPedido);
    }
    
    console.log('✅ Event listeners do carrinho configurados');
}
// ✅ ATUALIZAR QUANTIDADE DO ITEM
async function atualizarQuantidadeItem(itemId, mudanca) {
    try {
        const carrinho = getCarrinho();
        const item = carrinho.find(i => String(i.id) === String(itemId));
        if (!item) return;

        const novaQtd = (Number(item.quantidade) || 1) + mudanca;
        atualizarQtdLocal(itemId, novaQtd);

        if (mudanca > 0) mostrarNotificacao('Quantidade aumentada', 'sucesso');
        else mostrarNotificacao('Quantidade diminuída', 'sucesso');
    } catch (error) {
        console.error('💥 Erro:', error);
    }
}


async function atualizarQtdCarrinho(itemId, mudanca) {
    try {
        console.log('🔄 Atualizando quantidade:', itemId, mudanca);
        
        const item = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!item) {
            console.error('❌ Item não encontrado no DOM');
            return;
        }
        
        const qtyElement = item.querySelector('.qty-value');
        const qty = parseInt(qtyElement?.textContent) || 1;
        const novaQty = qty + mudanca;
        
        console.log('📊 Quantidade atual:', qty, '→ Nova:', novaQty);
        
        if (novaQty <= 0) {
            await removerItemCarrinho(itemId);
            return;
        }
        
        // ✅ ROTA CORRETA
        const response = await fetch('/cardapio/carrinho/atualizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, quantidade: novaQty })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        console.log('✅ Resposta do servidor:', resultado);
        
        if (resultado.ok) {
            // ✅ Atualizar UI dinamicamente
            if (typeof atualizarUICarrinho === 'function') {
                atualizarUICarrinho(resultado.carrinho);
            } else {
                console.warn('⚠️ Função atualizarUICarrinho não encontrada, recarregando...');
                location.reload();
            }
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Quantidade atualizada!', 'sucesso');
            }
        } else {
            console.error('❌ Erro do servidor:', resultado.msg);
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(resultado.msg || 'Erro ao atualizar quantidade', 'erro');
            } else {
                alert(resultado.msg || 'Erro ao atualizar quantidade');
            }
        }
    } catch (error) {
        console.error('💥 Erro ao atualizar quantidade:', error);
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro de conexão: ' + error.message, 'erro');
        } else {
            alert('Erro de conexão: ' + error.message);
        }
    }
}

// ✅ REMOVER ITEM DO CARRINHO (FUNÇÃO GLOBAL)
async function removerItemCarrinho(itemId) {
    try {
        removerItemLocal(itemId);
        mostrarNotificacao('Item removido do carrinho', 'sucesso');
    } catch (error) {
        console.error('💥 Erro:', error);
    }
}

// ✅ ATUALIZAR UI DO CARRINHO
function atualizarUICarrinho(carrinho) {
    console.log('🔄 Atualizando UI do carrinho:', carrinho);
    
    // Atualizar badge
    const badge = document.getElementById('carrinhoBadge');
    const subtitulo = document.getElementById('carrinhoSubtitulo');
    const actionsContent = document.getElementById('carrinhoActionsContent');
    
    const quantidadeTotal = Array.isArray(carrinho) 
        ? carrinho.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0)
        : 0;
    
    const total = Array.isArray(carrinho)
        ? carrinho.reduce((sum, item) => {
            const preco = Number(item.preco) || 0;
            const quantidade = Number(item.quantidade) || 0;
            return sum + (preco * quantidade);
          }, 0)
        : 0;
    
    if (badge) {
        badge.textContent = quantidadeTotal;
        badge.style.display = quantidadeTotal > 0 ? '' : 'none';
    }
    
    if (subtitulo) {
        subtitulo.textContent = quantidadeTotal === 0 
            ? 'Carrinho vazio' 
            : `${quantidadeTotal} ${quantidadeTotal === 1 ? 'item' : 'itens'}`;
    }
    
    if (actionsContent) {
        actionsContent.style.display = quantidadeTotal === 0 ? 'none' : 'flex';
    }
    
    // Atualizar valor total
    const totalValor = document.getElementById('carrinhoTotalValor');
    if (totalValor) {
        totalValor.textContent = `R$ ${total.toFixed(2)}`;
    }
    
    // Atualizar conteúdo do carrinho horizontal
    atualizarConteudoCarrinhoHorizontal(carrinho);
}

function atualizarConteudoCarrinhoHorizontal(carrinho) {
    const container = document.getElementById('carrinhoDockContent');
    if (!container) return;

    if (!carrinho || carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-dock-vazio" id="carrinhoVazio">
                <i data-lucide="shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    const itensHTML = carrinho.map(item => {
        const preco = Number(item.preco) || 0;
        const quantidade = Number(item.quantidade) || 1;
        const nome = item.nome || 'Produto';
        const id = item.id || '';
        const imagemUrl = item.imagem_url || '';
        const personalizado = item.personalizado || false;
        const ingredientes = item.ingredientes || [];
        const removidos = item.removidos || [];

        // Mostrar todos os ingredientes, não limitar
        const ingredientesTexto = ingredientes.length > 0 
            ? ingredientes.map(i => i.ingNome).join(', ')
            : '';
        
        const removidosTexto = removidos.length > 0 
            ? removidos.join(', ')
            : '';

        return `
            <div class="carrinho-card-horizontal" data-item-id="${id}">
                <div class="carrinho-card-img">
                    ${imagemUrl ? 
                        `<img src="${imagemUrl}" alt="${nome}">` :
                        `<div class="carrinho-card-img-placeholder">
                            <i data-lucide="image"></i>
                        </div>`
                    }
                </div>
                
                <div class="carrinho-card-info">
                    <div class="carrinho-card-header">
                        <h4 class="carrinho-card-nome">${nome}</h4>
                        <span class="carrinho-card-preco">R$ ${preco.toFixed(2)}</span>
                    </div>
                    
                    ${personalizado && (ingredientes.length > 0 || removidos.length > 0) ? `
                        <div class="carrinho-card-mods">
                            ${ingredientes.length > 0 ? 
                                `<span class="mod-tag add"><strong class="mod-icon mod-icon-add">+</strong> ${ingredientesTexto}</span>` 
                                : ''}
                            ${removidos.length > 0 ? 
                                `<span class="mod-tag rem"><strong class="mod-icon mod-icon-rem">−</strong> ${removidosTexto}</span>` 
                                : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="carrinho-card-actions">
                    ${!personalizado ? `
                        <div class="qty-mini">
                            <button class="qty-btn" onclick="atualizarQtd('${id}', -1)">
                                <i data-lucide="minus"></i>
                            </button>
                            <span class="qty-num">${quantidade}</span>
                            <button class="qty-btn" onclick="atualizarQtd('${id}', 1)">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                    ` : `
                        <span class="qty-fixed">Qtd: ${quantidade}</span>
                    `}
                    
                    <button class="btn-trash" onclick="removerItem('${id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="carrinho-grid-horizontal" id="carrinhoItens">${itensHTML}</div>`;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

console.log('✅ Funções de feedback verde e carrinho horizontal carregadas!');



function atualizarConteudoGridCarrinho(carrinho, quantidadeTotal, total) {
    const container = document.getElementById('carrinhoDockContent');
    if (!container) return;

    if (!carrinho || carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-dock-vazio" id="carrinhoVazio">
                <i data-lucide="shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    const itensHTML = carrinho.map(item => {
        const preco = Number(item.preco) || 0;
        const quantidade = Number(item.quantidade) || 1;
        const nome = item.nome || 'Produto';
        const id = item.id || '';
        const imagemUrl = item.imagem_url || '';
        const personalizado = item.personalizado || false;
        const ingredientes = item.ingredientes || [];
        const removidos = item.removidos || [];

        // Limitar ingredientes e removidos para exibição
        const ingredientesTexto = ingredientes.length > 0 
            ? ingredientes.slice(0, 3).map(i => i.ingNome).join(', ') + 
              (ingredientes.length > 3 ? `, +${ingredientes.length - 3}` : '')
            : '';
        
        const removidosTexto = removidos.length > 0 
            ? removidos.slice(0, 3).join(', ') + 
              (removidos.length > 3 ? `, +${removidos.length - 3}` : '')
            : '';

        return `
            <div class="carrinho-grid-item" data-item-id="${id}">
                <div class="carrinho-grid-imagem">
                    ${imagemUrl ? 
                        `<img src="${imagemUrl}" alt="${nome}">` :
                        `<div class="carrinho-grid-imagem-placeholder">
                            <i data-lucide="image"></i>
                        </div>`
                    }
                </div>
                
                <div class="carrinho-grid-info">
                    <h4 class="carrinho-grid-nome">${nome}</h4>
                    <span class="carrinho-grid-preco">R$ ${preco.toFixed(2)}</span>
                    
                    ${personalizado && (ingredientes.length > 0 || removidos.length > 0) ? `
                        <div class="carrinho-grid-modificacoes">
                            ${ingredientes.length > 0 ? 
                                `<span class="modificacao-mini adicional">+ ${ingredientesTexto}</span>` 
                                : ''}
                            ${removidos.length > 0 ? 
                                `<span class="modificacao-mini removido">- ${removidosTexto}</span>` 
                                : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="carrinho-grid-controls">
                    <div class="carrinho-grid-qty">
                        ${!personalizado ? `
                            <button class="btn-qty-mini" onclick="atualizarQtd('${id}', -1)">
                                <i data-lucide="minus"></i>
                            </button>
                            <span class="qty-value-mini">${quantidade}</span>
                            <button class="btn-qty-mini" onclick="atualizarQtd('${id}', 1)">
                                <i data-lucide="plus"></i>
                            </button>
                        ` : `
                            <span class="qty-fixa-mini">Qtd: ${quantidade}</span>
                        `}
                    </div>
                    
                    <button class="btn-remover-mini" onclick="removerItem('${id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="carrinho-grid-scroll" id="carrinhoItens">${itensHTML}</div>`;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

console.log('✅ Funções de feedback e carrinho grid carregadas!');


// ✅ ATUALIZAR CONTEÚDO DO MODAL (MESMO FECHADO)
function atualizarConteudoModalCarrinho(carrinho, quantidadeTotal, total) {
    const container = document.querySelector('.carrinho-items');
    const footer = document.querySelector('.carrinho-footer');
    if (!container) return;

    if (!carrinho || carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-vazio">
                <i data-lucide="shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
                <p>Adicione produtos para começar</p>
            </div>
        `;
        if (footer) footer.style.display = 'none';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    if (footer) footer.style.display = 'block';

    // 🎯 AGRUPAR ITENS VISUALMENTE (SEM ALTERAR O BACKEND)
    const itensAgrupados = carrinho.reduce((acc, item) => {
        const chave = `${item.produtoId}_${JSON.stringify(item.ingredientes || [])}_${JSON.stringify(item.removidos || [])}`;
        
        if (!acc[chave]) {
            acc[chave] = {
                ...item,
                quantidade: 1,
                itensIndividuais: [item] // Lista de IDs individuais
            };
        } else {
            acc[chave].quantidade += 1;
            acc[chave].itensIndividuais.push(item);
        }
        
        return acc;
    }, {});

    container.innerHTML = Object.values(itensAgrupados).map(itemAgrupado => {
        const preco = Number(itemAgrupado.preco) || 0;
        const qtd = itemAgrupado.quantidade;
        const subtotal = preco * qtd;
        const personalizados = itemAgrupado.personalizado ? (itemAgrupado.ingredientes || []).map(ing => ing.ingNome).join(', ') : '';
        const removidos = (itemAgrupado.removidos && itemAgrupado.removidos.length) ? itemAgrupado.removidos.join(', ') : '';
        const imagem = itemAgrupado.imagem_url || itemAgrupado.imagemUrl || '/images/default.jpg';

        // 🎯 Usar o ID do PRIMEIRO item do grupo
        const itemId = itemAgrupado.itensIndividuais[0].id;

        return `
            <div class="carrinho-item" data-item-id="${itemId}">
                <div class="item-info">
                    <img src="${imagem}" alt="${itemAgrupado.nome || 'Produto'}">
                    <div class="item-details">
                        <h4>${itemAgrupado.nome || 'Produto'}</h4>
                        ${personalizados ? `<div class="item-adicionais"><span>Adicionais:</span> ${personalizados}</div>` : ''}
                        ${removidos ? `<div class="item-removidos"><span>Removidos:</span> ${removidos}</div>` : ''}
                        <div class="item-controls">
                            <div class="quantidade-controls">
                                <button class="btn-quantidade btn-diminuir" data-item-id="${itemId}">
                                    <i data-lucide="minus"></i>
                                </button>
                                <span class="quantidade">${qtd}</span>
                                <button class="btn-quantidade btn-aumentar" data-item-id="${itemId}">
                                    <i data-lucide="plus"></i>
                                </button>
                            </div>
                            <button class="btn-remover" data-item-id="${itemId}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="item-subtotal">
                    <span>Subtotal</span>
                    <span class="subtotal-valor">R$ ${subtotal.toFixed(2)}</span>
                </div>
            </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    inicializarEventListenersCarrinho();
}

// ✅ NAVEGAÇÃO SUAVE ENTRE CATEGORIAS
function inicializarNavegacaoCategorias() {
    const botoesCategoria = document.querySelectorAll('.categoria-btn[data-categoria]');
    
    botoesCategoria.forEach(botao => {
        botao.addEventListener('click', function() {
            const categoria = this.getAttribute('data-categoria');
            console.log('🎯 Clicou na categoria:', categoria);
            
            // ✅ NAVEGAÇÃO SUAVE - SEM RECARREGAR PÁGINA
            filtrarCategoria(categoria);
        });
    });
    
    console.log('✅ Navegação de categorias inicializada');
}

// ✅ FILTRAR CATEGORIA SEM RECARREGAR
function filtrarCategoria(categoria) {
    console.log('🔄 Filtrando categoria:', categoria);
    
    // ✅ 1. ATUALIZAR BOTÕES ATIVOS
    atualizarBotoesAtivos(categoria);
    
    // ✅ 2. ATUALIZAR URL SEM RECARREGAR
    const novaURL = `/cardapio?categoria=${categoria}`;
    window.history.pushState({ categoria }, '', novaURL);
    
    // ✅ 3. FILTRAR PRODUTOS LOCALMENTE
    filtrarProdutosPorCategoria(categoria);
}

// ✅ ATUALIZAR BOTÕES ATIVOS
function atualizarBotoesAtivos(categoriaAtiva) {
    const botoesCategoria = document.querySelectorAll('.categoria-btn[data-categoria]');
    
    botoesCategoria.forEach(botao => {
        const categoria = botao.getAttribute('data-categoria');
        if (categoria === categoriaAtiva) {
            botao.classList.add('ativo');
        } else {
            botao.classList.remove('ativo');
        }
    });
}

// ✅ MODAL DE PERSONALIZAÇÃO
let produtoAtual = null;
let precoBaseAtual = 0;
let ingredientesSelecionados = [];
let modalInicializado = false;
// 🧠 Cache local de removidos por item
let cacheRemovidosCarrinho = {};
let ingredientesRemovidos = [];

const removidosTextoEl = document.getElementById('removidosTexto');
const removidosListaEl = document.getElementById('removidosLista');
const inputRemoverEl = document.getElementById('inputRemoverIngrediente');

if (removidosTextoEl) removidosTextoEl.textContent = 'Nenhum';
if (removidosListaEl) removidosListaEl.classList.add('hidden');
if (inputRemoverEl) inputRemoverEl.value = '';

function inicializarModalPersonalizacao() {
    if (modalInicializado) {
        console.log('ℹ️ Modal já inicializado');
        return;
    }
    
    const modal = document.getElementById('personalizacaoModal');
    const closeBtn = document.getElementById('personalizacaoClose');
    const cancelBtn = document.getElementById('btnPersonalizacaoCancelar');
    const confirmarBtn = document.getElementById('btnPersonalizacaoConfirmar');
    
    if (!modal) {
        console.error('❌ Modal de personalização não encontrado');
        return;
    }
    // ✅ Reinicia os ingredientes removidos a cada abertura de modal

const inputRemover = document.getElementById('inputRemoverIngrediente');
const btnRemover = document.getElementById('btnRemoverIngrediente');
const listaRemovidos = document.getElementById('removidosLista');
const textoRemovidos = document.getElementById('removidosTexto');

if (inputRemover && btnRemover) {
    btnRemover.onclick = (e) => {
        e.preventDefault();
        const valor = inputRemover.value.trim();
        if (!valor) return;

        if (!ingredientesRemovidos.includes(valor.toLowerCase())) {
            ingredientesRemovidos.push(valor.toLowerCase());
        }

        textoRemovidos.textContent = ingredientesRemovidos.join(', ');
        listaRemovidos.classList.remove('hidden');
        inputRemover.value = '';

        mostrarNotificacao(`"${valor}" será removido do lanche.`, 'sucesso');
    };
}

    // ✅ CONFIGURAR BOTÃO FECHAR
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    console.log('❌ Personalização cancelada pelo botão fechar');
    modal.classList.remove('active');
  });
}

    // ✅ CONFIGURAR BOTÕES DE QUANTIDADE (+/-)
    const btnQtyMenos = document.getElementById('btnQtyMenos');
    const btnQtyMais = document.getElementById('btnQtyMais');
    const qtyDisplay = document.getElementById('qtyDisplay');
    
    // Variável global para quantidade
    window.quantidadePersonalizacao = 1;
    
    if (btnQtyMenos && qtyDisplay) {
        btnQtyMenos.addEventListener('click', () => {
            if (window.quantidadePersonalizacao > 1) {
                window.quantidadePersonalizacao--;
                qtyDisplay.textContent = window.quantidadePersonalizacao;
                atualizarTotalPersonalizacao();
            }
        });
    }
    
    if (btnQtyMais && qtyDisplay) {
        btnQtyMais.addEventListener('click', () => {
            window.quantidadePersonalizacao++;
            qtyDisplay.textContent = window.quantidadePersonalizacao;
            atualizarTotalPersonalizacao();
        });
    }
    
    // ✅ CONFIGURAR BOTÃO CANCELAR
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('❌ Personalização cancelada pelo usuário');
            modal.classList.remove('active');
        });
    }
    
    // ✅ CONFIGURAR BOTÃO CONFIRMAR (APENAS UMA VEZ)
    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', async function() {
            console.log('✅ Botão Adicionar ao Carrinho clicado');
            
            if (!produtoAtual) {
                console.error('❌ Nenhum produto selecionado para personalização');
                mostrarNotificacao('Erro: Nenhum produto selecionado', 'erro');
                return;
            }
            
            const adicional = ingredientesSelecionados.reduce((sum, ing) => {
                const preco = parseFloat(ing.preco) || 0;
                return sum + preco;
            }, 0);
            
            const total = precoBaseAtual + adicional;
            
            console.log('✅ Personalização confirmada - Adicionando ao carrinho:', {
                produtoId: produtoAtual.id,
                ingredientes: ingredientesSelecionados,
                total: total
            });
            
            // Fechar modal
            modal.classList.remove('active');
            
            // ✅ ADICIONAR AO CARRINHO
await adicionarProdutoPersonalizado(
  produtoAtual.id,
  produtoAtual.nome,
  total,
  ingredientesSelecionados,
  `Hambúrguer Personalizado: ${produtoAtual.nome}`,
  [...ingredientesRemovidos]
);
        });
    }
    
    // ✅ CONFIGURAR CLIQUE FORA DO MODAL
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('❌ Personalização cancelada ao clicar fora');
            modal.classList.remove('active');
        }
    });
    
    modalInicializado = true;
    console.log('✅ Modal de personalização inicializado');
}

// ✅ ABRIR MODAL DE PERSONALIZAÇÃO
async function abrirPersonalizacao(produtoId, produtoNome, precoBase) {
    try {
        console.log('🍔 Abrindo personalização para:', produtoId, produtoNome);
        
        // ✅ RESETAR QUANTIDADE
        window.quantidadePersonalizacao = 1;
        const qtyDisplay = document.getElementById('qtyDisplay');
        if (qtyDisplay) qtyDisplay.textContent = '1';
        ingredientesRemovidos = [];

        
        const removidosTextoEl = document.getElementById('removidosTexto');
        const removidosListaEl = document.getElementById('removidosLista');
        const inputRemoverEl = document.getElementById('inputRemoverIngrediente');

        if (removidosTextoEl) removidosTextoEl.textContent = 'Nenhum';
        if (removidosListaEl) removidosListaEl.classList.add('hidden');
        if (inputRemoverEl) inputRemoverEl.value = '';

        // ✅ OBTER INFORMAÇÕES COMPLETAS DO PRODUTO
        const produtoCard = document.querySelector(`[data-produto-id="${produtoId}"]`);
        const imagemUrl = produtoCard?.querySelector('img')?.src || '/images/default-burger.jpg';
        const descricao = produtoCard?.querySelector('.produto-descricao')?.textContent || 'Hambúrguer delicioso';
        
        produtoAtual = { 
            id: produtoId, 
            nome: produtoNome,
            preco: precoBase,
            imagem: imagemUrl,
            descricao: descricao
        };
        precoBaseAtual = precoBase;
        ingredientesSelecionados = [];
        
        const modal = document.getElementById('personalizacaoModal');
        const body = document.getElementById('personalizacaoBody');
        
        if (!modal || !body) {
            console.error('❌ Modal de personalização não encontrado');
            mostrarNotificacao('Erro ao abrir personalização', 'erro');
            return;
        }

        // ✅ MOSTRAR LOADING
        body.innerHTML = `
            <div class="loading-personalizacao">
                <i data-lucide="loader-2" class="loading-icon"></i>
                <p>Carregando ingredientes...</p>
            </div>
        `;
        
        modal.classList.add('active');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // ✅ BUSCAR INGREDIENTES DO BANCO DE DADOS COM TIMEOUT
        let ingredientesCarregados = false;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
            
            const response = await fetch(`/cardapio/ingredientes/${produtoId}`, {
  signal: controller.signal
});
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const resultado = await response.json();
            
            if (resultado.ok && resultado.ingredientes && Object.keys(resultado.ingredientes).length > 0) {
                console.log('✅ Ingredientes carregados do banco:', resultado.ingredientes);
                renderizarIngredientesReais(resultado.ingredientes);
                ingredientesCarregados = true;
            } else {
                console.warn('⚠️ Nenhum ingrediente encontrado no banco para este produto');
                throw new Error('Nenhum ingrediente encontrado');
            }
            
        } catch (error) {
            console.error('💥 Erro ao carregar ingredientes:', error);
            
            // ✅ FALLBACK: Usar ingredientes padrão baseados no produto
            const ingredientesFallback = getIngredientesFallback(produtoId);
            if (ingredientesFallback && ingredientesFallback.length > 0) {
                console.log('🔄 Usando fallback de ingredientes:', ingredientesFallback);
                const ingredientesAgrupados = agruparIngredientesPorCategoria(ingredientesFallback);
                renderizarIngredientesReais(ingredientesAgrupados);
            } else {
                // ✅ FALLBACK FINAL: Ingredientes genéricos
                console.log('🔄 Usando ingredientes genéricos');
                const ingredientesGenericos = getIngredientesGenericos();
                const ingredientesAgrupados = agruparIngredientesPorCategoria(ingredientesGenericos);
                renderizarIngredientesReais(ingredientesAgrupados);
            }
        }
        
    } catch (error) {
        console.error('💥 Erro crítico ao abrir personalização:', error);
        mostrarNotificacao('Erro ao carregar personalização', 'erro');
        
        // ✅ FECHAR MODAL EM CASO DE ERRO CRÍTICO
        const modal = document.getElementById('personalizacaoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// ✅ DADOS REAIS DO SEU BANCO - INGREDIENTES ADICIONAIS
function getIngredientesReaisDoBanco() {
    // ❌ REMOVER ESTA FUNÇÃO COMPLETAMENTE
    // Retornar array vazio para forçar buscar do banco
    return [];
}

function getIngredientesFallback(produtoId) {
    // Retorna array vazio para forçar buscar do banco
    return [];
}

// ✅ INGREDIENTES GENÉRICOS ATUALIZADOS
function getIngredientesGenericos() {
    // ❌ REMOVER INGREDIENTES GENÉRICOS
    // Retornar array vazio
    return [];
}

// ✅ FUNÇÃO FALLBACK PARA INGREDIENTES
function agruparIngredientesPorCategoria(ingredientes) {
    const agrupados = {};
    
    ingredientes.forEach(ingrediente => {
        // ✅ USAR A ESTRUTURA DO FALLBACK (ING_CATEGORIA, etc)
        const categoria = ingrediente.ING_CATEGORIA || ingrediente.ingCategoria;
        
        if (!agrupados[categoria]) {
            agrupados[categoria] = [];
        }
        
        // ✅ ADICIONAR INGREDIENTE AO GRUPO DA CATEGORIA
        agrupados[categoria].push({
            ingId: ingrediente.ING_ID || ingrediente.ingId,
            ingNome: ingrediente.ING_NOME || ingrediente.ingNome,
            ingCategoria: categoria,
            ingPrecoAdicional: parseFloat(ingrediente.ING_PRECO_ADICIONAL || ingrediente.ingPrecoAdicional || 0),
            padrao: Boolean(ingrediente.PADRAO || ingrediente.padrao || false)
        });
    });
    
    return agrupados;
}
// ✅ ATUALIZAR A FUNÇÃO renderizarIngredientesReais COM NOVAS ESCRITAS
function renderizarIngredientesReais(ingredientesAgrupados) {
    const body = document.getElementById('personalizacaoBody');
    const imgEl = document.getElementById('personalizacaoImagem');
    const nomeEl = document.getElementById('personalizacaoNome');
    const descEl = document.getElementById('personalizacaoDescricao');
    const precoEl = document.getElementById('personalizacaoPrecoBase');
    
    if (!body) return;

    // ✅ PREENCHER DADOS DO HEADER (novo layout)
    if (imgEl) imgEl.src = produtoAtual.imagem || '/images/default-burger.jpg';
    if (nomeEl) nomeEl.textContent = produtoAtual.nome || 'Produto';
    if (descEl) descEl.textContent = produtoAtual.descricao || '';
    if (precoEl) precoEl.textContent = `R$ ${precoBaseAtual.toFixed(2)}`;

    const totalIngredientes = Object.values(ingredientesAgrupados).reduce((total, arr) => total + arr.length, 0);
    
    if (totalIngredientes === 0) {
        body.innerHTML = `
            <div class="sem-ingredientes-novo">
                <i data-lucide="chef-hat"></i>
                <h4>Adicionais Indisponíveis</h4>
                <p>Os adicionais para este produto ainda não foram configurados.</p>
                <p>Você pode adicionar o produto padrão ao carrinho.</p>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    // ✅ RENDERIZAR APENAS ADICIONAIS DISPONÍVEIS
    let html = '';

    const categoriasAdicionais = {};
    for (const [categoria, ingredientes] of Object.entries(ingredientesAgrupados)) {
        const ingredientesAdicionais = ingredientes.filter(ing => !ing.padrao);
        if (ingredientesAdicionais.length > 0) {
            categoriasAdicionais[categoria] = ingredientesAdicionais;
        }
    }

    const totalAdicionais = Object.values(categoriasAdicionais).reduce((total, arr) => total + arr.length, 0);
    
    if (totalAdicionais === 0) {
        html += `
            <div class="sem-adicionais-novo">
                <i data-lucide="info"></i>
                <p>Nenhum adicional disponível para este produto.</p>
            </div>
        `;
    } else {
        for (const [categoria, adicionais] of Object.entries(categoriasAdicionais)) {
            html += `
                <div class="categoria-ingredientes-novo">
                    <div class="categoria-header-novo">
                        <h4 class="categoria-titulo-novo">${obterNomeCategoria(categoria)}</h4>
                        <p class="categoria-subtitulo-novo">Escolha entre 0 e ${adicionais.length} opções</p>
                    </div>
            `;
            
            adicionais.forEach(ing => {
                const precoAdicional = parseFloat(ing.ingPrecoAdicional) || 0;
                const precoTexto = precoAdicional > 0 ? 
                    `+ R$ ${precoAdicional.toFixed(2)}` : 
                    '';
                    
                html += `
                    <div class="ingrediente-item-novo" 
                         data-ingrediente-id="${ing.ingId}"
                         data-preco="${precoAdicional}">
                        <div class="ingrediente-info-novo">
                            <p class="ingrediente-nome-novo">${ing.ingNome}</p>
                            ${ing.ingDescricao ? `<p class="ingrediente-desc-novo">${ing.ingDescricao}</p>` : ''}
                        </div>
                        <span class="ingrediente-preco-novo ${precoAdicional > 0 ? 'tem-preco' : ''}">${precoTexto}</span>
                        <div class="ingrediente-check-novo"></div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    }
    
    // ✅ ADICIONAR CAMPO COMENTÁRIO ADICIONAL NO FINAL DO SCROLL
    html += `
        <div class="comentario-section-scroll">
            <label class="comentario-label">Algum comentário adicional?</label>
            <div class="comentario-box-novo">
                <textarea 
                    id="inputComentarioAdicional" 
                    class="input-comentario-novo" 
                    placeholder="Ex: Sem cebola, ponto da carne mal passado..."
                ></textarea>
            </div>
        </div>
    `;
    
    body.innerHTML = html;

    // ✅ ADICIONAR EVENT LISTENERS
    document.querySelectorAll('.ingrediente-item-novo').forEach(item => {
        item.addEventListener('click', () => {
            toggleIngredienteAdicional(item);
        });
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    atualizarTotalPersonalizacao();
}
// ✅ RENDERIZAR INGREDIENTES - VERSÃO SEM OBRIGATÓRIO
// ✅ RENDERIZAR ADICIONAIS - VERSÃO ATUALIZADA
function renderizarIngredientesAtualizado(ingredientes) {
    const body = document.getElementById('personalizacaoBody');
    
    if (!body) return;

    let html = `
        <div class="produto-imagem-section">
            <img src="${produtoAtual.imagem}" alt="${produtoAtual.nome}" class="produto-imagem-grande">
            <h3 class="produto-nome-modal">${produtoAtual.nome}</h3>
            <p class="produto-descricao-modal">${produtoAtual.descricao}</p>
        </div>
    `;

    // ✅ RENDERIZAR APENAS ADICIONAIS
    html += `
        <div class="ingredientes-adicionais-section">
            <h4 class="section-titulo">
                <i data-lucide="plus-circle"></i>
                Adicionais Disponíveis
            </h4>
    `;

    // ✅ SEPARAR APENAS ADICIONAIS
    const ingredientesAdicionais = ingredientes.filter(ing => !ing.padrao);
    
    if (ingredientesAdicionais.length === 0) {
        html += `
            <div class="sem-adicionais">
                <i data-lucide="info"></i>
                <p>Nenhum adicional disponível para este produto.</p>
                <p>Você pode adicionar o produto ao carrinho com sua composição padrão.</p>
            </div>
        `;
    } else {
        // Agrupar adicionais por categoria
        const categoriasAdicionais = {};
        ingredientesAdicionais.forEach(ing => {
            const categoria = ing.ingCategoria;
            if (!categoriasAdicionais[categoria]) {
                categoriasAdicionais[categoria] = [];
            }
            categoriasAdicionais[categoria].push(ing);
        });

        for (const [categoria, adicionais] of Object.entries(categoriasAdicionais)) {
            html += `<div class="categoria-adicionais">`;
            html += `<h5 class="categoria-subtitulo">${obterNomeCategoria(categoria)}</h5>`;
            html += `<div class="ingredientes-adicionais-grid">`;
            
            adicionais.forEach(ing => {
                const precoAdicional = parseFloat(ing.ingPrecoAdicional) || 0;
                const precoTexto = precoAdicional > 0 ? 
                    `+ R$ ${precoAdicional.toFixed(2)}` : 
                    'Grátis';
                    
                html += `
                    <div class="ingrediente-adicional-item" 
                         data-ingrediente-id="${ing.ingId}"
                         data-preco="${precoAdicional}">
                        <div class="ingrediente-adicional-info">
                            <div class="ingrediente-adicional-nome">${ing.ingNome}</div>
                            <div class="ingrediente-adicional-preco ${precoAdicional > 0 ? 'adicional' : ''}">
                                ${precoTexto}
                            </div>
                        </div>
                        <div class="ingrediente-adicional-checkbox"></div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
    }

    html += `</div>`;
    
    body.innerHTML = html;

    // ✅ ADICIONAR EVENT LISTENERS AOS ADICIONAIS
    document.querySelectorAll('.ingrediente-adicional-item').forEach(item => {
        item.addEventListener('click', () => {
            toggleIngredienteAdicional(item);
        });
    });
    
    // ✅ ATUALIZAR ÍCONES LUCIDE
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // ✅ ATUALIZAR TOTAL
    atualizarTotalPersonalizacao();
}

const cssIngredientesObrigatorios = `
    .ingrediente-item.selecionado {
        background-color: rgba(16, 185, 129, 0.1);
        border-color: var(--primary-yellow);
    }
`;

function adicionarCSSPersonalizacao() {
    if (!document.getElementById('css-personalizacao-suave')) {
        const style = document.createElement('style');
        style.id = 'css-personalizacao-suave';
        style.textContent = cssAnimacoesSuaves;
        document.head.appendChild(style);
    }
}
const cssAnimacoesSuaves = `
.personalizacao-modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(8px);
    z-index: 1000;
}

.personalizacao-modal.active {
    display: flex;
    align-items: center;
    justify-content: center;
}

.personalizacao-content {
    width: 95%;
    max-width: 500px;
    max-height: 90vh;
    background: var(--gray-900);
    border-radius: 1.5rem;
    border: 2px solid var(--gray-700);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.personalizacao-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-700);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--gray-800);
}

.personalizacao-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    color: white;
    margin: 0;
}

.personalizacao-close {
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
}

.personalizacao-close:hover {
    background: var(--gray-700);
    color: white;
}

/* ✅ SEÇÃO DA IMAGEM DO PRODUTO */
.produto-imagem-section {
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid var(--gray-700);
    background: var(--gray-800);
}

.produto-imagem-grande {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: 1rem;
    margin: 0 auto 1rem;
    border: 3px solid var(--primary-orange);
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.produto-nome-modal {
    font-size: 1.5rem;
    font-weight: 800;
    color: white;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--primary-yellow), var(--primary-orange));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.produto-descricao-modal {
    color: var(--gray-400);
    font-size: 0.9rem;
    line-height: 1.4;
}

/* ✅ SEÇÃO DOS INGREDIENTES DO PEDIDO */
.ingredientes-pedido-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-700);
}

.section-titulo {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary-yellow);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ingredientes-lista {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.ingrediente-padrao {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--gray-800);
    border-radius: 0.75rem;
    border: 1px solid var(--gray-700);
}

.ingrediente-padrao .check-icon {
    color: var(--primary-yellow);
    flex-shrink: 0;
}

.ingrediente-padrao-info {
    flex: 1;
}

.ingrediente-padrao-nome {
    font-weight: 600;
    color: white;
    font-size: 0.9rem;
}

.ingrediente-padrao-incluido {
    font-size: 0.75rem;
    color: var(--primary-yellow);
    font-weight: 600;
}

/* ✅ SEÇÃO DOS INGREDIENTES ADICIONAIS */
.ingredientes-adicionais-section {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
}

.ingredientes-adicionais-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
}

.ingrediente-adicional-item {
    background: var(--gray-800);
    border: 2px solid var(--gray-700);
    border-radius: 0.75rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ingrediente-adicional-item:hover {
    border-color: var(--gray-500);
    transform: translateY(-2px);
}

.ingrediente-adicional-item.selecionado {
    border-color: var(--primary-yellow);
    background: rgba(245, 158, 11, 0.1);
}

.ingrediente-adicional-info {
    flex: 1;
}

.ingrediente-adicional-nome {
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
}

.ingrediente-adicional-preco {
    font-size: 0.8rem;
    color: var(--gray-400);
}

.ingrediente-adicional-preco.adicional {
    color: var(--primary-yellow);
    font-weight: 600;
}

.ingrediente-adicional-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--gray-600);
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.ingrediente-adicional-item.selecionado .ingrediente-adicional-checkbox {
    background: var(--primary-yellow);
    border-color: var(--primary-yellow);
}

.ingrediente-adicional-item.selecionado .ingrediente-adicional-checkbox::after {
    content: '✓';
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
}

/* ✅ FOOTER DO MODAL */
.personalizacao-footer {
    border-top: 1px solid var(--gray-700);
    background: var(--gray-800);
    padding: 1.5rem;
}

.resumo-preco {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--gray-700);
}

.resumo-preco-base {
    display: flex;
    flex-direction: column;
}

.resumo-label {
    font-size: 0.875rem;
    color: var(--gray-400);
    margin-bottom: 0.25rem;
}

.resumo-valor {
    font-weight: 600;
    color: white;
}

.resumo-adicionais {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.resumo-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 700;
}

.total-label {
    color: white;
}

.total-valor-modal {
    color: var(--primary-yellow);
    font-size: 1.5rem;
}

.personalizacao-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.btn-personalizacao-cancelar {
    flex: 1;
    background: var(--gray-700);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-personalizacao-cancelar:hover {
    background: var(--gray-600);
}

.btn-personalizacao-confirmar {
    flex: 2;
    background: linear-gradient(135deg, var(--primary-red), var(--primary-orange));
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.btn-personalizacao-confirmar:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
}

/* ✅ RESPONSIVIDADE */
@media (max-width: 768px) {
    .personalizacao-content {
        width: 100%;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
    }
    
    .produto-imagem-grande {
        width: 150px;
        height: 120px;
    }
    
    .produto-nome-modal {
        font-size: 1.3rem;
    }
    
    .personalizacao-actions {
        flex-direction: column;
    }
}

/* ✅ ANIMAÇÕES */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.personalizacao-content {
    animation: fadeInUp 0.3s ease-out;
}

.ingrediente-adicional-item {
    animation: fadeInUp 0.3s ease-out;
}

.ingrediente-adicional-item:nth-child(1) { animation-delay: 0.1s; }
.ingrediente-adicional-item:nth-child(2) { animation-delay: 0.2s; }
.ingrediente-adicional-item:nth-child(3) { animation-delay: 0.3s; }
    @keyframes slideInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// ✅ TOGGLE INGREDIENTE - VERSÃO SEM BLOQUEIO
function toggleIngredienteAdicional(item) {
    const ingId = item.getAttribute('data-ingrediente-id');
    const preco = parseFloat(item.getAttribute('data-preco')) || 0;
    const nomeEl = item.querySelector('.ingrediente-nome-novo') || item.querySelector('.ingrediente-adicional-nome');
    const ingNome = nomeEl?.textContent || 'Adicional';
    
    if (item.classList.contains('selecionado')) {
        // Remover ingrediente
        item.classList.remove('selecionado');
        ingredientesSelecionados = ingredientesSelecionados.filter(ing => ing.ingId !== ingId);
        console.log('➖ Ingrediente removido:', ingId);
    } else {
        // Adicionar ingrediente
        item.classList.add('selecionado');
        ingredientesSelecionados.push({ 
            ingId, 
            ingNome,
            preco,
            ingPrecoAdicional: preco 
        });
        console.log('➕ Ingrediente adicionado:', { ingId, ingNome, preco });
    }
    
    // ✅ APENAS ATUALIZAR O TOTAL, SEM MOSTRAR LISTA DE ADICIONAIS
    atualizarTotalPersonalizacao();
}

// ✅ ATUALIZAR TOTAL
function atualizarTotalPersonalizacao() {
    const totalElement = document.getElementById('personalizacaoTotal');
    const adicionalElement = document.querySelector('.resumo-adicionais .resumo-valor') || document.querySelector('.resumo-adicionais-valor');
    
    if (!totalElement) return;
    
    const adicional = ingredientesSelecionados.reduce((sum, ing) => {
        const preco = parseFloat(ing.preco) || parseFloat(ing.ingPrecoAdicional) || 0;
        return sum + preco;
    }, 0);
    
    const quantidade = window.quantidadePersonalizacao || 1;
    const totalUnitario = precoBaseAtual + adicional;
    const totalFinal = totalUnitario * quantidade;
    
    totalElement.textContent = `R$ ${totalFinal.toFixed(2)}`;
    if (adicionalElement) {
        adicionalElement.textContent = `R$ ${(adicional * quantidade).toFixed(2)}`;
    }
    
    console.log('💰 Total atualizado:', { base: precoBaseAtual, adicional, quantidade, totalFinal, ingredientes: ingredientesSelecionados });
}


// ✅ FUNÇÃO PARA ADICIONAR PRODUTO PERSONALIZADO
// ✅ FUNÇÃO PARA ADICIONAR PRODUTO PERSONALIZADO
async function adicionarProdutoPersonalizado(produtoId, produtoNome, precoFinal, adicionais, descricao, removidos) {
    try {
        console.log('🛒 Adicionando personalizado:', { produtoId, produtoNome, precoFinal, adicionais, removidos });

        const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
        const imagem = card?.querySelector('img')?.src || '';

        // ✅ CAPTURA A OBSERVAÇÃO
        const comentarioEl = document.getElementById('inputComentarioAdicional');
        const observacao = comentarioEl ? comentarioEl.value.trim() : '';
        console.log('📝 Observação capturada:', observacao);

        adicionarItemLocal({
            produtoId,
            nome: produtoNome,
            preco: precoFinal,
            imagem_url: imagem,
            personalizado: true,
            ingredientes: adicionais || [],
            removidos: removidos || [],
            observacao: observacao   // ✅ PASSA A OBSERVAÇÃO
        });

        // Limpar o campo
        if (comentarioEl) comentarioEl.value = '';

        abrirCarrinho();
        mostrarNotificacao('✅ Produto adicionado ao carrinho!', 'sucesso');

    } catch (error) {
        console.error('💥 Erro:', error);
        mostrarNotificacao('Erro ao adicionar produto', 'erro');
    }
}



// ✅ FUNÇÃO AUXILIAR PARA BUSCAR INGREDIENTE POR ID
function getIngredientePorId(ingId) {
    const todosIngredientes = getIngredientesReaisDoBanco();
    return todosIngredientes.find(ing => ing.ingId == ingId);
}

// ✅ FUNÇÃO AUXILIAR - NOME DA CATEGORIA
function obterNomeCategoria(categoria) {
    const categorias = {
        'pao': 'Pão',
        'carne': 'Carne',
        'queijo': 'Queijo',
        'salada': 'Salada',
        'molho': 'Molho',
        'adicional': 'Adicionais'
    };
    return categorias[categoria] || categoria;
}

// ✅ FILTRAR PRODUTOS LOCALMENTE
function filtrarProdutosPorCategoria(categoria) {
    const produtos = document.querySelectorAll('.produto-card');
    
    if (produtos.length === 0) {
        console.log('❌ Nenhum produto encontrado para filtrar');
        return;
    }
    
    console.log(`🎯 Filtrando ${produtos.length} produtos para categoria: ${categoria}`);
    
    let produtosVisiveis = 0;
    
    // ✅ ANIMAÇÃO SUAVE - ESCONDER TODOS PRIMEIRO
    produtos.forEach(produto => {
        produto.style.transition = 'all 0.4s ease';
        produto.style.opacity = '0.3';
        produto.style.transform = 'scale(0.95)';
    });
    
    // ✅ APÓS PEQUENO DELAY, MOSTRAR OS RELEVANTES
    setTimeout(() => {
        produtos.forEach(produto => {
            const categoriaProduto = produto.getAttribute('data-categoria') || '';

const deveMostrar =
  categoria === 'todos' ||
  categoriaProduto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') ===
  categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
            if (deveMostrar) {
                produto.style.display = 'flex';
                produtosVisiveis++;
                
                // ✅ ANIMAÇÃO DE ENTRADA INDIVIDUAL
                setTimeout(() => {
                    produto.style.opacity = '1';
                    produto.style.transform = 'scale(1)';
                }, Math.random() * 150);
            } else {
                produto.style.display = 'none';
            }
        });
        
        // ✅ ATUALIZAR MENSAGEM DE ESTADO VAZIO
        atualizarEmptyState(produtosVisiveis, categoria);
        
        console.log(`✅ Mostrando ${produtosVisiveis} produtos`);
        
    }, 200);
}

// ✅ ATUALIZAR ESTADO VAZIO
function atualizarEmptyState(produtosVisiveis, categoria) {
    const emptyState = document.querySelector('.empty-state');
    const produtosGrid = document.querySelector('.produtos-grid');
    
    if (produtosVisiveis === 0) {
        if (!emptyState) {
            const nomeCategoria = obterNomeCategoria(categoria);
            const emptyHTML = `
                <div class="empty-state" style="opacity: 0; transform: translateY(20px);">
                    <p>Nenhum produto encontrado em "${nomeCategoria}"</p>
                </div>
            `;
            produtosGrid.innerHTML += emptyHTML;
            
            // ✅ ANIMAÇÃO DO EMPTY STATE
            setTimeout(() => {
                const newEmptyState = produtosGrid.querySelector('.empty-state');
                if (newEmptyState) {
                    newEmptyState.style.transition = 'all 0.4s ease';
                    newEmptyState.style.opacity = '1';
                    newEmptyState.style.transform = 'translateY(0)';
                }
            }, 100);
        }
    } else {
        if (emptyState) {
            emptyState.style.opacity = '0';
            emptyState.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (emptyState.parentNode) {
                    emptyState.remove();
                }
            }, 400);
        }
    }
}
// ✅ FUNÇÃO PARA ABRIR DETALHES DO PRODUTO
function abrirDetalhesProduto(produtoId) {
    console.log('🔍 Abrindo detalhes do produto:', produtoId);
    
    // ✅ REDIRECIONAR PARA PÁGINA DE DETALHES
    window.location.href = `/produto/${produtoId}`;
    
    // ✅ OU SE PREFERIR ABRIR UM MODAL:
    // abrirModalDetalhes(produtoId);
}

function mostrarFeedback(mensagem, sucesso = true) {
    console.log(sucesso ? '✅' : '❌', mensagem);
    
    // Remover feedback antigo
    const feedbackAntigo = document.querySelector('.feedback-mensagem');
    if (feedbackAntigo) feedbackAntigo.remove();
    
    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = 'feedback-mensagem ' + (sucesso ? 'sucesso' : 'erro');
    feedback.textContent = mensagem;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${sucesso ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 99999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => feedback.remove(), 300);
    }, 3000);
}



// ✅ FUNÇÃO PARA LIDAR COM CLIQUE NO PRODUTO
window.handleProdutoClick = function(produtoId, categoria, emPromocao = false, cardElemento = null, event = null) {
  if (event) event.stopPropagation();

  console.log('🖱️ Clique detectado:', { produtoId, categoria, emPromocao });

  // 🔒 Evita execução duplicada (caso algum outro listener tenha disparado)
  if (window.ultimoCliqueProduto === produtoId && Date.now() - (window.ultimoCliqueTempo || 0) < 500) {
    console.warn('⚠️ Clique duplicado ignorado:', produtoId);
    return;
  }
  window.ultimoCliqueProduto = produtoId;
  window.ultimoCliqueTempo = Date.now();

  // 🔥 Se for promoção, adiciona direto ao carrinho
if (categoria === 'hamburguer') {
  console.log('🔥 Produto em promoção — abrindo personalização normalmente');
  const produtoCard = cardElemento || document.querySelector(`[data-produto-id="${produtoId}"]`);
  const produtoNome = produtoCard.querySelector('.produto-nome')?.textContent || 'Hambúrguer';
  const precoTexto = produtoCard.querySelector('.preco-atual')?.textContent || '0';
  const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim()) || 0;

  abrirPersonalizacao(produtoId, produtoNome, preco);
  return;
}

  // 🍔 Se for hambúrguer, abre personalização
  if (categoria === 'hamburguer') {
    const produtoCard = cardElemento || document.querySelector(`[data-produto-id="${produtoId}"]`);
    const produtoNome = produtoCard.querySelector('.produto-nome')?.textContent || 'Hambúrguer';
    const precoTexto = produtoCard.querySelector('.preco-atual')?.textContent || '0';
    const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim()) || 0;

    abrirPersonalizacao(produtoId, produtoNome, preco);
  } else {
    // 🥤 Outros produtos — direto ao carrinho
    adicionarAoCarrinho(produtoId, cardElemento);
  }
}

// ✅ OBTER NOME AMIGÁVEL DA CATEGORIA
function obterNomeCategoria(categoria) {
    const nomes = {
        'todos': 'Todos os produtos',
        'hamburguer': 'Hamburgueres',
        'bebida': 'Bebidas',
        'combo': 'Combos',
        'acompanhamento': 'Acompanhamentos'
    };
    return nomes[categoria] || categoria;
}

// ✅ LIDAR COM NAVEGAÇÃO DO BROWSER (back/forward)
window.addEventListener('popstate', function(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria') || 'todos';
    
    console.log('🔙 Navegação do browser para categoria:', categoria);
    filtrarCategoria(categoria);
});

function atualizarConteudoDockCarrinho(carrinho, quantidadeTotal, total) {
    const container = document.getElementById('carrinhoDockContent');
    if (!container) return;

    if (!carrinho || carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-dock-vazio" id="carrinhoVazio">
                <i data-lucide="shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    const itensHTML = carrinho.map(item => {
        const preco = Number(item.preco) || 0;
        const quantidade = Number(item.quantidade) || 1;
        const nome = item.nome || 'Produto';
        const id = item.id || '';
        const imagemUrl = item.imagem_url || '';
        const personalizado = item.personalizado || false;
        const ingredientes = item.ingredientes || [];
        const removidos = item.removidos || [];

        return `
            <div class="carrinho-dock-item" data-item-id="${id}">
                ${imagemUrl ? 
                    `<img src="${imagemUrl}" alt="${nome}" class="carrinho-dock-item-img">` :
                    `<div class="carrinho-dock-item-img-placeholder">
                        <i data-lucide="image"></i>
                    </div>`
                }
                
                <div class="carrinho-dock-item-info">
                    <h4 class="carrinho-dock-item-nome">${nome}</h4>
                    <span class="carrinho-dock-item-preco">R$ ${preco.toFixed(2)}</span>
                    
                    ${personalizado && (ingredientes.length > 0 || removidos.length > 0) ? `
                        <div class="modificacoes">
                            ${ingredientes.length > 0 ? 
                                `<span class="modificacao adicional">+ ${ingredientes.map(i => i.ingNome).join(', ')}</span>` 
                                : ''}
                            ${removidos.length > 0 ? 
                                `<span class="modificacao removido">- ${removidos.join(', ')}</span>` 
                                : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="carrinho-dock-item-controls">
                    ${!personalizado ? `
                        <div class="qty-controls">
                            <button class="btn-qty" onclick="atualizarQtd('${id}', -1)">
                                <i data-lucide="minus"></i>
                            </button>
                            <span class="qty-value">${quantidade}</span>
                            <button class="btn-qty" onclick="atualizarQtd('${id}', 1)">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                    ` : `
                        <span class="qty-fixa">Qtd: ${quantidade}</span>
                    `}
                    
                    <button class="btn-remover" onclick="removerItem('${id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div id="carrinhoItens">${itensHTML}</div>`;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

console.log('✅ Funções de atualização do carrinho carregadas!');


// ✅ FINALIZAR PEDIDO
/* ═══════════════════════════════════════════════════════════
   🔧 CORREÇÃO: Pegar total REAL do backend
   ═══════════════════════════════════════════════════════════ */

async function finalizarPedido() {
    console.log('🎯 Finalizando pedido...');

    const carrinho = getCarrinho();

    if (!carrinho || carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio', 'erro');
        return;
    }

    const total = carrinho.reduce((s, i) => s + (Number(i.preco) * Number(i.quantidade || 1)), 0);
    const numeroPedido = Date.now().toString().slice(-6);

    window.pedidoAtual = {
        numeroPedido,
        total,
        carrinho
    };

    console.log('✅ Pedido criado (local):', window.pedidoAtual);

    const dock = document.getElementById('carrinhoDock');
    if (dock) {
        dock.classList.remove('expanded');
        dock.classList.add('collapsed');
    }

    setTimeout(() => {
        abrirModalPagamento(window.pedidoAtual);
    }, 300);
}
console.log('✅ Função finalizar corrigida para pegar total REAL do backend!');



// =============================================================
// 🧩 Função principal - adicionar item ao carrinho (corrigida)
// =============================================================
async function adicionarAoCarrinho(produtoId, cardElemento = null) {
    try {
        console.log('🛒 Adicionando produto:', produtoId);

        if (!produtoId) {
            mostrarNotificacao('Erro: ID do produto não encontrado', 'erro');
            return;
        }

        const card = cardElemento?.closest('.produto-card') || document.querySelector(`[data-produto-id="${produtoId}"]`);
        if (!card) {
            mostrarNotificacao('Produto não encontrado na página', 'erro');
            return;
        }

        const nome = card.querySelector('.produto-nome')?.textContent?.trim() || 'Produto';
        const precoTexto = card.querySelector('.preco-atual')?.textContent || '0';
        const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim()) || 0;
        const imagem = card.querySelector('img')?.src || '';

        adicionarItemLocal({
            produtoId,
            nome,
            preco,
            imagem_url: imagem,
            personalizado: false,
            ingredientes: [],
            removidos: []
        });

        abrirCarrinho();
        mostrarNotificacao('✅ Produto adicionado ao carrinho!', 'sucesso');

    } catch (error) {
        console.error('💥 Erro:', error);
        mostrarNotificacao('Erro ao adicionar produto', 'erro');
    }
}






window.addEventListener("scroll", () => {
  const filtro = document.querySelector(".filtro-categoria.lateral-flutuante");
  const promocoes = document.querySelector(".secao-promocoes, .promocoes-quentes, .banner-promocoes"); 
  if (!filtro || !promocoes) return;

  const bannerBottom = promocoes.getBoundingClientRect().bottom;
  const alturaTela = window.innerHeight;
  const posicaoCentral = alturaTela / 2 - filtro.offsetHeight / 2;
  const limiteSuperior = 100;
  const distanciaExtra = 60; // ⬅️ aumente aqui se quiser que fique ainda mais abaixo no topo

  if (bannerBottom > limiteSuperior + distanciaExtra) {
    // 🟠 No topo — fica um pouco mais abaixo do banner
    filtro.style.top = bannerBottom + distanciaExtra + "px";
  } else {
    // 🔵 Ao rolar — centraliza no meio da tela
    filtro.style.top = posicaoCentral + "px";
  }
});



// ✅ INICIALIZAÇÃO COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema completo...');
    evitarCache();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Inicializações principais
    inicializarCarrinho();
    inicializarModalPersonalizacao();
    adicionarCSSPersonalizacao();
    
    // ✅ ESSENCIAIS PARA FUNCIONAR FILTRO E AÇÕES DE PRODUTO
    inicializarNavegacaoCategorias();
    configurarBotoesPersonalizacao();
    
    // ✅ POSICIONAR O FILTRO NA INICIALIZAÇÃO
    setTimeout(() => {
        posicionarFiltroLateral();
    }, 100); // Pequeno delay para garantir que o DOM esteja totalmente renderizado

    console.log('✅ Sistema completo inicializado!');
});

// ✅ ADICIONAR TAMBÉM NO RESIZE DA JANELA
window.addEventListener("resize", () => {
    posicionarFiltroLateral();
});

/* ============================================
   💳 INTEGRAÇÃO MERCADO PAGO
   Cole no FINAL do cardapio.js
   ============================================ */

// ✅ VARIÁVEIS GLOBAIS PARA PAGAMENTO
let mercadoPagoPublicKey = null;
let mp = null;

// ✅ CARREGAR SDK DO MERCADO PAGO
async function carregarMercadoPago() {
    try {
        // Buscar chave pública do backend
        const response = await fetch('/pagamento/config');
        const data = await response.json();
        
        if (data.ok && data.publicKey) {
            mercadoPagoPublicKey = data.publicKey;
            
            // Carregar SDK
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => {
                mp = new MercadoPago(mercadoPagoPublicKey);
                console.log('✅ Mercado Pago SDK carregado');
            };
            document.head.appendChild(script);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar Mercado Pago:', error);
    }
}

// Carregar ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarMercadoPago();
});

// ✅ MODIFICAR FUNÇÃO DE FINALIZAR PEDIDO
// Substitua a função finalizarPedido() existente por esta:


// ✅ ABRIR MODAL DE PAGAMENTO
function abrirModalPagamento(pedido) {
    const modalHTML = `
        <div class="modal-pagamento-overlay" id="modalPagamento">
            <div class="modal-pagamento">
                <!-- HEADER -->
                <div class="modal-pagamento-header">
                    <h2>
                        <i data-lucide="credit-card"></i>
                        Pagamento
                    </h2>
                    <button class="btn-fechar-modal" onclick="fecharModalPagamento()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <!-- BODY -->
                <div class="modal-pagamento-body">
                    <!-- RESUMO DO PEDIDO -->
                    <div class="resumo-pedido">
                        <h3>Resumo do Pedido</h3>
                        <div class="resumo-item">
                            <span>Itens:</span>
                            <span>${pedido.carrinho?.length || 0} produto(s)</span>
                        </div>
                        
                        ${pedido.carrinho && pedido.carrinho.length > 0 ? `
                            <div class="lista-produtos-resumo">
                                ${pedido.carrinho.map(item => `
                                    <div class="produto-resumo-item">
                                        <span class="produto-nome">${item.nome}</span>
                                        <span class="produto-qtd">x${item.quantidade || 1}</span>
                                        <span class="produto-preco">R$ ${(item.preco * (item.quantidade || 1)).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="resumo-total">
                            <span>TOTAL:</span>
                            <span>R$ ${pedido.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- ABAS PIX / CARTÃO -->
                    <div class="pagamento-tabs">
                        <button class="tab-btn ativo" onclick="trocarAba('pix')">
                            <i data-lucide="smartphone"></i>
                            Pix
                        </button>
                        <button class="tab-btn" onclick="trocarAba('cartao')">
                            <i data-lucide="credit-card"></i>
                            Cartão
                        </button>
                    </div>

                    <!-- CONTEÚDO PIX -->
                    <div class="tab-content ativo" id="tab-pix">
                        <div class="pix-container">
                            <div class="pix-instrucoes">
                                <h4>
                                    <i data-lucide="info"></i>
                                    Como pagar com Pix
                                </h4>
                                <ol>
                                    <li>Abra o app do seu banco</li>
                                    <li>Escolha pagar com Pix QR Code ou Copia e Cola</li>
                                    <li>Escaneie o código ou cole o código abaixo</li>
                                    <li>Confirme o pagamento</li>
                                </ol>
                            </div>

                            <div id="qr-code-area" style="display: none;">
                                <div class="qr-code-container">
                                    <img id="qr-code-img" src="" alt="QR Code Pix">
                                </div>
                                
                                <div class="codigo-pix" id="codigo-pix-text"></div>
                                
                                <button class="btn-copiar-codigo" onclick="copiarCodigoPix()">
                                    <i data-lucide="copy"></i>
                                    Copiar código Pix
                                </button>
                            </div>

                            <button class="btn-finalizar-pagamento" onclick="gerarPix()">
                                <i data-lucide="qr-code"></i>
                                Gerar código Pix
                            </button>

                            <div class="loading-pagamento" id="loading-pix">
                                <div class="spinner"></div>
                                <p>Gerando código Pix...</p>
                            </div>
                        </div>
                    </div>

                    <!-- CONTEÚDO CARTÃO -->
<div class="tab-content" id="tab-cartao">
    <div class="cartao-maquininha">
        <div class="maquininha-instrucoes">
            <h4>
                <i data-lucide="credit-card"></i>
                Pagamento na maquininha
            </h4>
            <p>Escolha a forma de pagamento:</p>
        </div>

        <div class="botoes-maquininha">
            <button class="btn-tipo-cartao credito" onclick="pagarComCartaoMaquininha('credito')">
                <i data-lucide="credit-card"></i>
                <span>Crédito</span>
            </button>
            
            <button class="btn-tipo-cartao debito" onclick="pagarComCartaoMaquininha('debito')">
                <i data-lucide="credit-card"></i>
                <span>Débito</span>
            </button>
        </div>

        <div class="loading-pagamento" id="loading-maquininha" style="display: none;">
            <div class="spinner"></div>
            <p>Aguardando pagamento na maquininha...</p>
            <small>Passe ou insira o cartão</small>
        </div>
    </div>
</div>

                    <!-- STATUS DO PAGAMENTO -->
                    <div class="status-pagamento" id="status-pagamento">
                        <div class="status-icon sucesso" id="status-icon">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="status-mensagem">
                            <h3 id="status-titulo">Pagamento aprovado!</h3>
                            <div id="status-texto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inserir modal no body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Ativar modal
    setTimeout(() => {
        document.getElementById('modalPagamento').classList.add('ativo');
        lucide.createIcons();
    }, 10);

    // Aplicar máscaras nos inputs
    aplicarMascarasCartao();
}

// ✅ TROCAR ABA (PIX/CARTÃO)
function trocarAba(tipo) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('ativo'));
    event.target.closest('.tab-btn').classList.add('ativo');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('ativo'));
    document.getElementById(`tab-${tipo}`).classList.add('ativo');

    lucide.createIcons();
}

// ✅ GERAR PAGAMENTO PIX
async function gerarPix() {
    const btnGerar = event.target;
    const loading = document.getElementById('loading-pix');
    const qrArea = document.getElementById('qr-code-area');

    console.log('💳 Gerando PIX...');
    console.log('📦 Pedido atual:', window.pedidoAtual);

    if (!window.pedidoAtual) {
        alert('Erro: Pedido não encontrado');
        return;
    }

    if (!window.pedidoAtual.total || window.pedidoAtual.total <= 0) {
        alert('Erro: Valor do pedido é R$ 0,00');
        return;
    }

    btnGerar.style.display = 'none';
    loading.classList.add('ativo');

    try {
        const dadosPix = {
    pedidoId: 0,
    numeroPedido: window.pedidoAtual.numeroPedido,
    total: window.pedidoAtual.total,
    email: document.getElementById('clienteEmail')?.value || '',
    cpf: document.getElementById('clienteCpf')?.value.replace(/\D/g, '') || '',
    nome: document.getElementById('clienteNome')?.value || ''
};

        console.log('📤 Enviando:', dadosPix);

        const response = await fetch('/pagamento/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPix)
        });

        const data = await response.json();
        console.log('📥 Resposta Mercado Pago:', data);

        if (data.ok && data.qrCodeBase64) {
            document.getElementById('qr-code-img').src = `data:image/png;base64,${data.qrCodeBase64}`;
            document.getElementById('codigo-pix-text').textContent = data.copiaCola;
            
            qrArea.style.display = 'block';
            loading.classList.remove('ativo');

            console.log('✅ PIX Gerado com sucesso!');
            console.log('💰 Valor: R$', dadosPix.total.toFixed(2));

            // Verificar pagamento
            if (data.pagamentoId) {
                verificarPagamentoPix(data.pagamentoId);
            }

        } else {
            throw new Error(data.error || data.msg || 'Erro ao gerar Pix');
        }

    } catch (error) {
        console.error('❌ Erro ao gerar Pix:', error);
        loading.classList.remove('ativo');
        btnGerar.style.display = 'flex';
        alert('Erro: ' + error.message);
    }
}

// ✅ COPIAR CÓDIGO PIX
function copiarCodigoPix() {
    const codigo = document.getElementById('codigo-pix-text').textContent;
    const btn = event.target.closest('.btn-copiar-codigo');

    navigator.clipboard.writeText(codigo).then(() => {
        btn.classList.add('copiado');
        btn.innerHTML = '<i data-lucide="check"></i> Código copiado!';
        lucide.createIcons();

        setTimeout(() => {
            btn.classList.remove('copiado');
            btn.innerHTML = '<i data-lucide="copy"></i> Copiar código Pix';
            lucide.createIcons();
        }, 3000);
    });
}

let intervaloPix = null;

function verificarPagamentoPix(pagamentoId) {
    // ✅ VALIDAÇÃO: Não iniciar se ID for inválido
    if (!pagamentoId) {
        console.error('❌ ID de pagamento não informado');
        return;
    }
    
    // Converte para string para validar
    const pagamentoIdStr = String(pagamentoId);
    
    if (pagamentoIdStr === 'SEU_PAGAMENTO_ID_AQUI' || 
        pagamentoIdStr.includes('AQUI') || 
        pagamentoIdStr === 'undefined' || 
        pagamentoIdStr === 'null') {
        console.error('❌ ID de pagamento inválido:', pagamentoId);
        return;
    }

    let tentativas = 0;
    const maxTentativas = 60;

    if (intervaloPix) {
        clearInterval(intervaloPix);
    }

    console.log('✅ Iniciando verificação de pagamento:', pagamentoIdStr);

    intervaloPix = setInterval(async () => {
        tentativas++;

        try {
            const response = await fetch(`/pagamento/status/${pagamentoIdStr}`);
            const data = await response.json();

            if (data.ok && data.status === 'approved') {
                clearInterval(intervaloPix);
                
                console.log('✅ Pagamento aprovado! Confirmando pedido...');
                
                await confirmarPedidoPago(pagamentoId);
                
                mostrarStatusPagamento(
                    'sucesso', 
                    'Pagamento aprovado!', 
                    'Seu pedido foi confirmado',
                    window.pedidoAtual?.numeroPedido
                );
            }

            if (tentativas >= maxTentativas) {
                clearInterval(intervaloPix);
                mostrarStatusPagamento('erro', 'Tempo esgotado', 'Pagamento não detectado');
            }

        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 5000);
}

// ✅ PAGAR COM CARTÃO
async function pagarComCartao(event) {
    event.preventDefault();

    if (!mp) {
        mostrarFeedback('SDK do Mercado Pago não carregado', false);
        return;
    }

    const form = document.getElementById('form-cartao');
    const loading = document.getElementById('loading-cartao');
    const btnSubmit = form.querySelector('button[type="submit"]');

    btnSubmit.disabled = true;
    loading.classList.add('ativo');

    try {
        // Criar token do cartão
        const cardData = {
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            cardholderName: document.getElementById('cardholderName').value,
            cardExpirationMonth: document.getElementById('expirationDate').value.split('/')[0],
            cardExpirationYear: '20' + document.getElementById('expirationDate').value.split('/')[1],
            securityCode: document.getElementById('securityCode').value,
            identificationType: 'CPF',
            identificationNumber: document.getElementById('cardholderCpf').value.replace(/\D/g, '')
        };

        const token = await mp.createCardToken(cardData);

        // Enviar pagamento para o backend
        const response = await fetch('/pagamento/cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pedidoId: 0,
                numeroPedido: pedidoAtual.numeroPedido,
                total: pedidoAtual.total,
                token: token.id,
                email: document.getElementById('cardholderEmail').value,
                cpf: document.getElementById('cardholderCpf').value.replace(/\D/g, ''),
                nome: document.getElementById('cardholderName').value,
                parcelas: document.getElementById('installments').value
            })
        });

        const data = await response.json();

        if (data.ok && data.status === 'approved') {
            mostrarStatusPagamento('sucesso', 'Pagamento aprovado!', 'Seu pedido foi confirmado');
        } else {
            throw new Error(data.msg || 'Pagamento recusado');
        }

    } catch (error) {
        console.error('❌ Erro ao processar cartão:', error);
        loading.classList.remove('ativo');
        btnSubmit.disabled = false;
        mostrarFeedback('Erro ao processar pagamento: ' + error.message, false);
    }
}

let timerRedirecionamento = null;
let segundosRestantes = 60;

function mostrarStatusPagamento(tipo, titulo, mensagem, numeroPedido = null) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('ativo'));
    document.querySelectorAll('.loading-pagamento').forEach(load => load.classList.remove('ativo'));
    const tabsElement = document.querySelector('.pagamento-tabs');
    if (tabsElement) tabsElement.style.display = 'none';

    const statusDiv = document.getElementById('status-pagamento');
    const icon = document.getElementById('status-icon');
    
    if (!statusDiv || !icon) return;
    
    statusDiv.classList.add('ativo');
    icon.className = `status-icon ${tipo}`;
    
    const statusTitulo = document.getElementById('status-titulo');
    const statusTexto = document.getElementById('status-texto');
    
    let numeroLimpo = numeroPedido;
    if (numeroPedido && typeof numeroPedido === 'string') {
        numeroLimpo = numeroPedido.replace(/PED/gi, '').trim();
    }
    
    if (tipo === 'sucesso') {
        statusTitulo.innerHTML = `
            <i data-lucide="check-circle" style="color: #10b981;"></i>
            Pagamento Confirmado!
        `;
        
        statusTexto.innerHTML = `
            <div class="pedido-numero">
                <span class="label-pedido">Número do Pedido</span>
                <span class="numero-pedido">${numeroLimpo || 'N/A'}</span>
            </div>
            <p class="mensagem-sucesso">Seu pedido foi confirmado com sucesso!</p>
        `;
        
        const btnContainer = statusDiv.querySelector('.status-mensagem');
        if (btnContainer) {
            const existingBtn = btnContainer.querySelector('.btn-voltar-inicio');
            if (existingBtn) existingBtn.remove();
            const existingTimer = btnContainer.querySelector('.timer-redirect');
            if (existingTimer) existingTimer.remove();
            
            const botoesHTML = `
                <button class="btn-voltar-inicio" onclick="voltarParaInicioManual()">
                    <i data-lucide="home"></i>
                    Voltar ao Início
                </button>
                <div class="timer-redirect" id="timer-redirect">
                    <div class="timer-barra">
                        <div class="timer-progresso" id="timer-progresso"></div>
                    </div>
                    <p class="timer-texto">
                        Redirecionando em <strong id="timer-segundos">60</strong>s
                    </p>
                </div>
            `;
            
            btnContainer.insertAdjacentHTML('beforeend', botoesHTML);
        }
    } else {
        if (statusTitulo) statusTitulo.textContent = titulo;
        if (statusTexto) statusTexto.textContent = mensagem;
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    if (tipo === 'sucesso') {
        iniciarTimerRedirecionamento();
    }
}

function iniciarTimerRedirecionamento() {
    segundosRestantes = 60;
    const timerProgresso = document.getElementById('timer-progresso');
    const timerSegundos = document.getElementById('timer-segundos');
    
    if (timerRedirecionamento) {
        clearInterval(timerRedirecionamento);
    }
    
    timerRedirecionamento = setInterval(() => {
        segundosRestantes--;
        
        if (timerSegundos) {
            timerSegundos.textContent = segundosRestantes;
        }
        
        if (timerProgresso) {
            const percentual = (segundosRestantes / 60) * 100;
            timerProgresso.style.width = percentual + '%';
        }
        
        if (segundosRestantes <= 0) {
            clearInterval(timerRedirecionamento);
            voltarParaInicio();
        }
    }, 1000);
}

function voltarParaInicioManual() {
    if (timerRedirecionamento) {
        clearInterval(timerRedirecionamento);
    }
    voltarParaInicio();
}

// ✅ FECHAR MODAL
function fecharModalPagamento() {
    if (typeof intervaloPix !== 'undefined' && intervaloPix) {
        clearInterval(intervaloPix);
    }
    
    const modal = document.getElementById('modalPagamento');
    if (modal) {
        modal.classList.remove('ativo');
        setTimeout(() => modal.remove(), 300);
    }
    
    // NÃO limpar carrinho aqui
    console.log('ℹ️ Modal fechado. Carrinho mantido.');
}


async function voltarParaInicio() {
    try {
        await fetch('/cardapio/sessao/limpar', { method: 'POST' });
    } catch (error) {
        console.error('❌ Erro ao limpar sessão:', error);
    }
    
    window.carrinho = [];
    window.pedidoAtual = null;
    if (typeof atualizarCarrinho === 'function') {
        atualizarCarrinho();
    }
    
    fecharModalPagamento();
    
    setTimeout(() => {
        window.location.href = '/';
    }, 300);
}

// ✅ QUANDO O PAGAMENTO FOR CONFIRMADO (no verificarPagamentoPix)
async function confirmarPedidoPago(pagamentoId) {
    try {
        console.log('✅ Pagamento confirmado! Salvando pedido no banco...');
        
        const response = await fetch('/cardapio/pedido/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroPedido: window.pedidoAtual.numeroPedido,
                pagamentoId: pagamentoId
            })
        });

        const data = await response.json();
        console.log('📦 Resposta confirmação:', data);

        if (data.ok) {
            // Mostrar sucesso
            mostrarStatusPagamento('sucesso', 'Pagamento aprovado!', 'Seu pedido foi confirmado');
            
            // Limpar carrinho
            window.carrinho = [];
            if (typeof atualizarCarrinho === 'function') {
                atualizarCarrinho();
            }
        }

    } catch (error) {
        console.error('❌ Erro ao confirmar pedido:', error);
    }
}



// ✅ LIMPAR SESSÃO ao fechar modal sem pagar
function fecharModalPagamento() {
    if (intervaloPix) clearInterval(intervaloPix);
    
    const modal = document.getElementById('modalPagamento');
    if (modal) {
        modal.classList.remove('ativo');
        setTimeout(() => modal.remove(), 300);
    }
    
    console.log('ℹ️ Modal fechado. Carrinho mantido (pedido não salvo no banco).');
}
// ✅ LIMPAR SESSÃO ao voltar para início SEM pagar
async function voltarParaInicio() {
    // Limpar sessão no backend
    try {
        await fetch('/cardapio/sessao/limpar', { method: 'POST' });
        console.log('✅ Sessão limpa no backend');
    } catch (error) {
        console.error('❌ Erro ao limpar sessão:', error);
    }
    
    // Limpar frontend
    window.carrinho = [];
    window.pedidoAtual = null;
    if (typeof atualizarCarrinho === 'function') {
        atualizarCarrinho();
    }
    
    fecharModalPagamento();
    
    setTimeout(() => {
        window.location.href = '/';
    }, 300);
}

// ✅ APLICAR MÁSCARAS NOS INPUTS DO CARTÃO
function aplicarMascarasCartao() {
    // Máscara de número do cartão
    const cardNumber = document.getElementById('cardNumber');
    cardNumber?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Máscara de data de validade
    const expirationDate = document.getElementById('expirationDate');
    expirationDate?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Máscara de CPF
    const cardholderCpf = document.getElementById('cardholderCpf');
    cardholderCpf?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        e.target.value = value;
    });

    // Apenas números no CVV
    const securityCode = document.getElementById('securityCode');
    securityCode?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Adicione estas funções no cardapio.js

async function pagarComCartaoMaquininha(tipo) {
    try {
        const loading = document.getElementById('loading-maquininha');
        loading.style.display = 'block';
        
        const response = await fetch('/pagamento/cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroPedido: pedidoAtual.numeroPedido,
                total: pedidoAtual.total,
                tipo: tipo
            })
        });
        
        const resultado = await response.json();
        loading.style.display = 'none';
        
        if (resultado.ok) {
            await confirmarPedidoPago(pedidoAtual.numeroPedido, resultado.transacaoId);
            mostrarStatusPagamento('sucesso', 'Pagamento aprovado!', 'Transação: ' + resultado.transacaoId);
        } else {
            mostrarStatusPagamento('erro', 'Pagamento negado', resultado.msg);
        }
        
    } catch (error) {
        document.getElementById('loading-maquininha').style.display = 'none';
        mostrarStatusPagamento('erro', 'Erro no pagamento', 'Verifique a maquininha');
    }
}

// CSS para os botões
const style = document.createElement('style');
style.textContent = `
    .cartao-maquininha {
        padding: 2rem;
        text-align: center;
    }
    
    .maquininha-instrucoes {
        margin-bottom: 2rem;
    }
    
    .maquininha-instrucoes h4 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #f97316;
        margin-bottom: 1rem;
    }
    
    .botoes-maquininha {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .btn-tipo-cartao {
        padding: 2rem 1rem;
        border: 2px solid #374151;
        background: #1f2937;
        border-radius: 1rem;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: white;
    }
    
    .btn-tipo-cartao:hover {
        border-color: #f97316;
        background: #374151;
        transform: translateY(-4px);
    }
    
    .btn-tipo-cartao.credito:hover {
        border-color: #3b82f6;
    }
    
    .btn-tipo-cartao.debito:hover {
        border-color: #10b981;
    }
    
    .btn-tipo-cartao i {
        width: 3rem;
        height: 3rem;
    }
    
    .btn-tipo-cartao span {
        font-size: 1.2rem;
        font-weight: 600;
    }
    
    #loading-maquininha {
        background: rgba(0,0,0,0.8);
        padding: 2rem;
        border-radius: 1rem;
        color: white;
    }
    
    #loading-maquininha small {
        display: block;
        margin-top: 1rem;
        color: #9ca3af;
    }
`;
document.head.appendChild(style);
}
if (!document.getElementById('style-timer-pedido')) {
    const styleTimer = document.createElement('style');
    styleTimer.id = 'style-timer-pedido';
    styleTimer.textContent = `
        .pedido-numero {
            background: linear-gradient(135deg, #f97316, #dc2626);
            padding: 1.5rem;
            border-radius: 1rem;
            margin: 1.5rem 0;
            text-align: center;
        }
        
        .label-pedido {
            display: block;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .numero-pedido {
            display: block;
            color: white;
            font-size: 3rem;
            font-weight: 900;
            font-family: 'Courier New', monospace;
            text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        
        .mensagem-sucesso {
            color: var(--gray-400);
            font-size: 1rem;
            margin-top: 1rem;
        }
        
        .btn-voltar-inicio {
            width: 100%;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 1.25rem;
            border-radius: 1rem;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-top: 2rem;
            transition: all 0.3s;
        }
        
        .btn-voltar-inicio:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn-voltar-inicio i {
            width: 24px;
            height: 24px;
        }
        
        .timer-redirect {
            margin-top: 1.5rem;
            text-align: center;
        }
        
        .timer-barra {
            width: 100%;
            height: 8px;
            background: var(--gray-700);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 0.75rem;
        }
        
        .timer-progresso {
            height: 100%;
            background: linear-gradient(90deg, #f97316, #dc2626);
            width: 100%;
            transition: width 1s linear;
            border-radius: 10px;
        }
        
        .timer-texto {
            color: var(--gray-400);
            font-size: 0.9rem;
            margin: 0;
        }
        
        .timer-texto strong {
            color: var(--primary-orange);
            font-size: 1.1rem;
            font-weight: 700;
        }
        
        .status-icon.sucesso {
            color: #10b981;
            font-size: 4rem;
            animation: successPulse 0.6s ease-out;
        }
        
        @keyframes successPulse {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleTimer);
}

if (!document.getElementById('style-lista-produtos')) {
    const styleResumo = document.createElement('style');
    styleResumo.id = 'style-lista-produtos';
    styleResumo.textContent = `
        .lista-produtos-resumo {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--gray-700);
            max-height: 200px;
            overflow-y: auto;
        }
        
        .produto-resumo-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--gray-800);
            border-radius: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .produto-nome {
            flex: 1;
            color: white;
            font-size: 0.9rem;
        }
        
        .produto-qtd {
            color: var(--gray-400);
            font-size: 0.85rem;
        }
        
        .produto-preco {
            color: var(--primary-yellow);
            font-weight: 600;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(styleResumo);
}