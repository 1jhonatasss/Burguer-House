// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const MemoryStore = require('memorystore')(session);
const compression = require('compression'); // ✅ GZIP
const app = express();

// ✅ GZIP - Comprime todas as respostas (reduz ~70% do tamanho)
app.use(compression({
  level: 6, // Nível de compressão (1-9, 6 é bom equilíbrio)
  threshold: 1024, // Só comprime arquivos > 1KB
  filter: (req, res) => {
    // Comprime tudo exceto imagens (já são comprimidas)
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// PWA Routes
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// API Limpar Carrinho
app.post('/api/carrinho/limpar', (req, res) => {
  req.session.carrinho = [];
  req.session.pedidoPendente = null;
  res.json({ ok: true, msg: 'Carrinho limpo' });
});

const fileUpload = require('express-fileupload');

// ✅ CONFIGURAÇÃO DE VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ MIDDLEWARES PRINCIPAIS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    parameterLimit: 50000 
}));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    createParentPath: true,
    parseNested: true,
    useTempFiles: false
}));

// ✅ STATIC FILES COM CACHE OTIMIZADO
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // CSS e JS - Cache de 7 dias
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 dias
    }
    // Imagens - Cache de 30 dias
    if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 dias
    }
    // Fontes - Cache de 1 ano
    if (/\.(woff|woff2|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
    }
  }
}));

// ✅ SESSÃO
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || 'burger-house-secret-2025',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  }
}));

// ✅ ROTAS
const lanchesRoutes = require('./routes/lanchesRoute');
const adminRoutes = require('./routes/adminRoute');
const bannerRoutes = require('./routes/bannerRoute');
const pagamentoRoutes = require('./routes/pagamentoRoute');

app.use('/cardapio', lanchesRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/banners', bannerRoutes);
app.use('/pagamento', pagamentoRoutes);

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    session: req.sessionID,
    carrinho: req.session.carrinho || [],
    gzip: 'ativo',
    mercadoPago: {
      configured: !!process.env.MP_ACCESS_TOKEN_PROD,
      environment: process.env.NODE_ENV || 'development',
      publicKey: process.env.MP_PUBLIC_KEY ? 'Configurada' : 'Não configurada'
    }
  });
});

// ✅ ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.render('telaInicial');
});

// ✅ INICIAR SERVIDOR
const PORT = parseInt(process.env.PORT || 3000, 10);

// Só roda servidor local fora da Vercel
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🍔 Servidor rodando na porta ${PORT}`);
  });
  
  // WebSocket só funciona localmente
  try {
    const WebSocketManager = require('./utils/WebSocketManager');
    WebSocketManager.init(server);
  } catch (err) {
    console.warn('WebSocket não iniciado:', err.message);
  }
}

module.exports = app;