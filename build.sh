#!/usr/bin/env bash
# exit on error
set -o errexit

# Instala e constrói o Frontend
cd frontend
npm install
npm run build
cd ..

# Instala as dependências do Backend
cd backend
npm install