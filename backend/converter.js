const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const readline = require('readline');

/**
 * Formata um valor removendo espaços e tratando valores nulos/indefinidos
 * @param {any} valor - Valor a ser formatado
 * @param {string} tipo - Tipo de formatação ('string' ou 'inteiro')
 * @returns {string} Valor formatado
 */
function formatarValor(valor, tipo = 'string') {
    if (valor === null || valor === undefined || valor === '') {
        return "";
    }
    
    const valorStr = String(valor).trim();
    
    if (tipo === 'inteiro') {
        // Remove .0 do final se existir
        return valorStr.replace(/\.0$/, '');
    }
    
    return valorStr;
}

/**
 * Formata uma data para o padrão DD/MM/YYYY
 * @param {string} dataStr - String da data
 * @returns {string} Data formatada ou "Data inválida"
 */
function formatarData(dataStr) {
    if (!dataStr || dataStr.trim() === '') {
        return "Data inválida";
    }
    
    try {
        const data = new Date(dataStr);
        if (isNaN(data.getTime())) {
            return "Data inválida";
        }
        
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        return "Data inválida";
    }
}

/**
 * Aguarda entrada do usuário
 * @param {string} pergunta - Pergunta a ser exibida
 * @returns {Promise<string>} Resposta do usuário
 */
function aguardarEntrada(pergunta) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => {
            rl.close();
            resolve(resposta);
        });
    });
}

/**
 * Função principal de processamento
 */
async function processarDados() {
    const diretorioAtual = __dirname;
    
    const nomeArquivoDados = "imobilizados.csv";
    const caminhoArquivoDados = path.join(diretorioAtual, nomeArquivoDados);
    
    const nomeArquivoSaida = "dados_imobilizados_processados.json";
    const caminhoArquivoSaida = path.join(diretorioAtual, nomeArquivoSaida);
    
    // Verifica se o arquivo de dados existe
    if (!fs.existsSync(caminhoArquivoDados)) {
        console.log("❌ ERRO: Arquivo de dados não encontrado!");
        console.log(`Por favor, verifique se o arquivo '${nomeArquivoDados}' está na mesma pasta que este script.`);
        await aguardarEntrada("\nPressione Enter para sair...");
        process.exit(1);
    }
    
    console.log(`ℹ️  Arquivo de dados encontrado: ${nomeArquivoDados}`);
    
    try {
        const colunasObrigatorias = [
            'Imobilizado', 'Subnº', 'Incorporação em', 
            'Denominação do imobilizado', 'Nº inventário', 
            'Nº de série', 'Centro custo'
        ];
        
        const dadosFinais = {};
        let linhasIgnoradas = 0;
        const codigosInvalidos = new Set();
        let primeiraLinha = true;
        let colunasFaltantes = [];
        
        // Processa o arquivo CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(caminhoArquivoDados)
                .pipe(csv())
                .on('headers', (headers) => {
                    // Verifica se todas as colunas obrigatórias estão presentes
                    colunasFaltantes = colunasObrigatorias.filter(col => !headers.includes(col));
                    if (colunasFaltantes.length > 0) {
                        reject(new Error(`Colunas obrigatórias não encontradas no arquivo: ${colunasFaltantes.join(', ')}`));
                        return;
                    }
                })
                .on('data', (row) => {
                    const codigoImobilizado = formatarValor(row['Imobilizado'], 'inteiro');
                    
                    // Verifica se os dados obrigatórios estão presentes
                    if (!codigoImobilizado || 
                        !row['Denominação do imobilizado'] || 
                        !row['Centro custo']) {
                        if (!codigoImobilizado) {
                            codigosInvalidos.add(String(row['Imobilizado']));
                        }
                        linhasIgnoradas++;
                        return;
                    }
                    
                    const dataFormatada = formatarData(row['Incorporação em']);
                    
                    const item = {
                        "Subnº": formatarValor(row['Subnº'], 'inteiro'),
                        "Data": dataFormatada,
                        "Descrição": formatarValor(row['Denominação do imobilizado']),
                        "Inventário": formatarValor(row['Nº inventário'], 'inteiro'),
                        "Série": formatarValor(row['Nº de série']),
                        "Centro Custo": formatarValor(row['Centro custo'], 'inteiro'),
                        "Link": `https://videplast.com.br/consulta-imobilizado?id=${codigoImobilizado}`,
                        "QRCODE": ""
                    };
                    
                    if (!dadosFinais[codigoImobilizado]) {
                        dadosFinais[codigoImobilizado] = { "itens": [] };
                    }
                    
                    dadosFinais[codigoImobilizado]["itens"].push(item);
                })
                .on('end', () => {
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
        
        // Salva o arquivo JSON
        fs.writeFileSync(caminhoArquivoSaida, JSON.stringify(dadosFinais, null, 4), 'utf8');
        
        const totalCodigos = Object.keys(dadosFinais).length;
        const totalItens = Object.values(dadosFinais).reduce((total, obj) => total + obj.itens.length, 0);
        
        console.log("\n" + "=".repeat(40));
        console.log("✅ Processamento Concluído com Sucesso!");
        console.log("=".repeat(40));
        console.log(`👉 Total de códigos de imobilizado únicos: ${totalCodigos}`);
        console.log(`👉 Total de itens (sub-ativos) processados: ${totalItens}`);
        console.log(`👉 Total de linhas ignoradas (dados inválidos): ${linhasIgnoradas}`);
        
        if (codigosInvalidos.size > 0) {
            const amostra = Array.from(codigosInvalidos).slice(0, 5).join(', ');
            console.log(`⚠️  Amostra de códigos inválidos ignorados: ${amostra}...`);
        }
        
        console.log("-".repeat(40));
        console.log(`\n🚀 Arquivo JSON gerado com sucesso em:`);
        console.log(caminhoArquivoSaida);
        console.log("=".repeat(40));
        
    } catch (error) {
        console.log("\n❌ Ocorreu um erro inesperado durante o processamento.");
        console.log(`   Tipo do erro: ${error.constructor.name}`);
        console.log(`   Detalhes: ${error.message}`);
    } finally {
        await aguardarEntrada("\nPressione Enter para sair...");
    }
}

// Executa o script se for chamado diretamente
if (require.main === module) {
    processarDados();
}

module.exports = { processarDados, formatarValor, formatarData };

