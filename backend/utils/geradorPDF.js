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
        
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [150, 150], align: 'center', y: 30 });
        }

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('Relatório de Imobilizados', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, { align: 'center' });
        doc.moveDown(2);
    };

    const drawFooter = (doc) => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            const yPos = doc.page.height - 35;
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
            doc.text(`Página ${i + 1} de ${pageCount}`, 0, yPos, { 
                align: 'right', 
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right 
            });
        }
    };
    
    const drawTable = (doc, data) => {
        const tableTop = doc.y;
        const tableLeft = doc.page.margins.left;
        
        const columnHeaders = ["Imobilizado", "Inventário", "Subnº", "Descrição", "Nº Série"];
        const columnWidths = [70, 70, 40, 255, 80];
        
        let y = tableTop;

        const drawTableHeader = () => {
            let x = tableLeft;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
            
            doc.rect(tableLeft, y, columnWidths.reduce((a, b) => a + b, 0), 20).fill('#292e33');

            columnHeaders.forEach((header, i) => {
                doc.text(header, x + 5, y + 5, { width: columnWidths[i] - 10, align: 'left' });
                x += columnWidths[i];
            });
            y += 25;
        };

        const drawTableRow = (item) => {
            const rowHeight = calculateRowHeight(doc, item, columnWidths);
            
            if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                drawHeader(doc);
                y = doc.y;
                drawTableHeader();
            }

            let x = tableLeft;
            const startY = y;
            doc.font('Helvetica').fontSize(8).fillColor('#333333');

            doc.text(item.codigo_imobilizado || 'N/A', x + 5, startY + 5, { width: columnWidths[0] - 10 });
            x += columnWidths[0];
            doc.text(item.codigo_inventario || 'N/A', x + 5, startY + 5, { width: columnWidths[1] - 10 });
            x += columnWidths[1];
            doc.text(item.sub_numero ?? 'N/A', x + 5, startY + 5, { width: columnWidths[2] - 10, align: 'center' });
            x += columnWidths[2];
            doc.text(item.descricao || 'N/A', x + 5, startY + 5, { width: columnWidths[3] - 10 });
            x += columnWidths[3];
            doc.text(item.numero_serie || 'N/A', x + 5, startY + 5, { width: columnWidths[4] - 10 });
            
            y += rowHeight + 10;
        };
        
        drawTableHeader();
        data.forEach(drawTableRow);
    };
    
    const calculateRowHeight = (doc, item, widths) => {
        const heights = [
            doc.heightOfString(item.codigo_imobilizado || 'N/A', { width: widths[0] - 10 }),
            doc.heightOfString(item.codigo_inventario || 'N/A', { width: widths[1] - 10 }),
            doc.heightOfString(item.descricao || 'N/A', { width: widths[3] - 10 }),
            doc.heightOfString(item.numero_serie || 'N/A', { width: widths[4] - 10 }),
        ];
        return Math.max(...heights);
    };

    drawHeader(doc);
    drawTable(doc, data);
    drawFooter(doc);
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};