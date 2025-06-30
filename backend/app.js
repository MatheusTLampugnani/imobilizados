require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');

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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!codigoFormatado) {
        res.writeHead(400);
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
                    "Subnº": item.sub_numero,
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
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---', dbError);
        res.writeHead(500);
        return res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
}

async function handlePdfReportRequest(req, res) {
    // CORREÇÃO: Adicione o cabeçalho CORS no início da função
    res.setHeader('Access-Control-Allow-Origin', '*');

    const parsedUrl = url.parse(req.url, true);
    const { centro_custo } = parsedUrl.query;

    if (!centro_custo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "Centro de custo não fornecido." }));
    }
    
    const centroCustoNumerico = parseInt(centro_custo, 10);

    try {
        const { data, error } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('centro_custo', centroCustoNumerico) 
            .order('codigo_imobilizado', { ascending: true })
            .order('sub_numero', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: `Nenhum imobilizado encontrado para o Centro de Custo ${centro_custo}.` }));
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `Relatorio_Imobilizados_CC_${centro_custo}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);

        doc.fontSize(18).text(`Relatório de Imobilizados`, { align: 'center' });
        doc.fontSize(14).text(`Centro de Custo: ${centro_custo}`, { align: 'center' });
        doc.moveDown(2);

        data.forEach(item => {
            doc.fontSize(12).font('Helvetica-Bold').text(`Cód. Imobilizado: ${item.codigo_imobilizado} | Subnº: ${item.sub_numero}`);
            doc.font('Helvetica').fontSize(10);
            doc.text(`Descrição: ${item.descricao || 'N/A'}`);
            doc.text(`Nº Inventário: ${item.codigo_inventario || 'N/A'}`);
            doc.text(`Nº Série: ${item.numero_serie || 'N/A'}`);
            doc.text(`Data Incorporação: ${item.data_incorporacao || 'N/A'}`);
            doc.moveDown();
        });

        doc.end();

    } catch (dbError) {
        console.error('ERRO AO GERAR PDF:', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
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

    if (req.method === 'GET' && parsedUrl.pathname === '/api/imobilizado') {
        return handleApiRequest(req, res);
    }
    
    if (req.method === 'GET' && parsedUrl.pathname === '/api/report/pdf') {
        return handlePdfReportRequest(req, res);
    }
    
    handleStaticFileRequest(req, res);
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Servidor com Supabase rodando na porta ${port}.`);
});