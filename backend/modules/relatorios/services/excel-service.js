const { supabase } = require('../../../lib/supabase');
const ExcelJS = require('exceljs');

/**
 * Gera e envia o relatório Excel de imobilizados cadastrados ou baixas.
 * @param {{ start_date?: string, end_date?: string, centro_custo?: string, baixas_only?: string }} params
 * @param {import('http').ServerResponse} res
 */
async function gerarRelatorioExcel({ start_date, end_date, centro_custo, baixas_only }, res) {
    let query;

    if (baixas_only === 'true') {
        query = supabase.from('imobilizados').select('*').ilike('local', '%baixa%');
        if (centro_custo) query = query.ilike('centro_custo', `%${centro_custo}%`);
    } else {
        query = supabase.from('imobilizados_cadastrados').select('*').order('created_at', { ascending: false });
        if (start_date) query = query.gte('created_at', `${start_date}T00:00:00`);
        if (end_date) query = query.lte('created_at', `${end_date}T23:59:59`);
        if (centro_custo) query = query.ilike('centro_custo', `%${centro_custo}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Itens Cadastrados');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Data Criação', key: 'created_at', width: 20 },
        { header: 'Descrição', key: 'descricao', width: 30 },
        { header: 'Cód. Inventário', key: 'codigo_inventario', width: 15 },
        { header: 'Nº Série', key: 'numero_serie', width: 15 },
        { header: 'Centro de Custo', key: 'centro_custo', width: 15 },
        { header: 'Local', key: 'local', width: 15 },
        { header: 'Usuário', key: 'cracha', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach(item => {
        let dateStr = '';
        if (item.created_at) {
            dateStr = new Date(item.created_at).toLocaleDateString('pt-BR');
        } else if (item.data_incorporacao) {
            const parsed = new Date(item.data_incorporacao);
            dateStr = isNaN(parsed.getTime()) ? String(item.data_incorporacao) : parsed.toLocaleDateString('pt-BR');
        }
        worksheet.addRow({ ...item, created_at: dateStr });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Relatorio_Inventario.xlsx');
    await workbook.xlsx.write(res);
    res.end();
}

module.exports = { gerarRelatorioExcel };
