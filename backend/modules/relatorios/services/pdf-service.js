const { supabase } = require('../../../lib/supabase');
const PdfPrinter = require('pdfmake');
const path = require('path');
const fs = require('fs');

/**
 * Busca os dados necessários e gera o stream PDF de relatório de imobilizados.
 * @param {string} centro_custo
 * @param {import('http').ServerResponse} res
 */
async function gerarRelatorioPDF(centro_custo, res) {
    const { data, error } = await supabase
        .from('imobilizados')
        .select('*')
        .eq('centro_custo', centro_custo)
        .order('codigo_imobilizado', { ascending: true })
        .order('sub_numero', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
        const err = new Error('Nenhum dado encontrado.');
        err.statusCode = 404;
        throw err;
    }

    const { data: ccData } = await supabase
        .from('centro_de_custo')
        .select('setores')
        .eq('centro_custo', centro_custo)
        .single();

    _gerarPDFMake({ data, centro_custo, centro_custo_nome: ccData ? ccData.setores : '' }, res);
}

function _gerarPDFMake({ data, centro_custo, centro_custo_nome }, res) {
    const fonts = {
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique',
        },
    };

    const printer = new PdfPrinter(fonts);

    let logoPath = null;
    try {
        const possiblePath = path.join(__dirname, '..', '..', '..', 'assets', 'videplast-brand.png');
        if (fs.existsSync(possiblePath)) logoPath = possiblePath;
    } catch (e) {}

    const contentBody = [];

    data.forEach((item, index) => {
        const imob = item.codigo_imobilizado || '-';
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario || '-';
        const invAnt = item.codigo_inventario_antigo || '-';
        const local = item.local || '-';
        const serie = item.numero_serie || '-';

        let dataInc = '-';
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch (e) {}
        }

        const descricao = item.descricao || 'SEM DESCRIÇÃO';
        const rowColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';

        const field = (label, value) => ({
            stack: [
                { text: label, style: 'label' },
                { text: value, style: 'value' },
            ],
        });

        contentBody.push({
            table: {
                widths: ['16%', '8%', '14%', '14%', '14%', '18%', '16%'],
                body: [[
                    { ...field('IMOBILIZADO', imob), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('SUBNº', sub), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('INVENTÁRIO', inv), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('INV. ANTIGO', invAnt), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('DATA INC.', dataInc), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('LOCAL', local), fillColor: rowColor, border: [false, true, false, false] },
                    { ...field('SÉRIE', serie), fillColor: rowColor, border: [false, true, false, false] },
                ], [{
                    colSpan: 7,
                    text: [
                        { text: 'DESCRIÇÃO: ', style: 'labelDesc' },
                        { text: descricao, style: 'valueDesc' },
                    ],
                    fillColor: rowColor,
                    border: [false, false, false, false],
                    margin: [0, 2, 0, 8],
                }, {}, {}, {}, {}, {}, {}]],
            },
            layout: 'noBorders',
            unbreakable: true,
            margin: [0, 0, 0, 5],
        });

        contentBody.push({
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: '#ddd', dash: { length: 2 } }],
            margin: [0, 0, 0, 5],
        });
    });

    const docDefinition = {
        defaultStyle: { font: 'Helvetica' },
        pageSize: 'A4',
        pageMargins: [30, 110, 30, 40],
        header: (currentPage, pageCount) => ({
            margin: [30, 20, 30, 0],
            stack: [
                {
                    columns: [
                        logoPath ? { image: logoPath, width: 100 } : { text: 'VIDEPLAST', bold: true, fontSize: 18 },
                        {
                            stack: [
                                { text: 'RELATÓRIO DE IMOBILIZADOS', style: 'headerTitle', alignment: 'right' },
                                { text: `Centro de Custo: ${centro_custo}`, style: 'headerInfo', alignment: 'right' },
                                { text: `Setor: ${centro_custo_nome || ''}`, style: 'headerInfo', alignment: 'right' },
                                { text: `Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, style: 'headerInfo', alignment: 'right', margin: [0, 5, 0, 0] },
                            ],
                            width: '*',
                        },
                    ],
                },
                { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 535, y2: 10, lineWidth: 2, lineColor: '#b91c1c' }], margin: [0, 10, 0, 0] },
            ],
        }),
        footer: (currentPage, pageCount) => ({
            margin: [30, 0, 30, 0],
            columns: [
                { text: 'Sistema de Controle de Ativos', style: 'footerText' },
                { text: `Página ${currentPage} de ${pageCount}`, style: 'footerText', alignment: 'right' },
            ],
        }),
        content: contentBody,
        styles: {
            headerTitle: { fontSize: 16, bold: true, color: '#333' },
            headerInfo: { fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
            footerText: { fontSize: 8, color: '#999' },
            label: { fontSize: 6, bold: true, color: '#666', margin: [0, 0, 0, 1] },
            value: { fontSize: 8, color: '#000' },
            labelDesc: { fontSize: 7, bold: true, color: '#666' },
            valueDesc: { fontSize: 9, color: '#000' },
        },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
}

module.exports = { gerarRelatorioPDF };
