require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PdfPrinter = require('pdfmake');
const path = require('path');
const url = require('url');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function handlePdfReportRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
            .eq('centro_custo', centro_custo)
            .order('codigo_imobilizado', { ascending: true })
            .order('sub_numero', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: "Nenhum dado encontrado." }));
        }

        const { data: ccData } = await supabase
            .from('centro_de_custo')
            .select('setores')
            .eq('centro_custo', centro_custo)
            .single();

        gerarPDFMake(
            {
                data,
                centro_custo,
                centro_custo_nome: ccData ? ccData.setores : ""
            },
            res
        );

    } catch (dbError) {
        console.error('ERRO PDF:', dbError);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: dbError.message }));
        }
    }
}

function gerarPDFMake({ data, centro_custo, centro_custo_nome }, res) {
    const fonts = {
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        }
    };

    const printer = new PdfPrinter(fonts);

    let logoPath = null;
    try {
        const possiblePath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
        if (fs.existsSync(possiblePath)) logoPath = possiblePath;
    } catch (e) {}

    const tableBody = [];

    tableBody.push([
        { text: 'IMOBILIZADO', style: 'tableHeader' },
        { text: 'SUBNº', style: 'tableHeader', alignment: 'center' },
        { text: 'INVENTÁRIO', style: 'tableHeader' },
        { text: 'ANTIGO', style: 'tableHeader' },
        { text: 'DATA', style: 'tableHeader' },
        { text: 'LOCAL', style: 'tableHeader' },
        { text: 'SÉRIE', style: 'tableHeader' }
    ]);

    data.forEach((item, index) => {
        const imob = item.codigo_imobilizado ? String(item.codigo_imobilizado) : "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario ? String(item.codigo_inventario) : "-";
        const invAnt = item.codigo_inventario_antigo ? String(item.codigo_inventario_antigo) : "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        
        let dataInc = "-";
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch(e){}
        }

        const descricao = item.descricao || "SEM DESCRIÇÃO";
        
        const rowColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';

        tableBody.push([
            { text: imob, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] },
            { text: sub, style: 'tableCell', alignment: 'center', fillColor: rowColor, border: [false, true, false, false] },
            { text: inv, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] },
            { text: invAnt, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] },
            { text: dataInc, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] },
            { text: local, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] },
            { text: serie, style: 'tableCell', fillColor: rowColor, border: [false, true, false, false] }
        ]);

        tableBody.push([
            { 
                colSpan: 7, 
                text: [
                    { text: 'DESCRIÇÃO: ', bold: true, color: '#666', fontSize: 7 }, 
                    { text: descricao, fontSize: 9, color: '#000' }
                ],
                fillColor: rowColor,
                margin: [0, 2, 0, 8], 
                border: [false, false, false, false] 
            },
            {}, {}, {}, {}, {}, {}
        ]);
    });

    const docDefinition = {
        defaultStyle: { font: 'Helvetica' },
        pageSize: 'A4',
        pageMargins: [30, 110, 30, 40],

        header: function(currentPage, pageCount) {
            return {
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
                                    { 
                                        text: `Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
                                        style: 'headerInfo', 
                                        alignment: 'right',
                                        margin: [0, 5, 0, 0]
                                    }
                                ],
                                width: '*'
                            }
                        ]
                    },
                    { 
                        canvas: [{ type: 'line', x1: 0, y1: 10, x2: 535, y2: 10, lineWidth: 2, lineColor: '#b91c1c' }],
                        margin: [0, 10, 0, 0]
                    }
                ]
            };
        },

        footer: function(currentPage, pageCount) {
            return {
                margin: [30, 0, 30, 0],
                columns: [
                    { text: 'Sistema de Controle de Ativos', style: 'footerText' },
                    { text: `Página ${currentPage} de ${pageCount}`, style: 'footerText', alignment: 'right' }
                ]
            };
        },

        content: [
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', 30, 70, 60, 60, '*', 70],
                    body: tableBody,
                    dontBreakRows: true
                },
                layout: {
                    hLineWidth: function (i) { return 0; },
                    vLineWidth: function (i) { return 0; },
                    paddingLeft: function(i) { return 5; },
                    paddingRight: function(i) { return 5; },
                    paddingTop: function(i) { return 5; },
                    paddingBottom: function(i) { return 2; }
                }
            }
        ],

        styles: {
            headerTitle: { fontSize: 16, bold: true, color: '#333' },
            headerInfo: { fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
            tableHeader: { fontSize: 8, bold: true, color: '#ffffff', fillColor: '#333333', margin: [0, 5, 0, 5] },
            tableCell: { fontSize: 8, color: '#333' },
            footerText: { fontSize: 8, color: '#999' }
        }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
}

module.exports = {
    handlePdfReportRequest
};