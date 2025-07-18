require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Pdfmake = require('pdfmake');
const fs = require('fs');
const path = require('path');
const url = require('url');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para converter a imagem do logo para base64
const getLogoBase64 = () => {
    const logoPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'videplast-brand.png');
    if (fs.existsSync(logoPath)) {
        // Retorna como uma data URL, que é o formato que o pdfmake espera
        return `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    }
    return null;
};

const logoBase64 = getLogoBase64();

async function handlePdfReportRequest(req, res) {
    // ... (o início da sua função continua igual)
    const parsedUrl = url.parse(req.url, true);
    const { centro_custo } = parsedUrl.query;

    if (!centro_custo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "Centro de custo não fornecido." }));
    }
    
    const centroCustoNumerico = parseInt(centro_custo, 10);

    try {
        const { data, error } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('centro_custo', centroCustoNumerico) 
            .order('codigo_imobilizado', { ascending: true })
            .order('sub_numero', { ascending: true });

        if (error) throw error;

        if (!data || !data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: `Nenhum imobilizado encontrado para o Centro de Custo ${centro_custo}.` }));
        }
        
        gerarRelatorioPDF({ data, centro_custo }, res);

    } catch (dbError) {
        console.error('ERRO AO GERAR PDF:', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
}

function gerarRelatorioPDF({ data, centro_custo }, res) {
    const fonts = {
        Roboto: {
            normal: path.join(__dirname, '..', '..', 'frontend', 'public', 'fonts', 'Roboto-Regular.ttf'), // Você precisará adicionar as fontes
            bold: path.join(__dirname, '..', '..', 'frontend', 'public', 'fonts', 'Roboto-Medium.ttf'),
        }
    };
    const printer = new Pdfmake(fonts);

    const tableHeader = ["Imobilizado", "Subnº", "Inventário", "Descrição", "Nº Série", "Data Incorporação"];
    const tableBody = data.map(item => [
        item.codigo_imobilizado || 'N/A',
        item.sub_numero ?? 'N/A',
        item.codigo_inventario || 'N/A',
        item.descricao || 'Sem descrição',
        item.numero_serie || 'N/A',
        item.data_incorporacao || 'N/A'
    ]);

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 100, 40, 60], // [left, top, right, bottom]
        header: {
            margin: [40, 20, 40, 0],
            stack: [
                logoBase64 ? { image: logoBase64, width: 150, alignment: 'center' } : {},
                { text: 'RELATÓRIO DE IMOBILIZADOS', style: 'headerTitle', alignment: 'center', margin: [0, 10, 0, 0] },
                { text: `Centro de Custo: ${centro_custo}`, style: 'subHeader', alignment: 'left', margin: [0, 10, 0, 0] }
            ]
        },
        footer: (currentPage, pageCount) => ({
            columns: [
                { text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, alignment: 'left', style: 'footer' },
                { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', style: 'footer' }
            ],
            margin: [40, 0]
        }),
        content: [
            {
                layout: 'lightHorizontalLines', // optional
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto'],
                    body: [
                        tableHeader.map(text => ({ text, style: 'tableHeader' })),
                        ...tableBody
                    ]
                }
            }
        ],
        styles: {
            headerTitle: { fontSize: 16, bold: true },
            subHeader: { fontSize: 12 },
            tableHeader: { bold: true, fontSize: 9, color: 'black' },
            footer: { fontSize: 8 }
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 8
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