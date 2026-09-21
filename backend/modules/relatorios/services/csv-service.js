const { supabase } = require('../../../lib/supabase');

function _convertToCSV(data, centroCustoMap) {
    if (!data || data.length === 0) return '';

    const headers = [
        'ID', 'Subn', 'Data Incorporacao', 'Descricao', 'Centro de Custo', 'Setor', 'Local',
        'Codigo Imobilizado', 'Codigo Inventario', 'Codigo Inventario Antigo', 'N de Série',
    ];

    const rows = data.map(item => [
        item.id,
        item.sub_numero,
        item.data_incorporacao,
        `"${(item.descricao || '').replace(/"/g, '""')}"`,
        item.centro_custo,
        `"${(centroCustoMap[item.centro_custo] || '').replace(/"/g, '""')}"`,
        `"${(item.local || '').replace(/"/g, '""')}"`,
        item.codigo_imobilizado,
        item.codigo_inventario,
        item.codigo_inventario_antigo,
        item.numero_serie,
    ].join(';'));

    return [headers.join(';'), ...rows].join('\n');
}

/**
 * Busca os dados e retorna o conteúdo CSV de relatório de imobilizados.
 * @param {string} centro_custo
 * @returns {string} Conteúdo CSV
 */
async function gerarRelatorioCSV(centro_custo) {
    const { data, error } = await supabase
        .from('imobilizados')
        .select('*')
        .eq('centro_custo', centro_custo);

    if (error) throw error;

    if (!data || data.length === 0) {
        const err = new Error(`Nenhum item encontrado para o centro de custo ${centro_custo}.`);
        err.statusCode = 404;
        throw err;
    }

    const codes = [...new Set(data.map(i => i.centro_custo).filter(Boolean))];
    let centroCustoMap = {};

    if (codes.length > 0) {
        const { data: ccData, error: ccError } = await supabase
            .from('centro_de_custo')
            .select('centro_custo, setores')
            .in('centro_custo', codes);

        if (!ccError) {
            (ccData || []).forEach(cc => { centroCustoMap[cc.centro_custo] = cc.setores; });
        }
    }

    return _convertToCSV(data, centroCustoMap);
}

module.exports = { gerarRelatorioCSV };
