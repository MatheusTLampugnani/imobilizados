require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const url = require('url');

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
    
    const centroCustoNumerico = parseInt(centro_custo, 10);

    try {
        const { data, error } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('centro_custo', centroCustoNumerico) 
            .order('codigo_imobilizado', { ascending: true })
            .order('sub_numero', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: `Nenhum imobilizado encontrado para o Centro de Custo ${centro_custo}.` }));
        }
        gerarRelatorioPDF({ data, centro_custo }, res);

    } catch (dbError) {
        console.error('ERRO AO GERAR PDF:', dbError);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
}

function gerarRelatorioPDF({ data, centro_custo }, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const drawHeader = (doc) => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'videplast-brand.png');
        const centerX = (doc.page.width - 120) / 2;

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, centerX, 30, { width: 120 });
        }

        doc.moveDown(3);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#000000").lineWidth(1).stroke();
        doc.moveDown(1);
    };

    const drawFooter = (doc) => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            const bottom = doc.page.margins.bottom;
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            doc.fontSize(8).font('Helvetica').fillColor('#000');
            doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, doc.page.height - bottom + 10, { align: 'left' });
            doc.text(`Página ${i + 1} de ${pageCount}`, 0, doc.page.height - bottom + 10, { align: 'right' });
        }
    };

    drawHeader(doc);

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const estimatedHeight = 90;

        if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
             if (i < data.length) {
                doc.addPage();
                drawHeader(doc);
            }
        }

const y = doc.y;
        doc.fontSize(9).fillColor('#000');

        doc.font('Helvetica-Bold').text('Imobilizado:', 40, y, { continued: true })
           .font('Helvetica').text(` ${item.codigo_imobilizado || 'N/A'}`);
        
        doc.font('Helvetica-Bold').text('Subnº:', 250, y, { continued: true })
           .font('Helvetica').text(` ${item.sub_numero ?? 'N/A'}`);

        const line2Y = y + 15;
        doc.font('Helvetica-Bold').text('Inventário:', 40, line2Y, { continued: true })
           .font('Helvetica').text(` ${item.codigo_inventario || 'N/A'}`);

        doc.font('Helvetica-Bold').text('Data Incorporação:', 250, line2Y, { continued: true })
           .font('Helvetica').text(` ${item.data_incorporacao || 'N/A'}`);

        const line3Y = y + 30;
        doc.font('Helvetica-Bold').text('Inventário Antigo:', 40, line3Y, { continued: true })
           .font('Helvetica').text(` ${item.codigo_inventario_antigo || 'N/A'}`);
           
        doc.font('Helvetica-Bold').text('Nº Série:', 250, line3Y, { continued: true })
            .font('Helvetica').text(` ${item.numero_serie || 'N/A'}`);

        const line4Y = y + 45;
        doc.font('Helvetica-Bold').text('Descrição:', 40, line4Y, { continued: true })
           .font('Helvetica').text(` ${item.descricao || 'N/A'}`, { width: 480 });

        const descHeight = doc.heightOfString(item.descricao || 'N/A', { width: 480 });
        doc.y = line4Y + descHeight + 5; // Posição final antes da linha

        doc.moveDown(1);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
        doc.moveDown(1);
    }

    drawFooter(doc);
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};