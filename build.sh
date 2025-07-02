#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Iniciando o build..."

# Instala e constrói o Frontend
echo "Construindo o frontend..."
cd frontend
npm install
npm run build
cd ..

# Instala as dependências do Backend com Clean Install
echo "Instalando dependências do backend..."
cd backend
npm ci

echo "Build concluído com sucesso!"