# Sistema de Consulta e Inventário de Imobilizados

## Sumário

Este é um sistema web full-stack desenvolvido pela **Videplast Rio Verde** com o objetivo de modernizar e otimizar o processo de consulta e inventário de ativos imobilizados. A aplicação permite a busca detalhada de itens, um modo de inventário robusto com escaneamento de códigos e a geração de relatórios completos, tanto no cliente quanto no servidor.

A interface é responsiva e projetada para ser utilizada tanto em desktops quanto em dispositivos móveis e leitores de código de barras.

-----

## Funcionalidades Principais

  - **Consulta de Ativos**: Busca unificada que permite encontrar ativos por código do imobilizado, número de inventário ou número de série.
  - **Visualização Detalhada**: Exibe todas as informações relevantes de um ativo, como data de incorporação, centro de custo, descrição completa e inventário antigo.
  - **Edição de Inventário**: Permite que usuários atualizem o número de inventário de um ativo diretamente pela interface.
  - **Modo de Inventário Inteligente**:
      - Inicia uma sessão de inventário por **Centro de Custo**, carregando todos os itens esperados.
      - Suporte a **escaneamento em lote** para adição rápida de itens.
      - **Tratamento de Itens Não Cadastrados**: Se um item escaneado não for encontrado no banco de dados, o sistema permite que o usuário o adicione manualmente com uma descrição.
      - **Persistência de Sessão**: O inventário em andamento é salvo no `sessionStorage`, permitindo que o usuário recarregue a página sem perder o progresso.
  - **Geração de Relatórios**:
      - **Relatório de Divergências (Frontend)**: Ao finalizar um inventário, um relatório detalhado é gerado na tela, classificando os itens em "Corretos", "Faltantes", "Centro de Custo Errado" e "Não Cadastrados". Este relatório pode ser exportado como **PDF** ou **CSV**.
      - **Relatório Geral de Ativos (Backend)**: Permite gerar um relatório completo em **PDF** ou **CSV** de todos os ativos de um Centro de Custo específico, com um layout profissional e o logo da empresa. Este relatório é gerado no servidor.
  - **Progressive Web App (PWA)**: A aplicação pode ser "instalada" em dispositivos móveis e desktops para uma experiência de uso mais próxima a um aplicativo nativo.

-----

## Tecnologias Utilizadas

### Frontend

  - **Framework**: React 19 com Vite
  - **UI Kit**: React-Bootstrap
  - **Requisições HTTP**: Axios
  - **Geração de PDF (Client-side)**: jsPDF & jspdf-autotable
  - **PWA**: vite-plugin-pwa

### Backend

  - **Ambiente**: Node.js
  - **Framework**: Express.js
  - **Banco de Dados**: Supabase (PostgreSQL)
  - **Geração de PDF (Server-side)**: PDFKit
  - **Variáveis de Ambiente**: dotenv

-----

A aplicação estará acessível em `https://imobilizados-app.onrender.com`.

-----

## Deploy

O projeto inclui um script `build.sh` que automatiza o processo de build para ambas as partes da aplicação. O servidor Express está configurado para servir os arquivos estáticos do frontend após o build, tornando-o pronto para o deploy em plataformas como Render, Vercel ou Heroku.