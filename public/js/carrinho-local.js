// ============================================================
// CARRINHO LOCAL - Gerenciado 100% no navegador (localStorage)
// ============================================================

const CARRINHO_KEY = 'burger-house-carrinho';

function getCarrinho() {
    try {
        return JSON.parse(localStorage.getItem(CARRINHO_KEY)) || [];
    } catch { return []; }
}

function setCarrinho(c) {
    localStorage.setItem(CARRINHO_KEY, JSON.stringify(c));
    atualizarUICarrinho(c);
}

function adicionarItemLocal(produto) {
    const carrinho = getCarrinho();
    const itemId = Date.now() + Math.floor(Math.random() * 10000);

    const novoItem = {
    id: itemId,
    produtoId: produto.produtoId,
    nome: produto.nome,
    preco: produto.preco,
    quantidade: 1,
    imagem_url: produto.imagem_url,
    personalizado: produto.personalizado || false,
    ingredientes: produto.ingredientes || [],
    removidos: produto.removidos || [],
    observacao: produto.observacao || ''   // ✅ ESSA LINHA
};

    carrinho.push(novoItem);
    setCarrinho(carrinho);
    return carrinho;
}

function removerItemLocal(itemId) {
    let carrinho = getCarrinho();
    carrinho = carrinho.filter(item => String(item.id) !== String(itemId));
    setCarrinho(carrinho);
    return carrinho;
}

function atualizarQtdLocal(itemId, quantidade) {
    let carrinho = getCarrinho();
    const idx = carrinho.findIndex(item => String(item.id) === String(itemId));
    if (idx === -1) return carrinho;

    if (quantidade <= 0) {
        carrinho.splice(idx, 1);
    } else {
        carrinho[idx].quantidade = quantidade;
    }
    setCarrinho(carrinho);
    return carrinho;
}

function limparCarrinhoLocal() {
    localStorage.removeItem(CARRINHO_KEY);
    atualizarUICarrinho([]);
}

function abrirCarrinho() {
    const dock = document.getElementById('carrinhoDock');
    if (dock && dock.classList.contains('collapsed')) {
        dock.classList.remove('collapsed');
        dock.classList.add('expanded');
        setTimeout(() => lucide?.createIcons(), 100);
    }
}

function atualizarUICarrinho(carrinho) {
    carrinho = Array.isArray(carrinho) ? carrinho : getCarrinho();
    
    const quantidadeTotal = carrinho.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
    const total = carrinho.reduce((s, i) => s + (Number(i.preco) * Number(i.quantidade || 0)), 0);

    const badge = document.getElementById('carrinhoBadge');
    const subtitulo = document.getElementById('carrinhoSubtitulo');
    const actionsContent = document.getElementById('carrinhoActionsContent');
    const totalValor = document.getElementById('carrinhoTotalValor');
    const container = document.getElementById('carrinhoDockContent');

    if (badge) {
        badge.textContent = quantidadeTotal;
        badge.style.display = quantidadeTotal > 0 ? '' : 'none';
    }
    if (subtitulo) {
        subtitulo.textContent = quantidadeTotal === 0
            ? 'Carrinho vazio'
            : `${quantidadeTotal} ${quantidadeTotal === 1 ? 'item' : 'itens'}`;
    }
    if (actionsContent) actionsContent.style.display = quantidadeTotal === 0 ? 'none' : 'flex';
    if (totalValor) totalValor.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-dock-vazio" id="carrinhoVazio">
                <i data-lucide="shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        lucide?.createIcons();
        return;
    }

const html = carrinho.map(item => {
    const preco = Number(item.preco) || 0;
    const qtd = Number(item.quantidade) || 1;
    const img = item.imagem_url || '';
    const ing = (item.ingredientes || []).map(i => i.ingNome).join(', ');
    const rem = (item.removidos || []).join(', ');
    const obs = item.observacao || '';
    const temDetalhes = item.personalizado && (ing || rem || obs);

    return `
        <div class="carrinho-card-horizontal" data-item-id="${item.id}">
            <div class="carrinho-card-img">
                ${img ? `<img src="${img}" alt="${item.nome}">` : `<div class="carrinho-card-img-placeholder"><i data-lucide="image"></i></div>`}
            </div>
            <div class="carrinho-card-info">
                <div class="carrinho-card-header">
                    <h4 class="carrinho-card-nome">${item.nome}</h4>
                    <span class="carrinho-card-preco">R$ ${preco.toFixed(2)}</span>
                </div>
                ${temDetalhes ? `
                    <details class="mods-details">
                        <summary class="mods-summary">Ver detalhes</summary>
                        <div class="mods-content">
                            ${ing ? `<span class="mod-tag add"><strong class="mod-icon mod-icon-add">+</strong> ${ing}</span>` : ''}
                            ${rem ? `<span class="mod-tag rem"><strong class="mod-icon mod-icon-rem">−</strong> ${rem}</span>` : ''}
                            ${obs ? `<span class="mod-tag" style="background: #1f2937; color: #fbbf24; margin-top: 0.25rem; display: block;">📝 ${obs}</span>` : ''}
                        </div>
                    </details>
                ` : ''}
            </div>
            <div class="carrinho-card-actions">
                ${!item.personalizado ? `
                    <div class="qty-mini">
                        <button class="qty-btn" onclick="atualizarQtdLocal('${item.id}', ${qtd - 1})"><i data-lucide="minus"></i></button>
                        <span class="qty-num">${qtd}</span>
                        <button class="qty-btn" onclick="atualizarQtdLocal('${item.id}', ${qtd + 1})"><i data-lucide="plus"></i></button>
                    </div>` : `<span class="qty-fixed">Qtd: ${qtd}</span>`}
                <button class="btn-trash" onclick="removerItemLocal('${item.id}')"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `;
}).join('');

    container.innerHTML = `<div class="carrinho-grid-horizontal" id="carrinhoItens">${html}</div>`;
    lucide?.createIcons();
}
// Alias para compatibilidade com os botões antigos
window.removerItem = removerItemLocal;
window.atualizarQtd = atualizarQtdLocal;