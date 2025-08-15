require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const url = require('url');

// --- Configurações do Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Lógica Principal do Handler ---
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

// --- Geração de PDF (Versão Final e Robusta) ---
function gerarRelatorioPDF({ data, centro_custo }, res) {
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 40, bottom: 50, left: 40, right: 40 },
        bufferPages: true 
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const drawHeader = () => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [150, 150], align: 'center', y: 30 });
        }
        doc.moveDown(4);
        doc.fontSize(16).font('Helvetica-Bold').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`);
        doc.moveDown(0.5);
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#aaaaaa").lineWidth(1).stroke();
        doc.moveDown(2);
    };

    doc.on('pageAdded', drawHeader);
    drawHeader();

    data.forEach(item => {
        drawItem(doc, item);
    });

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const pageNumber = i + 1;
        const yPos = doc.page.height - 35;
        const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
        doc.text(`Página ${pageNumber} de ${range.count}`, 0, yPos, { 
            align: 'right', 
            width: doc.page.width - doc.page.margins.right - doc.page.margins.left
        });
    }

    doc.end();
}

// --- Função para Desenhar um Item (Abordagem Correta) ---
function drawItem(doc, item) {
    const leftColX = doc.page.margins.left;
    const rightColX = 320;
    const valueOffsetX = 110;
    const lineGap = 5;

    // --- Lógica de Quebra de Página ---
    // Estima a altura do item antes de desenhar.
    const descriptionText = item.descricao || 'N/A';
    const descriptionHeight = doc.heightOfString(descriptionText, { width: doc.page.width - (leftColX + valueOffsetX) - doc.page.margins.right });
    const estimatedHeight = 80 + descriptionHeight; // 80 é uma altura segura para os campos fixos.

    if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const itemTopY = doc.y; // Salva a posição Y inicial do item.

    // --- Coluna da Esquerda ---
    // Usamos { continued: true } para não adicionar quebra de linha após o label.
    doc.font('Helvetica-Bold').fontSize(9).text('Imobilizado:', leftColX, itemTopY, { continued: true });
    doc.font('Helvetica').text(` ${item.codigo_imobilizado || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Número de inventário:', leftColX, undefined, { continued: true, lineGap });
    doc.font('Helvetica').text(` ${item.codigo_inventario || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Inventário Antigo:', leftColX, undefined, { continued: true, lineGap });
    doc.font('Helvetica').text(` ${item.codigo_inventario_antigo || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Descrição:', leftColX, undefined, { continued: true, lineGap });
    doc.font('Helvetica').text(` ${descriptionText}`, { width: doc.page.width - (leftColX + valueOffsetX) - doc.page.margins.right });

    doc.font('Helvetica-Bold').text('Nº Série:', leftColX, undefined, { continued: true, lineGap });
    doc.font('Helvetica').text(` ${item.numero_serie || 'N/A'}`);

    const finalLeftY = doc.y; // Posição Y após desenhar a coluna da esquerda.

    // --- Coluna da Direita ---
    // Desenha os campos da direita alinhados com o topo do item.
    doc.font('Helvetica-Bold').text('Subnº:', rightColX, itemTopY, { continued: true });
    doc.font('Helvetica').text(` ${item.sub_numero ?? 'N/A'}`);

    doc.font('Helvetica-Bold').text('Data incorporação:', rightColX, itemTopY + 15, { continued: true });
    doc.font('Helvetica').text(` ${item.data_incorporacao || 'N/A'}`);

    // --- Posicionamento Final e Linha Separadora ---
    // Move o cursor para baixo do conteúdo mais longo (que sempre será o da esquerda).
    doc.y = finalLeftY;
    doc.moveDown(2);
    doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(2);
}

module.exports = {
    handlePdfReportRequest
};
