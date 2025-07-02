require('dotenv').config();
const http = require('http' );
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');

const { handlePdfReportRequest } = require('./utils/geradorPDF.js');
const { handleCsvReportRequest } = require('./utils/geradorCSV.js');

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

async function handleApiRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { codigo } = parsedUrl.query;
    const codigoFormatado = formatarValor(codigo);

    if (!codigoFormatado) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "Nenhum código foi fornecido." }));
    }

    const searchByField = async (field, value) => {
        const { data, error } = await supabase.from('imobilizados').select('*').eq(field, value);
        if (error) throw error;
        return data;
    };

    try {
        let itensEncontrados = await searchByField('codigo_inventario', codigoFormatado);
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('numero_serie', codigoFormatado);
        }
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('codigo_imobilizado', codigoFormatado);
        }
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('centro_custo', codigoFormatado);
        }

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
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(responseData));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Imobilizado, Inventário ou Nº de Série não encontrado' }));
        }
    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
}

async function handleUpdateInventoryRequest(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
        try {
            const { itemId, newInventoryCode } = JSON.parse(body);
            const newCodeNumeric = parseInt(newInventoryCode, 10);
            if (!itemId || isNaN(newCodeNumeric)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Dados inválidos fornecidos.' }));
            }
            const { data: currentItem, error: fetchError } = await supabase.from('imobilizados').select('codigo_inventario').eq('id', itemId).single();
            if (fetchError) throw fetchError;
            const { error: updateError } = await supabase.from('imobilizados').update({ codigo_inventario: newCodeNumeric, codigo_inventario_antigo: currentItem.codigo_inventario }).eq('id', itemId);
            if (updateError) throw updateError;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Inventário atualizado com sucesso!' }));
        } catch(error) {
            console.error("ERRO AO ATUALIZAR INVENTÁRIO: ", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Erro no servidor: ${error.message}`}));
        }
    });
}

function handleStaticFileRequest(req, res) {
    const parsedUrl = url.parse(req.url);
    let pathname = path.join(__dirname, '..', 'frontend', 'dist', parsedUrl.pathname);
    fs.stat(pathname, (err, stat) => {
        if (err || !stat.isFile()) {
            const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
            fs.readFile(indexPath, (indexErr, indexData) => {
                if(indexErr) {
                    res.writeHead(404); res.end(`Frontend não encontrado.`);
                } else {
                    res.setHeader('Content-type', 'text/html'); res.writeHead(200); res.end(indexData);
                }
            });
            return;
        }
        const ext = path.parse(pathname).ext;
        const mimeMap = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
        fs.readFile(pathname, (fileErr, data) => {
            if (fileErr) {
                res.writeHead(500); res.end(`Erro ao ler arquivo.`);
            } else {
                res.setHeader('Content-type', mimeMap[ext] || 'text/plain');
                res.writeHead(200); res.end(data);
            }
        });
    });
}

// 2. ATUALIZAR O SERVIDOR PARA LIDAR COM AS NOVAS ROTAS
const server = http.createServer((req, res ) => {
    // Configurações de CORS para todas as rotas
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Resposta para requisições pre-flight (OPTIONS) do navegador
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;

    // --- ROTEAMENTO DA API ---
    if (req.method === 'GET' && pathname === '/api/imobilizado') {
        return handleApiRequest(req, res);
    }
    
    if (req.method === 'GET' && pathname === '/api/report/pdf') {
        return handlePdfReportRequest(req, res); // <-- Chama o gerador de PDF
    }
    
    if (req.method === 'GET' && pathname === '/api/report/csv') {
        return handleCsvReportRequest(req, res); // <-- Chama o gerador de CSV
    }
    
    if (req.method === 'PUT' && pathname === '/api/imobilizado/update-inventory') {
        return handleUpdateInventoryRequest(req, res);
    }
    
    // Se não for nenhuma rota da API, serve os arquivos do frontend
    handleStaticFileRequest(req, res);
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Servidor com Supabase rodando na porta ${port}.`);
});
