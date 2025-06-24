# 📦 Sistema de Consulta e Inventário de Imobilizados

Este projeto é uma aplicação web completa desenvolvida, com o objetivo de facilitar a **consulta e o inventário de ativos imobilizados**. A solução possui frontend em **React** e backend em **Node.js**, utilizando o **Supabase** como banco de dados.

O sistema é **responsivo** e otimizado para dispositivos móveis, permitindo inclusive o **escaneamento de QR Codes e codigos de barras** diretamente por um aparelho leitor.

---

## Funcionalidades Principais

- **Consulta de Ativos**
  - Busca por Código do Imobilizado, Código de Inventário ou Número de Série.

- **Leitor de QR Code e codigo de barras**
  - Escaneamento via aparelho leitor que preenche automaticamente o campo de busca.

- **Visualização Detalhada**
  - Informações exibidas em formato de acordeão para melhor organização.

- **Modo Inventário**
  - Registro de múltiplos ativos em uma sessão de inventário.
  - Itens adicionados são salvos localmente (via `localStorage`).
  - Continuação da sessão mesmo após fechar a página.
  - Exportação da lista de inventário em **CSV**.

---

## Tecnologias Utilizadas

### Backend

- [Node.js](https://nodejs.org/)
- [Supabase](https://supabase.io/)
- [dotenv](https://www.npmjs.com/package/dotenv)

### Frontend

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [React-Bootstrap](https://react-bootstrap.github.io/)
- [Axios](https://axios-http.com/)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

## Configuração e Instalação

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Conta no [Supabase](https://supabase.io/) com uma tabela chamada `imobilizados`
- URL e chave `anon` (public) do projeto Supabase

---

### 1. Clonar o Repositório

```bash
git clone <https://github.com/MatheusTLampugnani/imobilizados>
cd imobilizados
```

---

### 2. Configuração do Backend

```bash
# Navegue até a pasta do backend
cd backend

# Instale as dependências
npm install
```

# Crie o arquivo de variáveis de ambiente
**Conteúdo do arquivo `.env`:**

```
SUPABASE_URL=SEU_URL_DO_SUPABASE
SUPABASE_KEY=SUA_CHAVE_ANON_DO_SUPABASE
```

> A chave utilizada deve ser a **anon (public)** key do Supabase.

---

### 3. Configuração do Frontend

```bash
# Navegue até a pasta do frontend
cd ../frontend

# Instale as dependências
npm install
```

---

## Executando o Projeto

### 1. Iniciar o Backend

```bash
cd backend
node app.js
```

> O servidor estará disponível em: [http://localhost:5000](http://localhost:5000)

---

### 2. Iniciar o Frontend

```bash
cd frontend
npm run dev
```

> A aplicação estará acessível em: [http://localhost:5173](http://localhost:5173)