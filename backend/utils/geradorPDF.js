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

    const drawHeader = (docInstance) => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'videplast-brand.png');
        const centerX = (docInstance.page.width - 120) / 2;

        if (fs.existsSync(logoPath)) {
            docInstance.image(logoPath, centerX, 30, { width: 120 });
        }

        docInstance.moveDown(3);
        docInstance.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        docInstance.moveDown(1);
        docInstance.fontSize(10).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, { align: 'left' });
        docInstance.moveDown(0.5);
        docInstance.moveTo(40, docInstance.y).lineTo(555, docInstance.y).strokeColor("#000000").lineWidth(1).stroke();
        docInstance.moveDown(1);
    };

    const drawFooter = (docInstance) => {
        const pageCount = docInstance.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            docInstance.switchToPage(i);
            const bottom = docInstance.page.margins.bottom;
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            docInstance.fontSize(8).font('Helvetica').fillColor('#000');
            docInstance.text(`Gerado em: ${datetime}`, docInstance.page.margins.left, docInstance.page.height - bottom + 10, { align: 'left' });
            docInstance.text(`Página ${i + 1} de ${pageCount}`, 0, docInstance.page.height - bottom + 10, { align: 'right' });
        }
    };

    drawHeader(doc);

    for (const item of data) {
        const descHeight = doc.heightOfString(item.descricao || 'N/A', { width: 480 });
        // Estimativa mais precisa da altura do bloco do item
        const estimatedHeight = 60 + descHeight;

        // **CORREÇÃO PRINCIPAL:** Verifica se o item cabe ANTES de desenhar
        if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            drawHeader(doc);
        }

        const y = doc.y;
        doc.fontSize(9).fillColor('#000');

        // Linha 1
        doc.font('Helvetica-Bold').text(`Imobilizado:`, 40, y)
           .font('Helvetica').text(` ${item.codigo_imobilizado || 'N/A'}`, 150, y);
        doc.font('Helvetica-Bold').text(`Subnº:`, 300, y)
           .font('Helvetica').text(` ${item.sub_numero ?? 'N/A'}`, 400, y);

        // Linha 2
        const line2Y = y + 15;
        doc.font('Helvetica-Bold').text('Número de inventário:', 40, line2Y)
           .font('Helvetica').text(` ${item.codigo_inventario || 'N/A'}`, 150, line2Y);
        doc.font('Helvetica-Bold').text(`Data incorporação:`, 300, line2Y)
           .font('Helvetica').text(` ${item.data_incorporacao || 'N/A'}`, 400, line2Y);

        // Linha 3
        const line3Y = y + 30;
        doc.font('Helvetica-Bold').text('Inventário Antigo:', 40, line3Y)
           .font('Helvetica').text(` ${item.codigo_inventario_antigo || 'N/A'}`, 150, line3Y);
        
        // Linha 4 (Descrição)
        const line4Y = y + 45;
        doc.font('Helvetica-Bold').text('Descrição:', 40, line4Y)
           .font('Helvetica').text(`${item.descricao || 'N/A'}`, 150, line4Y, { width: 405 });
        
        // Pula para a posição Y após a descrição (que tem altura variável)
        const currentY = doc.y;

        // Linha 5 (Nº de Série)
        doc.font('Helvetica-Bold').text('Nº Série:', 40, currentY)
           .font('Helvetica').text(` ${item.numero_serie || 'N/A'}`, 150, currentY);

        doc.moveDown(1.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
        doc.moveDown(1);
    }

    drawFooter(doc);
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};