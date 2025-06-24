require('dotenv').config();

const http = require('http');
const fs =require('fs');
const path = require('path');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');

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
    let valorStr = String(valor).trim();
    valorStr = valorStr.replace(/\.0$/, '');
    if (valorStr.startsWith('0') && valorStr.length > 1) {
        return valorStr.replace(/^0+/, '');
    }
    return valorStr;
}

async function handleApiRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { codigo } = parsedUrl.query;
    const codigoFormatado = formatarValor(codigo);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!codigoFormatado) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Nenhum código foi fornecido." }));
    }

    try {
        let itensEncontrados = null;
        const { data: inventarioResult, error: inventarioError } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('codigo_inventario', codigoFormatado);

        if (inventarioError) throw inventarioError;

        if (inventarioResult && inventarioResult.length > 0) {
            itensEncontrados = inventarioResult;
        } else {
            const { data: serieResult, error: serieError } = await supabase
                .from('imobilizados')
                .select('*')
                .eq('numero_serie', codigoFormatado);
            
            if (serieError) throw serieError;

            if (serieResult && serieResult.length > 0) {
                itensEncontrados = serieResult;
            } else {
                const { data: imobilizadoResult, error: imobilizadoError } = await supabase
                    .from('imobilizados')
                    .select('*')
                    .eq('codigo_imobilizado', codigoFormatado);

                if (imobilizadoError) throw imobilizadoError;
                itensEncontrados = imobilizadoResult;
            }
        }

        if (itensEncontrados && itensEncontrados.length > 0) {
            const imobilizadoPrincipalCodigo = itensEncontrados[0].codigo_imobilizado;
            
            const responseData = {
                codigo: imobilizadoPrincipalCodigo,
                itens: itensEncontrados.map(item => ({
                    "Subnumero": item.sub_numero,
                    "Data": item.data_incorporacao,
                    "Descrição": item.descricao,
                    "Inventário": item.codigo_inventario,
                    "Série": item.numero_serie,
                    "CentroCusto": item.centro_custo,
                }))
            };
            res.writeHead(200);
            return res.end(JSON.stringify(responseData));
        } else {
            res.writeHead(404);
            return res.end(JSON.stringify({ message: 'Imobilizado, Inventário ou Nº de Série não encontrado' }));
        }

    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---');
        console.error(dbError);
        res.writeHead(500);
        return res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
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
        const mimeMap = {
            '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
        };

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

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/api/imobilizado' && req.method === 'GET') {
        handleApiRequest(req, res);
    } else {
        handleStaticFileRequest(req, res);
    }
});

const port = 5000;
server.listen(port, () => {
    console.log(`Servidor com Supabase rodando na porta ${port}.`);
});