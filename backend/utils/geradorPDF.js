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

    // Função para desenhar o cabeçalho
    const drawHeader = () => {
        const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'videplast_logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [150, 150], align: 'center', y: 30 });
        }
        doc.moveDown(4);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333').text('RELATÓRIO DE IMOBILIZADOS', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica').text(`Centro de Custo: ${centro_custo}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#aaaaaa").lineWidth(1).stroke();
        doc.moveDown(1);
    };

    // Função para desenhar o rodapé
    const drawFooter = () => {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            // Adiciona o rodapé apenas se não for a última página e o conteúdo não estiver no final
            const yPos = doc.page.height - 35;
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            doc.text(`Gerado em: ${datetime}`, doc.page.margins.left, yPos, { align: 'left' });
            doc.text(`Página ${i + 1} de ${pages.count}`, 0, yPos, { 
                align: 'right', 
                width: doc.page.width - doc.page.margins.right // Ajuste na largura para alinhar corretamente
            });
        }
    };

    // Adiciona o cabeçalho na primeira página
    drawHeader();

    // Registra o evento para adicionar o cabeçalho em cada nova página
    doc.on('pageAdded', drawHeader);

    // Itera e desenha cada item, deixando o pdfkit gerenciar a quebra de página
    data.forEach(item => {
        drawItem(doc, item);
    });

    // Finaliza o documento e desenha o rodapé em todas as páginas
    drawFooter();
    doc.end();
}

function drawItem(doc, item) {
    const leftColX = doc.page.margins.left;
    const rightColX = 320;
    const valueOffsetX = 115; // Deslocamento para o valor
    const initialY = doc.y;

    // Verifica se o bloco inteiro caberá na página, senão, adiciona uma nova página
    const estimatedHeight = 100; // Uma estimativa segura para a altura do item
    if (initialY + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const y = doc.y; // Pega a posição Y atual

    // Coluna da Esquerda
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Imobilizado:', leftColX, y);
    doc.font('Helvetica').text(`${item.codigo_imobilizado || 'N/A'}`, leftColX + valueOffsetX, y);

    doc.font('Helvetica-Bold').text('Número de inventário:', leftColX, doc.y);
    doc.font('Helvetica').text(`${item.codigo_inventario || 'N/A'}`, leftColX + valueOffsetX, doc.y);
    
    doc.font('Helvetica-Bold').text('Inventário Antigo:', leftColX, doc.y);
    doc.font('Helvetica').text(`${item.codigo_inventario_antigo || 'N/A'}`, leftColX + valueOffsetX, doc.y);

    // Coluna da Direita (alinhada com a coluna da esquerda)
    let rightY = y;
    doc.font('Helvetica-Bold').text('Subnº:', rightColX, rightY);
    doc.font('Helvetica').text(`${item.sub_numero ?? 'N/A'}`, rightColX + valueOffsetX, rightY);
    rightY += 15; // Espaçamento vertical para o próximo item
    doc.font('Helvetica-Bold').text('Data incorporação:', rightColX, rightY);
    doc.font('Helvetica').text(`${item.data_incorporacao || 'N/A'}`, rightColX + valueOffsetX, rightY);

    // Descrição e Nº de Série (ocupam a largura total)
    doc.moveDown();
    const finalY = doc.y;
    doc.font('Helvetica-Bold').text('Descrição:', leftColX, finalY);
    doc.font('Helvetica').text(`${item.descricao || 'N/A'}`, leftColX + valueOffsetX, finalY, { width: 400 });
    
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Nº Série:', leftColX, doc.y);
    doc.font('Helvetica').text(`${item.numero_serie || 'N/A'}`, leftColX + valueOffsetX, doc.y);

    // Linha separadora
    doc.moveDown(1.5);
    doc.moveTo(leftColX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.moveDown(1.5);
}


module.exports = {
    handlePdfReportRequest
};
