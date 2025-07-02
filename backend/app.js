require('dotenv').config();
const express = require('express'); // Usa o framework Express
const cors = require('cors');       // Usa o middleware de CORS
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { handlePdfReportRequest } = require('./utils/geradorPDF.js');
const { handleCsvReportRequest } = require('./utils/geradorCSV.js');

// --- Configuração do Express ---
const app = express();
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.json()); // Permite que o servidor entenda JSON

// --- Conexão com o Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não foram definidas.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Conexão com o Supabase configurada.');

// --- Funções Auxiliares ---
function formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') return "";
    let valorStr = String(valor).trim().replace(/\.0$/, '');
    if (valorStr.startsWith('0') && valorStr.length > 1) {
        return valorStr.replace(/^0+/, '');
    }
    return valorStr;
}

// --- Definição das Rotas da API ---

// Rota de "Health Check" para testar se o servidor está no ar
app.get('/', (req, res) => {
    res.status(200).send('Servidor do Imobilizados-API está no ar!');
});

// Rota para buscar imobilizados
app.get('/api/imobilizado', async (req, res) => {
    const { codigo } = req.query;
    const codigoFormatado = formatarValor(codigo);

    if (!codigoFormatado) {
        return res.status(400).json({ message: "Nenhum código foi fornecido." });
    }

    try {
        let itensEncontrados = null;
        const { data } = await supabase.from('imobilizados').select('*').eq(
            isNaN(parseInt(codigoFormatado, 10)) ? 'numero_serie' : 'codigo_inventario', 
            codigoFormatado
        );
        itensEncontrados = data;
        
        // Lógica de fallback se necessário...

        if (itensEncontrados && itensEncontrados.length > 0) {
            const imobilizadoPrincipalCodigo = itensEncontrados[0].codigo_imobilizado;
            const responseData = {
                codigo_imobilizado: imobilizadoPrincipalCodigo,
                itens: itensEncontrados.map(item => ({
                    id: item.id, "Subnº": item.sub_numero, "Data": item.data_incorporacao,
                    "Descrição": item.descricao, "Inventário": item.codigo_inventario,
                    "Inventário_Antigo": item.codigo_inventario_antigo, "Série": item.numero_serie,
                    "CentroCusto": item.centro_custo,
                }))
            };
            return res.status(200).json(responseData);
        } else {
            return res.status(404).json({ message: 'Imobilizado, Inventário ou Nº de Série não encontrado' });
        }
    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---', dbError);
        return res.status(500).json({ message: `Erro no banco de dados: ${dbError.message}` });
    }
});

// Rota para atualizar o inventário
app.put('/api/imobilizado/update-inventory', async (req, res) => {
    try {
        const { itemId, newInventoryCode } = req.body;
        const newCodeNumeric = parseInt(newInventoryCode, 10);
        if (!itemId || isNaN(newCodeNumeric)) {
            return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
        }
        const { data: currentItem, error: fetchError } = await supabase.from('imobilizados').select('codigo_inventario').eq('id', itemId).single();
        if (fetchError) throw fetchError;
        const { error: updateError } = await supabase.from('imobilizados').update({ codigo_inventario: newCodeNumeric, codigo_inventario_antigo: currentItem.codigo_inventario }).eq('id', itemId);
        if (updateError) throw updateError;
        res.status(200).json({ message: 'Inventário atualizado com sucesso!' });
    } catch (error) {
        console.error("ERRO AO ATUALIZAR INVENTÁRIO: ", error);
        res.status(500).json({ message: `Erro no servidor: ${error.message}` });
    }
});

// Rotas para relatórios
app.get('/api/report/pdf', handlePdfReportRequest);
app.get('/api/report/csv', handleCsvReportRequest);

// --- Servir os arquivos estáticos do Frontend ---
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// --- Iniciar o Servidor ---
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor com Express rodando na porta ${port}.`);
});