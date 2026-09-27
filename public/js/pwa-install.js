// ============================================
// PWA INSTALL - ADICIONAR NO <HEAD> DAS PÁGINAS
// ============================================

let deferredPrompt;
let installButton;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Erro ao registrar Service Worker:', error);
      });
  });
}

// Capturar evento de instalação
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA pode ser instalado!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botão de instalação (se existir)
  installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', installPWA);
  }
});

// Função para instalar PWA
function installPWA() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ Usuário aceitou instalar o PWA');
    } else {
      console.log('❌ Usuário recusou instalar o PWA');
    }
    deferredPrompt = null;
    if (installButton) installButton.style.display = 'none';
  });
}

// Detectar quando já está instalado
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA instalado com sucesso!');
  if (installButton) installButton.style.display = 'none';
  deferredPrompt = null;
});

// ============================================
// MODO TOTEM - PREVENIR SAÍDA ACIDENTAL
// ============================================

// Desabilitar menu de contexto (botão direito)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Desabilitar atalhos de teclado perigosos
document.addEventListener('keydown', (e) => {
  // Bloquear F11 (fullscreen), Ctrl+W (fechar), Alt+F4, etc
  if (
    e.key === 'F11' ||
    (e.ctrlKey && e.key === 'w') ||
    (e.altKey && e.key === 'F4') ||
    (e.ctrlKey && e.key === 'q')
  ) {
    e.preventDefault();
    console.log('⚠️ Atalho bloqueado:', e.key);
  }
});

// Prevenir zoom com Ctrl + ou Ctrl -
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Desabilitar seleção de texto (modo totem)
document.body.style.userSelect = 'none';
document.body.style.webkitUserSelect = 'none';

// Resetar sessão após inatividade (5 minutos)
let inactivityTimer;
const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutos

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    console.log('⏰ Sessão expirada por inatividade');
    // Limpar carrinho e voltar ao início
    fetch('/api/carrinho/limpar', { method: 'POST' })
      .then(() => {
        window.location.href = '/cardapio';
      });
  }, INACTIVITY_TIME);
}

// Detectar atividade do usuário
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
  document.addEventListener(event, resetInactivityTimer, true);
});

// Iniciar timer
resetInactivityTimer();

console.log('🍔 Burger House Totem carregado!');