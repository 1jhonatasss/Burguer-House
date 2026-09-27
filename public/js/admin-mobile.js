/* ============================================
   ADMIN MOBILE - JavaScript
   Adicione este script em todas as páginas admin
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Admin Mobile...');

    // Criar botão hamburguer se não existir
    if (!document.querySelector('.mobile-menu-toggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i data-lucide="menu"></i>';
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.appendChild(menuToggle);
    }

    // Criar overlay se não existir
    if (!document.querySelector('.mobile-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }

    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    // Abrir/Fechar menu
    function toggleMenu() {
        sidebar.classList.toggle('mobile-active');
        overlay.classList.toggle('active');
        
        const isOpen = sidebar.classList.contains('mobile-active');
        menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        
        // Mudar ícone
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    // Click no botão
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Click no overlay fecha menu
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Fechar menu ao clicar em link
    const navLinks = document.querySelectorAll('.admin-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Converter tabelas em cards mobile
    convertTablesToCards();

    // Reconverter ao redimensionar
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            convertTablesToCards();
        }, 250);
    });
});

// Converter tabelas em cards para mobile
function convertTablesToCards() {
    if (window.innerWidth > 768) return;

    const tables = document.querySelectorAll('.admin-table');
    
    tables.forEach(table => {
        // Verificar se já existe lista mobile
        let mobileList = table.parentElement.querySelector('.mobile-card-list');
        
        if (!mobileList) {
            mobileList = document.createElement('div');
            mobileList.className = 'mobile-card-list mobile-only';
            table.parentElement.insertBefore(mobileList, table);
        } else {
            mobileList.innerHTML = '';
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            const card = document.createElement('div');
            card.className = 'mobile-card';

            // Header do card (primeira célula geralmente é o ID/Nome)
            const cardHeader = document.createElement('div');
            cardHeader.className = 'mobile-card-header';
            
            const title = document.createElement('div');
            title.className = 'mobile-card-title';
            title.textContent = cells[0]?.textContent.trim() || 'Item';
            
            cardHeader.appendChild(title);

            // Status badge se tiver
            const statusCell = Array.from(cells).find(cell => 
                cell.querySelector('.status-badge, .badge')
            );
            if (statusCell) {
                const statusClone = statusCell.cloneNode(true);
                statusClone.className = 'mobile-card-status';
                cardHeader.appendChild(statusClone);
            }

            card.appendChild(cardHeader);

            // Body do card
            const cardBody = document.createElement('div');
            cardBody.className = 'mobile-card-body';

            cells.forEach((cell, index) => {
                // Pular primeira célula (já usada no título) e ações
                if (index === 0 || cell.querySelector('.btn, button, a.action')) return;

                const rowDiv = document.createElement('div');
                rowDiv.className = 'mobile-card-row';

                const label = document.createElement('span');
                label.className = 'mobile-card-label';
                label.textContent = headers[index] || `Campo ${index}`;

                const value = document.createElement('span');
                value.className = 'mobile-card-value';
                value.textContent = cell.textContent.trim();

                rowDiv.appendChild(label);
                rowDiv.appendChild(value);
                cardBody.appendChild(rowDiv);
            });

            card.appendChild(cardBody);

            // Footer com ações
            const actionsCell = Array.from(cells).find(cell => 
                cell.querySelector('.btn, button, a.action')
            );
            
            if (actionsCell) {
                const cardFooter = document.createElement('div');
                cardFooter.className = 'mobile-card-footer';

                const buttons = actionsCell.querySelectorAll('.btn, button, a.action');
                buttons.forEach(btn => {
                    const mobileBtn = btn.cloneNode(true);
                    mobileBtn.className = 'mobile-card-button primary';
                    
                    // Identificar tipo de botão
                    const btnText = btn.textContent.toLowerCase();
                    if (btnText.includes('deletar') || btnText.includes('remover')) {
                        mobileBtn.className = 'mobile-card-button secondary';
                    }

                    cardFooter.appendChild(mobileBtn);
                });

                card.appendChild(cardFooter);
            }

            mobileList.appendChild(card);
        });

        // Reinicializar ícones Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função auxiliar para formatar data
function formatarData(data) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(data));
}

console.log('✅ Admin Mobile carregado!');
