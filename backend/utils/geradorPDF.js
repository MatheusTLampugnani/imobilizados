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
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
        const centerX = (doc.page.width - 120) / 2;

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, centerX, 30, { width: 120 });
        }

        doc.moveDown(3);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, doc.page.margins.left, doc.y, { align: 'left' });
        doc.moveDown(0.5);
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#000000").lineWidth(1).stroke();
        doc.moveDown(1);
    };

    const drawFooter = (doc) => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            const yPos = doc.page.height - 30; // Posição segura dentro da margem
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            doc.fontSize(8).font('Helvetica').fillColor('#000');
            doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
            doc.text(`Página ${i + 1} de ${pageCount}`, 0, yPos, { align: 'right', width: doc.page.width - doc.page.margins.right });
        }
    };

    drawHeader(doc);

    data.forEach((item, index) => {
        const startY = doc.y;
        
        escreverItem(doc, item);

        const endY = doc.y;
        const itemHeight = endY - startY;

        if (index < data.length - 1 && (doc.y + itemHeight > doc.page.height - doc.page.margins.bottom)) {
            doc.addPage();
            drawHeader(doc);
        }
    });

    drawFooter(doc);
    doc.end();
}

function escreverItem(doc, item) {
    const y = doc.y;
    doc.fontSize(9).fillColor('#000');

    doc.font('Helvetica-Bold').text('Imobilizado:', 40, y).font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, 130, y);
    doc.font('Helvetica-Bold').text('Subnº:', 250, y).font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, 350, y);

    doc.font('Helvetica-Bold').text('Inventário:', 40, doc.y).font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, 130, doc.y);
    doc.font('Helvetica-Bold').text('Data Incorporação:', 250, doc.y).font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, 350, doc.y);

    doc.font('Helvetica-Bold').text('Inventário Antigo:', 40, doc.y).font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, 130, doc.y);
    doc.font('Helvetica-Bold').text('Nº Série:', 250, doc.y).font('Helvetica').text(`${item.numero_serie || 'N/A'}`, 350, doc.y);
    
    doc.font('Helvetica-Bold').text('Descrição:', 40, doc.y).font('Helvetica').text(`${item.descricao || 'N/A'}`, 130, doc.y, { width: 425 });

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(1);
}

module.exports = {
    handlePdfReportRequest
};