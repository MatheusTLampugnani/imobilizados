require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Rotas por domínio
const authRoutes = require('./routes/auth.routes');
const { imobilizadosRouter, handleInventoryItem } = require('./routes/imobilizados.routes');
const centroCustoRoutes = require('./routes/centro-custo.routes');
const cadastradosRoutes = require('./routes/cadastrados.routes');
const logsRoutes = require('./routes/logs.routes');
const relatoriosRoutes = require('./routes/relatorios.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api', (req, res) => res.status(200).send('Servidor do Imobilizados-API está no ar!'));

// Registro de rotas
app.use('/api', authRoutes);
app.use('/api/imobilizado', imobilizadosRouter);
app.get('/api/inventory-item', handleInventoryItem);
app.use('/api/centro-custo', centroCustoRoutes);
app.use('/api/imobilizados-cadastrados', cadastradosRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/report', relatoriosRoutes);

// Serve frontend estático (produção)
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'), err => {
        if (err) res.status(500).send(err);
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));