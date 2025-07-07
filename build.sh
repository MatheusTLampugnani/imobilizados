set -o errexit

# --- Build do Frontend ---
echo "Instalando dependências e buildando o frontend..."
npm install --prefix frontend
npm run build --prefix frontend

# --- Build do Backend ---
echo "Instalando as dependências do backend..."
npm install --prefix backend

echo "Build finalizado com sucesso!"