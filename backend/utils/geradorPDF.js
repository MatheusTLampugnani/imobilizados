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

    const tableBody = [
        [
            { text: 'IMOBILIZADO', style: 'tableHeader' },
            { text: 'SUBNº', style: 'tableHeader' },
            { text: 'INVENTÁRIO', style: 'tableHeader' },
            { text: 'DATA INC.', style: 'tableHeader' },
            { text: 'LOCAL', style: 'tableHeader' },
            { text: 'SÉRIE', style: 'tableHeader' }
        ]
    ];

    data.forEach((item, index) => {
        const imob = item.codigo_imobilizado ? String(item.codigo_imobilizado) : "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario ? String(item.codigo_inventario) : "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        
        let dataInc = "-";
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch(e){}
        }

        const descricao = item.descricao || "SEM DESCRIÇÃO";
        const fillColor = index % 2 === 0 ? '#f5f5f5' : null;

        tableBody.push([
            { text: imob, style: 'tableCell', fillColor: fillColor },
            { text: sub, style: 'tableCell', fillColor: fillColor },
            { text: inv, style: 'tableCell', fillColor: fillColor },
            { text: dataInc, style: 'tableCell', fillColor: fillColor },
            { text: local, style: 'tableCell', fillColor: fillColor },
            { text: serie, style: 'tableCell', fillColor: fillColor }
        ]);

        tableBody.push([
            { 
                text: [
                    { text: 'DESCRIÇÃO: ', bold: true, color: '#555', fontSize: 7 }, 
                    { text: descricao }
                ], 
                colSpan: 6, 
                style: 'descCell',
                fillColor: fillColor,
                border: [false, false, false, true]
            },
            {}, {}, {}, {}, {}
        ]);
    });

    const docDefinition = {
        defaultStyle: { font: 'Helvetica' },
        pageSize: 'A4',
        pageMargins: [30, 100, 30, 40], 

        header: function(currentPage, pageCount) {
            return {
                margin: [30, 20, 30, 0],
                columns: [
                    {
                        text: 'VIDEPLAST',
                        fontSize: 20,
                        bold: true,
                        width: 120,
                        alignment: 'center',
                        margin: [0, 10, 0, 0]
                    },
                    {
                        stack: [
                            { text: 'RELATÓRIO DE IMOBILIZADOS', style: 'headerTitle' },
                            { 
                                text: [
                                    { text: 'Centro de Custo: ', bold: true }, 
                                    `${centro_custo} - ${centro_custo_nome || ''}`
                                ], 
                                style: 'headerSub' 
                            },
                            { 
                                text: `Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 
                                style: 'headerSub' 
                            }
                        ],
                        width: '*'
                    }
                ]
            };
        },

        footer: function(currentPage, pageCount) {
            return {
                margin: [30, 0, 30, 0],
                columns: [
                    { text: 'Sistema de Controle de Ativos', fontSize: 8, color: '#999' },
                    { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 8, color: '#999' }
                ]
            };
        },

        content: [
            {
                table: {
                    headerRows: 1,
                    widths: [60, 30, 70, 60, 90, 80],
                    body: tableBody,
                    dontBreakRows: true
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
                    },
                    vLineWidth: function (i, node) { return 0; },
                    hLineColor: function (i, node) { return '#ddd'; },
                    paddingLeft: function(i) { return 4; },
                    paddingRight: function(i) { return 4; },
                    paddingTop: function(i) { return 4; },
                    paddingBottom: function(i) { return 4; }
                }
            }
        ],

        styles: {
            headerTitle: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
            headerSub: { fontSize: 9, color: '#444', margin: [0, 2, 0, 2] },
            tableHeader: { fontSize: 8, bold: true, color: 'white', fillColor: '#333', alignment: 'center' },
            tableCell: { fontSize: 8, color: '#000' },
            descCell: { fontSize: 9, alignment: 'justify', margin: [5, 0, 5, 5] }
        }
    };

    try {
        const logoPath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
        if (fs.existsSync(logoPath)) {
            docDefinition.header.columns[0] = {
                image: logoPath,
                width: 100,
                alignment: 'center'
            };
        }
    } catch(e) {}

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.pdf"`);
    
    pdfDoc.pipe(res);
    pdfDoc.end();
}

module.exports = {
    handlePdfReportRequest
};