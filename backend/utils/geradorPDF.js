require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const url = require('url');
const puppeteer = require('puppeteer');

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

<<<<<<< HEAD
// --- Geração de PDF (Versão Final e Robusta) ---
async function gerarRelatorioPDF({ data, centro_custo }, res) {
=======
function gerarRelatorioPDF({ data, centro_custo }, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
>>>>>>> 361f6fbfffe8bbb11f068e92921af31ba09546d6
    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

<<<<<<< HEAD
    let browser = null;
    try {
        // Gera o conteúdo HTML
        const htmlContent = gerarHTMLdoRelatorio(data, centro_custo);

        // Inicia o Puppeteer
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        // Define o conteúdo da página como o nosso HTML
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Gera o PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                right: '40px',
                bottom: '40px',
                left: '40px'
            }
        });

        // Envia o PDF como resposta
        res.end(pdfBuffer);

    } catch (error) {
        console.error("Erro ao gerar PDF com Puppeteer:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no servidor: ${error.message}` }));
    } finally {
        // Fecha o navegador para liberar recursos
        if (browser) {
            await browser.close();
        }
    }
}


// Função para desenhar o cabeçalho da página
function drawHeader(doc, centro_custo) {
    const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { fit: [150, 150], align: 'center', y: 30 });
    }
    doc.moveDown(4);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, doc.page.margins.left);
    doc.moveDown(0.5);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#aaaaaa").lineWidth(1).stroke();
    doc.moveDown(2);
}

// Função para desenhar o rodapé da página
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

// Função para desenhar um item com o layout aprimorado
=======
    const drawHeader = (doc) => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [150, 150], align: 'center', y: 30 });
        }
        doc.moveDown(4);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, doc.page.margins.left);
        doc.moveDown(0.5);
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#aaaaaa").lineWidth(1).stroke();
        doc.moveDown(1);
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
    
    drawHeader(doc);

    data.forEach((item) => {
        const estimatedHeight = 100;
        if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            drawHeader(doc);
        }
        drawItem(doc, item);
    });

    drawFooter(doc);
    doc.end();
}

>>>>>>> 361f6fbfffe8bbb11f068e92921af31ba09546d6
function drawItem(doc, item) {
    const leftColX = doc.page.margins.left;
    const rightColX = 320;
    const labelWidth = 110;
    const valueOffsetX = 115;
    
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');

    let y = doc.y;
    doc.text('Imobilizado:', leftColX, y)
       .font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, leftColX + valueOffsetX, y);
    doc.font('Helvetica-Bold').text('Subnº:', rightColX, y)
       .font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, rightColX + valueOffsetX, y);
    y = doc.y;
    doc.font('Helvetica-Bold').text('Número de inventário:', leftColX, y)
       .font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, leftColX + valueOffsetX, y);
    doc.font('Helvetica-Bold').text('Data incorporação:', rightColX, y)
       .font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, rightColX + valueOffsetX, y);
    y = doc.y;
    doc.font('Helvetica-Bold').text('Inventário Antigo:', leftColX, y)
       .font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, leftColX + valueOffsetX, y);
    y = doc.y;
    doc.font('Helvetica-Bold').text('Descrição:', leftColX, y)
       .font('Helvetica').text(`${item.descricao || 'N/A'}`, leftColX + valueOffsetX, y, { width: 400 });
    const descHeight = doc.heightOfString(`${item.descricao || 'N/A'}`, { width: 400 });
    const serieY = y + descHeight;
    doc.font('Helvetica-Bold').text('Nº Série:', leftColX, serieY)
       .font('Helvetica').text(`${item.numero_serie || 'N/A'}`, leftColX + valueOffsetX, serieY);
    doc.y = serieY + 15;
    doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(1.5);
}

module.exports = {
    handlePdfReportRequest
};