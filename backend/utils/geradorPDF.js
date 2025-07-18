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
    const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40, 
        bufferPages: true // Essencial para o rodapé funcionar
    });
    
    const filename = `Relatorio_CC_${centro_custo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // --- FUNÇÕES DE DESENHO ---

    const drawHeader = (doc) => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
        
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, {
                fit: [150, 150],
                align: 'center',
                y: 30
            });
        }

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('Relatório de Imobilizados', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, { align: 'center' });
        doc.moveDown(1);
    };

    const drawFooter = (doc) => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            
            // Define uma posição Y segura, bem dentro da margem inferior
            const yPos = doc.page.height - 35;

            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
            doc.text(`Página ${i + 1} de ${pageCount}`, doc.page.margins.left, yPos, { 
                align: 'right', 
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right 
            });
        }
    };
    
    const drawItem = (doc, item) => {
        const leftColX = doc.page.margins.left;
        const rightColX = 320; // Posição da segunda coluna
        const labelWidth = 85;
        const valueWidth = 180;

        doc.font('Helvetica-Bold').fontSize(8);
        doc.fillColor('#333');

        // Linha 1
        doc.text('Imobilizado:', leftColX, doc.y);
        doc.font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, leftColX + labelWidth);
        doc.font('Helvetica-Bold').text('Subnº:', rightColX, doc.y - doc.currentLineHeight());
        doc.font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, rightColX + labelWidth);

        // Linha 2
        doc.font('Helvetica-Bold').text('Inventário:', leftColX);
        doc.font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, leftColX + labelWidth);
        doc.font('Helvetica-Bold').text('Data Incorporação:', rightColX, doc.y - doc.currentLineHeight());
        doc.font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, rightColX + labelWidth);

        // Linha 3
        doc.font('Helvetica-Bold').text('Inventário Antigo:', leftColX);
        doc.font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, leftColX + labelWidth);
        doc.font('Helvetica-Bold').text('Nº Série:', rightColX, doc.y - doc.currentLineHeight());
        doc.font('Helvetica').text(`${item.numero_serie || 'N/A'}`, rightColX + labelWidth);

        // Linha 4 (Descrição com quebra de linha)
        const currentY = doc.y;
        doc.font('Helvetica-Bold').text('Descrição:', leftColX, currentY);
        doc.font('Helvetica').text(`${item.descricao || 'N/A'}`, leftColX + labelWidth, currentY, { width: 425 });

        // Linha divisória
        doc.moveDown(2);
        doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
        doc.moveDown(2);
    };

    drawHeader(doc);

    data.forEach((item, index) => {
        // Lógica de quebra de página
        const pageBottom = doc.page.height - doc.page.margins.bottom;
        const estimatedHeight = 100; // Altura segura estimada para cada item

        if (doc.y + estimatedHeight > pageBottom) {
            doc.addPage();
            drawHeader(doc);
        }
        drawItem(doc, item);
    });

    drawFooter(doc);
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};