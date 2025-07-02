const { createClient } = require('@supabase/supabase-js');
const url = require('url');

// Reutilize a conexão com o Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para converter dados JSON para o formato CSV
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    // Define os cabeçalhos do CSV (a ordem importa)
    const headers = [
        "ID", "Subnº", "Data Incorporação", "Descrição", "Centro de Custo", 
        "Código Imobilizado", "Código Inventário", "Código Inventário Antigo", "Nº de Série"
    ];
    
    // Mapeia os dados para as linhas do CSV
    const rows = data.map(item => [
        item.id,
        item.sub_numero,
        item.data_incorporacao,
        `"${item.descricao.replace(/"/g, '""')}"`, // Trata aspas na descrição
        item.centro_custo,
        item.codigo_imobilizado,
        item.codigo_inventario,
        item.codigo_inventario_antigo,
        item.numero_serie
    ].join(','));

    // Junta cabeçalhos e linhas
    return [headers.join(','), ...rows].join('\n');
}

// Função principal que lida com a requisição para gerar o CSV
async function handleCsvReportRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { centro_custo } = parsedUrl.query;

    if (!centro_custo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "Centro de custo não fornecido." }));
    }

    try {
        // Busca os dados no Supabase
        const { data, error } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('centro_custo', centro_custo);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: `Nenhum item encontrado para o centro de custo ${centro_custo}.` }));
        }

        // Converte os dados para CSV
        const csvData = convertToCSV(data);

        // Define os cabeçalhos da resposta para forçar o download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.csv"`);
        res.writeHead(200);
        res.end(csvData);

    } catch (dbError) {
        console.error('--- ERRO AO GERAR RELATÓRIO CSV ---', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no servidor: ${dbError.message}` }));
    }
}

module.exports = { handleCsvReportRequest };
