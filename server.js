if (!process.env.VERCEL) {
  require('dotenv').config();
}

const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const compression = require('compression');
const app = express();

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.post('/api/carrinho/limpar', (req, res) => {
  req.session.carrinho = [];
  req.session.pedidoPendente = null;
  res.json({ ok: true, msg: 'Carrinho limpo' });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 50000
}));

app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
    if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
    if (/\.(woff|woff2|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

app.use(cookieSession({
  name: 'burger-house-session',
  keys: [process.env.SESSION_SECRET || 'burger-house-secret-2025'],
  maxAge: 1000 * 60 * 60 * 24,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}));

const lanchesRoutes = require('./routes/lanchesRoute');
const adminRoutes = require('./routes/adminRoute');
const bannerRoutes = require('./routes/bannerRoute');
const pagamentoRoutes = require('./routes/pagamentoRoute');

app.use('/cardapio', lanchesRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/banners', bannerRoutes);
app.use('/pagamento', pagamentoRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    naVercel: !!process.env.VERCEL,
    gzip: 'ativo',
    mercadoPago: {
      configured: !!process.env.MP_ACCESS_TOKEN_PROD,
      environment: process.env.NODE_ENV || 'development',
      publicKey: process.env.MP_PUBLIC_KEY ? 'Configurada' : 'Não configurada'
    }
  });
});

app.get('/', (req, res) => {
  res.render('telaInicial');
});

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

const PORT = parseInt(process.env.PORT || 3000, 10);

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🍔 Servidor rodando na porta ${PORT}`);
  });

  try {
    const WebSocketManager = require('./utils/WebSocketManager');
    WebSocketManager.init(server);
  } catch (err) {
    console.warn('WebSocket não iniciado:', err.message);
  }
}

module.exports = app;