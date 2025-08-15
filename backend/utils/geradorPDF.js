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

// --- Geração de PDF Otimizada ---
function gerarRelatorioPDF({ data, centro_custo }, res) {
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 40, bottom: 50, left: 40, right: 40 }, // Aumentei a margem inferior
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
        doc.moveDown(2); // Mais espaço após o header
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

// --- Função de Desenho de Item (Versão Final) ---
function drawItem(doc, item) {
    const leftColX = doc.page.margins.left;
    const rightColX = 320;
    const valueOffsetX = 110;
    const itemTopY = doc.y;

    // Estima a altura do item para a quebra de página.
    // O cálculo é baseado na altura da descrição, que é o campo mais variável.
    const descriptionText = `${item.descricao || 'N/A'}`;
    const descriptionHeight = doc.heightOfString(descriptionText, { width: doc.page.width - leftColX - valueOffsetX - doc.page.margins.right });
    const estimatedHeight = 60 + descriptionHeight; // 60 para os campos fixos + altura da descrição

    if (itemTopY + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const y = doc.y; // Posição Y inicial para este item

    // --- Desenha os campos, deixando o PDFKit gerenciar o Y ---
    // Coluna da Esquerda
    doc.font('Helvetica-Bold').fontSize(9).text('Imobilizado:', leftColX, y);
    doc.font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, leftColX + valueOffsetX, y);

    doc.font('Helvetica-Bold').text('Número de inventário:');
    doc.font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, leftColX + valueOffsetX, doc.y - 12); // -12 para alinhar com o label

    doc.font('Helvetica-Bold').text('Inventário Antigo:');
    doc.font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, leftColX + valueOffsetX, doc.y - 12);

    doc.font('Helvetica-Bold').text('Descrição:');
    doc.font('Helvetica').text(descriptionText, leftColX + valueOffsetX, doc.y - 12, {
        width: doc.page.width - leftColX - valueOffsetX - doc.page.margins.right
    });

    doc.font('Helvetica-Bold').text('Nº Série:');
    doc.font('Helvetica').text(`${item.numero_serie || 'N/A'}`, leftColX + valueOffsetX, doc.y - 12);

    const finalLeftY = doc.y;

    // Coluna da Direita (usa a posição Y inicial para alinhar)
    doc.font('Helvetica-Bold').text('Subnº:', rightColX, y);
    doc.font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, rightColX + valueOffsetX, y);

    doc.font('Helvetica-Bold').text('Data incorporação:', rightColX, y + 15);
    doc.font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, rightColX + valueOffsetX, y + 15);

    // Garante que o cursor Y esteja abaixo do conteúdo mais longo (geralmente o da esquerda)
    doc.y = finalLeftY;

    // --- Linha Separadora ---
    doc.moveDown(1.5);
    doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(1.5);
}

module.exports = {
    handlePdfReportRequest
};
