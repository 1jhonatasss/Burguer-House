# 🍔 Burger House

Sistema web de pedidos para hamburgueria, com cardápio dinâmico, carrinho de compras, painel administrativo e pagamento integrado.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-A91E50?style=flat&logo=ejs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Sobre o projeto

O Burger House é um sistema completo de pedidos online, pensado para o dia a dia de uma hamburgueria: o cliente monta o pedido pelo cardápio, personaliza ingredientes, paga direto pelo site e o pedido chega em tempo real no painel administrativo.

## Funcionalidades

- 🍔 Cardápio dinâmico com categorias e personalização de ingredientes
- 🛒 Carrinho de compras
- 💳 Pagamento via Mercado Pago (Pix e cartão)
- 📊 Painel administrativo — produtos, pedidos e banners promocionais
- 🔄 Atualização de pedidos em tempo real via WebSocket
- 📱 PWA — instalável e funciona offline

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Node.js, Express |
| Views | EJS |
| Banco de dados | MySQL |
| Pagamento | Mercado Pago SDK |
| Tempo real | WebSocket |
| Offline / instalável | PWA (Service Worker) |

## Pré-requisitos

- Node.js 18 ou superior
- Um banco de dados MySQL acessível
- Conta no Mercado Pago (para gerar as chaves de pagamento)

## Como rodar

```bash
# Clonar o repositório
git clone https://github.com/1jhonatasss/burger-house.git
cd burger-house

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# preencha as variáveis do .env com seus dados de banco e Mercado Pago

# Rodar em modo desenvolvimento (reinicia automaticamente)
npm run dev

# Ou rodar em modo produção
npm start
```

O projeto sobe por padrão em `http://localhost:3000`.

## Estrutura do projeto

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

Este projeto está sob a licença MIT — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## Autor

Desenvolvido por **Jhonatas Araujo**
[GitHub](https://github.com/1jhonatasss)