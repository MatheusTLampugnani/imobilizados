# Consulta de Imobilizados - Videplast

Este projeto é uma aplicação web para consultar informações de imobilizados, utilizando um backend em Python (Flask) e um frontend em React (Vite).

## Visão Geral da Arquitetura

- **Backend**: Uma API REST simples construída com **Flask** que serve os dados a partir de um arquivo `dados_imobilizados.json`.
- **Frontend**: Uma aplicação de página única (SPA) construída com **React** e estilizada com **React-Bootstrap** para uma interface moderna e responsiva.

---

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados:

- **Node.js**: Versão 18.x ou superior. (Vem com o gerenciador de pacotes `npm`).
- **Python**: Versão 3.8 ou superior.
- **Git** (Opcional): Para clonar o repositório.

---

## Como Rodar a Aplicação

Para executar a aplicação, você precisará iniciar o **servidor do backend** e o **servidor do frontend** separadamente, em dois terminais diferentes.

### 1. Configuração do Backend (Servidor de API)

O backend é responsável por fornecer os dados para o frontend.

1.  **Navegue até a pasta do backend:**
    ```bash
    cd /caminho/para/o/projeto/backend
    ```

2.  **Crie e ative um ambiente virtual:**
    - No macOS/Linux:
      ```bash
      python3 -m venv venv
      source venv/bin/activate
      ```
    - No Windows:
      ```bash
      python -m venv venv
      .\venv\Scripts\activate
      ```

3.  **Instale as dependências Python:**
    ```bash
    pip install -r requirements.txt
    ```
    *Certifique-se de que o arquivo `dados_imobilizados.json` está presente na pasta `backend`.*

4.  **Inicie o servidor Flask:**
    ```bash
    flask run
    ```

O servidor do backend estará rodando em `http://127.0.0.1:5000`. **Mantenha este terminal aberto.**

---

### 2. Configuração do Frontend (Interface do Usuário)

O frontend é a interface com a qual o usuário interage.

1.  **Abra um novo terminal.**

2.  **Navegue até a pasta do frontend:**
    ```bash
    cd /caminho/para/o/projeto/frontend
    ```

3.  **Instale as dependências do Node.js:**
    ```bash
    npm install
    ```

4.  **Inicie o servidor de desenvolvimento do Vite:**
    ```bash
    npm run dev
    ```

O servidor do frontend estará rodando em `http://localhost:5173` (ou outra porta indicada no terminal).

5.  **Acesse a aplicação:**
    Abra seu navegador e acesse o endereço fornecido pelo terminal do frontend (ex: `http://localhost:5173`).

---

## O que esperar?

- O **Terminal 1** (backend) mostrará logs de requisições da API, como `GET /api/imobilizado/20000076 HTTP/1.1" 200 -`.
- O **Terminal 2** (frontend) mostrará o status do servidor de desenvolvimento Vite.
- No navegador, a aplicação deve carregar e estar pronta para uso.

## Para parar a aplicação

- Em cada um dos terminais, pressione `Ctrl + C`.
- Para desativar o ambiente virtual do Python (no terminal do backend), simplesmente digite `deactivate`.
