const { createClient } = require('@supabase/supabase-js');
const url = require('url');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = [
        "ID", "Subn", "Data Incorporacao", "Descricao", "Centro de Custo", 
        "Codigo Imobilizado", "Codigo Inventario", "Codigo Inventario Antigo", "N de Série"
    ];
    
    const rows = data.map(item => [
        item.id,
        item.sub_numero,
        item.data_incorporacao,
        `"${item.descricao.replace(/"/g, '""')}"`,
        item.centro_custo,
        item.codigo_imobilizado,
        item.codigo_inventario,
        item.codigo_inventario_antigo,
        item.numero_serie
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
}

async function handleCsvReportRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { centro_custo } = parsedUrl.query;

    if (!centro_custo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "Centro de custo não fornecido." }));
    }

    try {
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

        const csvData = convertToCSV(data);

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
