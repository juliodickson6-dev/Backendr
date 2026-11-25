# AJOV-SISTEMA — Ficha de Cadastro

Sistema de recepção e gestão de fichas de cadastro da Associação dos Jovens Voluntários (AJOV). O layout e os campos da ficha foram mantidos; os ficheiros foram separados e organizados por responsabilidade.

## Estrutura

- `frontend/` — página, estilos, JavaScript, configuração pública da API e imagem AJOV.
- `backend/` — API Express, PostgreSQL, controllers, rotas, serviços, scripts e testes.
- `netlify.toml` — configuração opcional de publicação do frontend no Netlify.
- `README.md` — instruções gerais.

## Desenvolvimento local

1. Instale Node.js 22 ou superior.
2. Configure o backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
3. Edite `backend/.env` com os dados da sua base PostgreSQL e, opcionalmente, email e token administrativo.
4. Inicie o backend:
   ```bash
   npm start
   ```
5. Sirva `frontend/` com um servidor web local (não abra o HTML directamente como `file://`). Por exemplo, com Python:
   ```bash
   cd frontend
   python -m http.server 5500
   ```
6. Aceda a `http://localhost:5500`. Em ambiente local, o frontend aponta automaticamente para `http://localhost:3000`.

## Publicação

O frontend está publicado no Cloudflare Workers e pode também ser publicado no Netlify, com `frontend` como diretório de publicação. O backend é publicado separadamente como Web Service Node (ex.: Render) e utiliza PostgreSQL. **Antes de publicar, altere `frontend/js/config.js` para o URL real do backend e configure as variáveis de ambiente no serviço do backend.**

Consulte `PUBLICACAO_AJOV.md` para o procedimento detalhado.
