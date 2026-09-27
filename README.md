# Burger House

Sistema web de pedidos para hamburgueria, com cardápio, carrinho, painel administrativo e pagamento integrado.

## Funcionalidades

- Cardápio dinâmico com categorias e personalização de produtos
- Carrinho de compras
- Pagamento via Mercado Pago
- Painel administrativo (produtos, pedidos, banners promocionais)
- PWA (instalável, funciona offline)
- Atualização de pedidos em tempo real via WebSocket

## Tecnologias

- Node.js / Express
- EJS (views)
- Mercado Pago SDK
- WebSocket
- PWA (Service Worker)

## Como rodar

```bash
npm install
cp .env.example .env
# preencha as variáveis do .env
npm start
```

## Estrutura

```
controllers/   lógica das rotas
models/        modelos de dados
routes/        definição de rotas
views/         páginas EJS
public/        assets estáticos (css, js, imagens)
services/      integrações externas (pagamento)
utils/         utilitários (banco, cache, websocket)
```

## Licença

MIT
