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
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true 
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.on('pageAdded', () => drawHeader(doc, centro_custo));

    drawHeader(doc, centro_custo);

    data.forEach(item => {
        drawItem(doc, item);
    });

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, range.count);
    }

    doc.end();
}

function drawHeader(doc, centro_custo) {
    const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { fit: [75, 75], align: 'center', y: 30 });
    }
    doc.moveDown(4);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, doc.page.margins.left);
    doc.moveDown(0.5);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#aaaaaa").lineWidth(1).stroke();
    doc.moveDown(2);
}

function drawFooter(doc, currentPage, totalPages) {
    const yPos = doc.page.height - 35;
    const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
    doc.text(`Página ${currentPage} de ${totalPages}`, 0, yPos, { 
        align: 'right', 
        width: doc.page.width - doc.page.margins.right - doc.page.margins.left
    });
}

function drawItem(doc, item) {
    const leftColX = doc.page.margins.left;
    const rightColX = 320;
    const valueOffsetX = 110;

    const descriptionText = item.descricao || 'N/A';
    const descriptionHeight = doc.heightOfString(descriptionText, { 
        width: doc.page.width - (leftColX + valueOffsetX) - doc.page.margins.right 
    });
    const estimatedHeight = 60 + descriptionHeight;

    if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const itemTopY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
    
    doc.text('Imobilizado:', leftColX, itemTopY).font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, leftColX + valueOffsetX, itemTopY);
    doc.font('Helvetica-Bold').text('Número de inventário:', leftColX, doc.y).font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, leftColX + valueOffsetX, doc.y);
    doc.font('Helvetica-Bold').text('Inventário Antigo:', leftColX, doc.y).font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, leftColX + valueOffsetX, doc.y);
    const descY = doc.y;
    doc.font('Helvetica-Bold').text('Descrição:', leftColX, descY).font('Helvetica').text(`${descriptionText}`, leftColX + valueOffsetX, descY, { width: 400 });
    const finalLeftY = doc.y; 
    
    doc.font('Helvetica-Bold').text('Subnº:', rightColX, itemTopY).font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, rightColX + valueOffsetX, itemTopY);
    doc.font('Helvetica-Bold').text('Data incorporação:', rightColX, itemTopY + 15).font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, rightColX + valueOffsetX, itemTopY + 15);
    doc.font('Helvetica-Bold').text('Nº Série:', rightColX, itemTopY + 30).font('Helvetica').text(`${item.numero_serie || 'N/A'}`, rightColX + valueOffsetX, itemTopY + 30);
    
    doc.y = Math.max(finalLeftY, itemTopY + 45);

    doc.moveDown(1.5);
    doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(1.5);
}

module.exports = {
    handlePdfReportRequest
};