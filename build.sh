set -o errexit

# --- Build do Frontend ---
echo "Instalando dependências e buildando o frontend"
npm install --prefix src/frontend
npm run build --prefix src/frontend

# --- Build do Backend ---
echo "Instalando dependências do backend"
npm install --prefix src/backend

echo "Build finalizado com sucesso"