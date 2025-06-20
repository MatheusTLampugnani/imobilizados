const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Variável global para armazenar os dados
let dadosImobilizados = {};

/**
 * Carrega os dados do arquivo JSON para a memória.
 */
function carregarDados() {
    try {
        const caminhoArquivo = path.join(__dirname, 'dados_imobilizados.json');
        
        if (!fs.existsSync(caminhoArquivo)) {
            console.error("Erro: O arquivo 'dados_imobilizados.json' não foi encontrado.");
            return;
        }

        const dadosRaw = fs.readFileSync(caminhoArquivo, 'utf8');
        const dados = JSON.parse(dadosRaw);

        if (Array.isArray(dados)) {
            // Se os dados são um array, organiza por código
            dadosImobilizados = {};
            dados.forEach(item => {
                const codigo = item.codigo || item.Codigo || item.CODIGO;
                if (codigo) {
                    const codigoStr = String(codigo);
                    if (!dadosImobilizados[codigoStr]) {
                        dadosImobilizados[codigoStr] = { itens: [] };
                    }
                    dadosImobilizados[codigoStr].itens.push(item);
                }
            });
        } else if (typeof dados === 'object' && dados !== null) {
            // Se os dados já são um objeto, usa diretamente
            dadosImobilizados = dados;
        }

        console.log("Dados carregados com sucesso.");
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("Erro: O arquivo JSON está mal formatado.");
        } else {
            console.error(`Ocorreu um erro inesperado ao carregar os dados: ${error.message}`);
        }
    }
}

/**
 * Endpoint para retornar os dados de um imobilizado específico.
 */
app.get('/api/imobilizado/:codigo', (req, res) => {
    const { codigo } = req.params;
    const imobilizado = dadosImobilizados[codigo];
    
    if (!imobilizado) {
        return res.status(404).json({
            erro: `Imobilizado com código ${codigo} não encontrado.`
        });
    }
    
    res.json(imobilizado);
});

/**
 * Endpoint para retornar todos os dados de imobilizados.
 */
app.get('/api/imobilizados', (req, res) => {
    res.json(dadosImobilizados);
});

// Middleware de tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({
        erro: "Endpoint não encontrado."
    });
});

// Middleware de tratamento de erros gerais
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).json({
        erro: "Erro interno do servidor."
    });
});

// Carrega os dados na inicialização
carregarDados();

// Inicia o servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em: http://localhost:${PORT}`);
});

module.exports = app;

