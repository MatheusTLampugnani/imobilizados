const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const readline = require('readline');

function formatarValor(valor, tipo = 'string') {
    if (valor === null || valor === undefined || valor === '') return "";
    const valorStr = String(valor).trim();
    if (tipo === 'inteiro') return valorStr.replace(/\.0$/, '');
    return valorStr;
}
function formatarData(dataStr) {
    if (!dataStr || dataStr.trim() === '') return "Data inválida";
    try {
        const data = new Date(dataStr);
        if (isNaN(data.getTime())) return "Data inválida";
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    } catch (error) { return "Data inválida"; }
}
function aguardarEntrada(pergunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => { rl.close(); resolve(resposta); });
    });
}


async function processarDados() {
    const diretorioAtual = __dirname;
    const nomeArquivoDados = "imobilizados.csv";
    const caminhoArquivoDados = path.join(diretorioAtual, nomeArquivoDados);
    const nomeArquivoSaida = "dados_imobilizados.json";
    const caminhoArquivoSaida = path.join(diretorioAtual, nomeArquivoSaida);

    if (!fs.existsSync(caminhoArquivoDados)) {
        console.log(`ERRO: Arquivo '${nomeArquivoDados}' não encontrado!`);
        await aguardarEntrada("\nPressione Enter para sair...");
        process.exit(1);
    }
    
    console.log(`ℹ️  Arquivo de dados encontrado: ${nomeArquivoDados}`);
    
    try {
        const colunasObrigatorias = ['Imobilizado', 'Denominação do imobilizado', 'Centro custo'];
        const dadosFinais = {};
        let linhasIgnoradas = 0;
        
        await new Promise((resolve, reject) => {
            fs.createReadStream(caminhoArquivoDados)
                .pipe(csv({ separator: ';' }))
                .on('data', (row) => {
                    const codigoImobilizado = formatarValor(row['Imobilizado'], 'inteiro');
                    
                    if (!codigoImobilizado || !row['Denominação do imobilizado'] || !row['Centro custo']) {
                        linhasIgnoradas++;
                        return;
                    }
                    
                    const item = {
                        "Subnº": formatarValor(row['Subnº'], 'inteiro'),
                        "Data": formatarData(row['Incorporação em']),
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
                .on('end', resolve)
                .on('error', reject);
        });
        
        fs.writeFileSync(caminhoArquivoSaida, JSON.stringify(dadosFinais, null, 4), 'utf8');
        
        console.log("\nProcessamento Concluído!");
        console.log(`Total de códigos de imobilizado únicos: ${Object.keys(dadosFinais).length}`);
        console.log(`Arquivo JSON gerado em: ${caminhoArquivoSaida}`);
        
    } catch (error) {
        console.log("\n\ Erro no processamento:", error.message);
    } finally {
        await aguardarEntrada("\nPressione Enter para sair...");
    }
}

if (require.main === module) {
    processarDados();
}