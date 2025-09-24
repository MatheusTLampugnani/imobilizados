set -o errexit

echo "Instalando dependências e buildando o frontend..."
npm install --prefix frontend
echo "Executando auditoria de segurança no frontend..."
npm audit --prefix frontend

npm run build --prefix frontend

echo "Instalando as dependências do backend..."
npm install --prefix backend
echo "Executando auditoria de segurança no backend..."
npm audit --prefix backend

echo "Build finalizado com sucesso!"