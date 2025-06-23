const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// --- FUNÇÃO DE FORMATAÇÃO ---
function formatarValor(valor, tipo = 'string') {
    if (valor === null || valor === undefined || valor === '') return "";
    const valorStr = String(valor).trim();
    if (tipo === 'inteiro') return valorStr.replace(/\.0$/, '');
    return valorStr;
}

// --- CARREGAMENTO E PROCESSAMENTO DOS DADOS (lógica mantida) ---
let imobilizadosData = {};
let inventoryCodeMap = {};
const dataFilePath = path.join(__dirname, 'dados_imobilizados.json');

try {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        imobilizadosData = JSON.parse(data);
        console.log(`✅ Arquivo de dados carregado com ${Object.keys(imobilizadosData).length} imobilizados.`);

        console.log('🔄 Criando mapa de busca por inventário...');
        for (const imobilizadoCode in imobilizadosData) {
            const asset = imobilizadosData[imobilizadoCode];
            if (asset.itens && Array.isArray(asset.itens)) {
                for (const subItem of asset.itens) {
                    if (subItem.Inventário && subItem.Inventário.trim() !== '') {
                        inventoryCodeMap[subItem.Inventário] = asset;
                    }
                }
            }
        }
        console.log(`✅ Mapa de inventário criado com ${Object.keys(inventoryCodeMap).length} entradas.`);
    } else {
        console.error(`❌ ERRO: Arquivo 'dados_imobilizados.json' não encontrado.`);
    }
} catch (error) {
    console.error(`❌ ERRO ao carregar dados: ${error.message}`);
}

function handleApiRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { codigo } = parsedUrl.query;
    const codigoFormatado = formatarValor(codigo, 'inteiro');
    let imobilizado = null;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!codigoFormatado) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Nenhum código foi fornecido." }));
    }

    imobilizado = inventoryCodeMap[codigoFormatado] || imobilizadosData[codigoFormatado];

    if (imobilizado) {
        const assetCode = Object.keys(imobilizadosData).find(key => imobilizadosData[key] === imobilizado);
        const responseData = { codigo: assetCode, ...imobilizado };
        res.writeHead(200);
        res.end(JSON.stringify(responseData));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Imobilizado ou Inventário não encontrado' }));
    }
}

function handleStaticFileRequest(req, res) {
    const parsedUrl = url.parse(req.url);
    let pathname = path.join(__dirname, '..', 'frontend', 'dist', parsedUrl.pathname);

    if (fs.statSync(pathname).isDirectory()) {
        pathname = path.join(pathname, 'index.html');
    }

    const ext = path.parse(pathname).ext;
    const mimeMap = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
    };

    fs.readFile(pathname, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end(`Arquivo não encontrado: ${pathname}`);
            return;
        }
        res.setHeader('Content-type', mimeMap[ext] || 'text/plain');
        res.writeHead(200);
        res.end(data);
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
    console.log(`🚀 Servidor nativo do Node.js rodando na porta ${port}.`);
    console.log(`   Acesse o sistema em http://localhost:${port}`);
});