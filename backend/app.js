require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { handlePdfReportRequest } = require('./utils/geradorPDF.js');
const { handleCsvReportRequest } = require('./utils/geradorCSV.js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não foram definidas.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Conexão com o Supabase configurada.');

function formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') return "";
    let valorStr = String(valor).trim().replace(/\.0$/, '');
    if (valorStr.startsWith('0') && valorStr.length > 1) {
        return valorStr.replace(/^0+/, '');
    }
    return valorStr;
}

// Rota de "Health Check"
app.get('/', (req, res) => {
    res.status(200).send('Servidor do Imobilizados-API está no ar!');
});

// Rota para buscar imobilizados
app.get('/api/imobilizado', async (req, res) => {
    const { codigo } = req.query;
    if (!codigo) {
        return res.status(400).json({ message: "Nenhum código foi fornecido." });
    }
    const codigoFormatado = formatarValor(codigo);
    try {
        const { data, error } = await supabase.from('imobilizados').select('*').eq(
            isNaN(parseInt(codigoFormatado, 10)) ? 'numero_serie' : 'codigo_inventario', 
            codigoFormatado
        );
        if (error) throw error;
        if (data && data.length > 0) {
            return res.status(200).json({ codigo_imobilizado: data[0].codigo_imobilizado, itens: data });
        }
        return res.status(404).json({ message: 'Imobilizado não encontrado.' });
    } catch (dbError) {
        return res.status(500).json({ message: `Erro no banco de dados: ${dbError.message}` });
    }
});

// Outras rotas da API
app.put('/api/imobilizado/update-inventory', async (req, res) => {
    // Sua lógica de atualização aqui
});
app.get('/api/report/pdf', handlePdfReportRequest);
app.get('/api/report/csv', handleCsvReportRequest);

// Servir os arquivos estáticos do Frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor com Express rodando na porta ${port}.`);
});