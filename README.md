# 📦 Sistema de Consulta e Inventário de Imobilizados — Videplast

> **Versão:** 2.0 — Arquitetura Modular Monolith, Validação com Zod e Desacoplamento Full-Stack  
> **Status:** Em Produção  
> **Classificação:** Interno — Videplast Rio Verde  

---

## 📋 Sumário

1. [Visão Geral](#-visão-geral)
2. [O que Há de Novo nesta Versão (Changelog & Melhorias)](#-o-que-há-de-novo-nesta-versão)
3. [Métricas de Refatoração (Antes vs Depois)](#-métricas-de-refatoração)
4. [Arquitetura do Sistema](#-arquitetura-do-sistema)
5. [Módulos do Sistema](#-módulos-do-sistema)
6. [Estrutura de Pastas](#-estrutura-de-pastas)
7. [Instalação e Configuração Local](#-instalação-e-configuração-local)
8. [Deploy e Produção](#-deploy-e-produção)

---

## 🎯 Visão Geral

O **Sistema de Consulta e Inventário de Imobilizados** é uma aplicação web full-stack desenvolvida sob medida para a **Videplast**, com foco em modernizar, agilizar e auditar o controle físico e contábil de ativos imobilizados industriais.

### Principais Capacidades:
* **Consulta Rápida de Ativos:** Busca unificada por código do imobilizado, plaqueta de inventário, número de série ou descrição completa.
* **Inventário Inteligente por Centro de Custo:** Sessões de conferência em tempo real com carregamento do estoque previsto e suporte a bipagem via leitor físico USB ou câmera.
* **Conciliação e Divergências:** Classificação automática dos itens em *Corretos*, *Faltantes*, *Centro de Custo Errado* e *Não Cadastrados*.
* **Auditoria Completa de Alterações:** Rastreabilidade detalhada de movimentações de local, alterações de plaqueta e transferências de centro de custo com registro de crachá e timestamp.
* **Exportação Multi-formato:** Geração de relatórios consolidados em **PDF**, **Excel (.xlsx)** e **CSV**.
* **Progressive Web App (PWA):** Suporte à instalação em celulares, tablets e coletores de dados de galpão.

---

## 🚀 O que Há de Novo nesta Versão

### 1. 🏛️ Arquitetura Modular Monolith no Backend
* O backend Express legava toda a lógica de negócio, rotas e acesso ao banco em um único arquivo monolítico (`app.js` com mais de 700 linhas).
* O sistema foi completamente reorganizado em **módulos independentes por domínio** (`modules/`), com barreiras de isolamento rígidas e contratos públicos (*Public Barrels* via `index.js`).
* As rotas HTTP em `routes/` foram convertidas em controladores finos, delegando a regra de negócio para os serviços do domínio.

### 2. 🛡️ Validação Estrita de Entrada com Zod
* Todos os endpoints agora passam por validação declarativa de payloads (`req.body`, `req.query`, `req.params`) com esquemas **Zod**.
* Tratamento centralizado de erros de validação com o helper `getZodErrorMessage`, compatível tanto com o padrão clássico quanto com a especificação mais recente (Zod 4 / `error.issues`).
* Eliminação de entradas mal formatadas e proteção contra injeções ou falhas silenciosas de dados.

### 3. 🔌 Conexão Unificada com Supabase
* Anteriormente, múltiplos arquivos (`app.js`, `geradorPDF.js`, `geradorCSV.js`) criavam instâncias isoladas do cliente Supabase.
* Implementada a camada singleton [`lib/supabase.js`](file:///backend/lib/supabase.js), unificando conexões, controle de ciclo de vida e sanitização de credenciais de ambiente.

### 4. ⚛️ Desacoplamento do Frontend com Custom Hooks
* O componente principal [`App.jsx`](file:///frontend/src/App.jsx) concentrava mais de 525 linhas misturando estado de autenticação, lógica de busca e máquina de estados de inventário.
* Extraídos três hooks de domínio isolados e reutilizáveis:
  * `useAuth`: Autenticação por crachá, permissões e persistência de sessão em `sessionStorage`.
  * `useImobilizados`: Busca unificada, ordenação e filtros dinâmicos de ativos.
  * `useInventario`: Ciclo de vida da contagem, conferência de divergências e persistência local.

### 5. 🌐 Centralização de API e Proxy no Vite
* Criação de cliente centralizado [`frontend/src/lib/api.js`](file:///frontend/src/lib/api.js) com Axios configurado.
* Configuração de proxy reverso em desenvolvimento no [`vite.config.js`](file:///frontend/vite.config.js), eliminando dependências rígidas de portas e erros de CORS.
* Correção e aperfeiçoamento da centralização visual da tela de login.

### 6. ⚙️ Padronização de Variáveis de Ambiente
* Criação de [`.env.example`](file:///backend/.env.example) no backend com documentação de chaves necessárias.
* Validação automática de presença de credenciais na inicialização com saída amigável de logs.

---

## 📊 Métricas de Refatoração

| Indicador | Antes | Nova Versão (2.0) | Impacto |
| :--- | :---: | :---: | :---: |
| **Linhas em `app.js`** | 705 linhas | **40 linhas** | **-94%** de redução |
| **Linhas em `App.jsx`** | 525 linhas | **175 linhas** | **-66%** de redução |
| **Instâncias do Supabase** | 3 independentes | **1 instância única** | Zero vazamento de conexões |
| **Validação de Rotas** | Manual / Incompleta | **100% via Zod** | Tipagem e segurança estrita |
| **Organização do Domínio** | Disperso | **8 Módulos Isolados** | Alta manutenibilidade |

---

## 🏛️ Arquitetura do Sistema

```
                             ┌───────────────────────────────┐
                             │       Navegador / PWA         │
                             │  (React 19 + Vite + Bootstrap)│
                             └──────────────┬────────────────┘
                                            │ HTTP / JSON
                                            ▼
                             ┌───────────────────────────────┐
                             │    Backend Express (Node.js)  │
                             │         (app.js - 40 linhas)  │
                             └──────────────┬────────────────┘
                                            │ Rotas Finas
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          ┌─────────────────────┐                       ┌─────────────────────┐
          │   Camada de Rotas   │                       │  Validação com Zod  │
          │     (routes/*.js)   │ ──(valida entrada)──► │  (modules/*/schemas)│
          └──────────┬──────────┘                       └─────────────────────┘
                     │ Executa negócio
                     ▼
          ┌─────────────────────┐
          │  Serviços de Domínio│
          │ (modules/*/services)│
          └──────────┬──────────┘
                     │ Consulta / Persiste
                     ▼
          ┌─────────────────────┐
          │    lib/supabase.js  │ ◄─── Conexão Singleton
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ Supabase PostgreSQL │
          │   (BaaS na Nuvem)   │
          └─────────────────────┘
```

---

## 📦 Módulos do Sistema

### Backend (`backend/modules/`)

| Domínio | Responsabilidade |
| :--- | :--- |
| **`auth/`** | Validação de crachá corporativo, verificação de autorização e nível administrativo. |
| **`imobilizados/`** | Busca unificada de ativos, filtros por filial/unidade, edição de inventário, centro de custo e plaqueta. |
| **`centro-custo/`** | Validação de centros de custo e busca de setores correspondentes. |
| **`imobilizados-cadastrados/`** | Gestão e listagem de itens cadastrados manualmente e controle de itens baixados. |
| **`logs/`** | Registro e auditoria de alterações de dados com histórico de operador e lote de verificação. |
| **`relatorios/`** | Emissão de relatórios em PDF (PDFKit/pdfmake), Excel (.xlsx via ExcelJS) e CSV com formatação brasileira. |
| **`shared/`** | Utilitários transversais de formatação numérica e tratamento unificado de erros de validação Zod. |

### Frontend (`frontend/src/modules/`)

| Módulo | Hook Principal | Responsabilidade |
| :--- | :--- | :--- |
| **`auth/`** | `useAuth()` | Gerencia autenticação, autorização de administrador e persistência de sessão. |
| **`imobilizados/`** | `useImobilizados()` | Orquestra consultas de ativos, ordenação multi-coluna e filtros avançados. |
| **`inventario/`** | `useInventario()` | Gerencia o ciclo da contagem física, conferência de itens esperados e divergências. |

---

## 📂 Estrutura de Pastas

```
imobilizados/
├── backend/
│   ├── assets/                      # Imagens e logos para relatórios (PDF)
│   ├── lib/
│   │   └── supabase.js              # Conexão singleton com Supabase
│   ├── modules/                     # Domínios de negócio (Modular Monolith)
│   │   ├── auth/                    # Schemas e serviços de autenticação
│   │   ├── centro-custo/            # Validação de centros de custo
│   │   ├── imobilizados/            # Regras principais de ativos
│   │   ├── imobilizados-cadastrados/# Gestão de novos cadastros e baixas
│   │   ├── logs/                    # Histórico e auditoria
│   │   ├── relatorios/              # Geradores de PDF, Excel e CSV
│   │   └── shared/                  # Utilitários compartilhados
│   ├── routes/                      # Route handlers finos do Express
│   │   ├── auth.routes.js
│   │   ├── cadastrados.routes.js
│   │   ├── centro-custo.routes.js
│   │   ├── imobilizados.routes.js
│   │   ├── logs.routes.js
│   │   └── relatorios.routes.js
│   ├── app.js                       # Entry point do servidor Express (limpo)
│   ├── package.json
│   └── .env.example                 # Exemplo de configuração de ambiente
│
├── frontend/
│   ├── public/                      # Ícones e manifest PWA
│   ├── src/
│   │   ├── assets/                  # Logos institucionais Videplast
│   │   ├── components/              # Componentes de interface React
│   │   ├── lib/
│   │   │   └── api.js               # Cliente Axios centralizado
│   │   ├── modules/                 # Hooks de domínio
│   │   │   ├── auth/hooks/
│   │   │   ├── imobilizados/hooks/
│   │   │   └── inventario/hooks/
│   │   ├── App.css                  # Estilos globais e animações
│   │   ├── App.jsx                  # Orquestrador da aplicação
│   │   ├── index.css                # Reset e estilos base
│   │   └── main.jsx                 # Bootstrap React
│   ├── vite.config.js               # Configuração do Vite + PWA + Proxy
│   └── package.json
│
├── .gitignore                       # Proteção de credenciais e dependências
├── build.sh                         # Script de automação de build para deploy
└── README.md                        # Esta documentação
```

---

## 💻 Instalação e Configuração Local

### Pré-requisitos
* **Node.js**: v18+ ou v20+
* **NPM**: v9+
* Conexão com a internet para sincronização com o **Supabase**.

### 1. Clonar o Repositório
```bash
git clone https://github.com/MatheusTLampugnani/imobilizados.git
cd imobilizados
```

### 2. Configurar o Ambiente do Backend
Crie um arquivo `.env` dentro da pasta `backend/` a partir do modelo:
```bash
cp backend/.env.example backend/.env
```
Preencha as variáveis de ambiente:
```env
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-aqui
```

### 3. Instalar Dependências
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Executar em Desenvolvimento

**No Windows PowerShell:**
```powershell
# Terminal 1 — Backend (Porta 3001)
cd backend; npm run dev

# Terminal 2 — Frontend (Porta 5173 com proxy para 3001)
cd frontend; npm run dev
```

**No Linux / Mac / Bash:**
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Acesse no navegador: **`http://localhost:5173`**

---

## 🚢 Deploy e Produção

O projeto conta com o script automatizado [`build.sh`](file:///build.sh) pronto para plataformas de hospedagem em nuvem (Render, Vercel, Railway, etc.):

```bash
chmod +x build.sh
./build.sh
```

No ambiente de produção, o servidor Express atua como servidor completo, servindo os arquivos estáticos compilados do frontend localizados em `frontend/dist/` e expondo todos os endpoints sob `/api`.

---

© 2026 **TI Infraestrutura — Videplast Indústria de Embalagens Ltda.**  
Todos os direitos reservados. Uso restrito e interno.