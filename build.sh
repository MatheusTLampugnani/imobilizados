set -o errexit

echo "Instalando dependências e buildando o frontend..."
npm install --prefix frontend
npm audit fix --force --prefix frontend
npm run build --prefix frontend

echo "Instalando as dependências do backend..."
npm install --prefix backend
npm audit fix --force --prefix backend


echo "Build finalizado com sucesso!"