require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const path = require('path');
const url = require('url');
const fs = require('fs'); // Importante para verificar se a imagem existe

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

    try {
        const { data, error } = await supabase
            .from('imobilizados')
            .select('*')
            .eq('centro_custo', centro_custo)
            .order('codigo_imobilizado', { ascending: true })
            .order('sub_numero', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                message: `Nenhum imobilizado encontrado para o Centro de Custo ${centro_custo}.`
            }));
        }

        const { data: centroCustoData } = await supabase
            .from('centro_de_custo')
            .select('setores')
            .eq('centro_custo', centro_custo)
            .single();

        gerarRelatorioPDF(
            {
                data,
                centro_custo,
                centro_custo_nome: centroCustoData ? centroCustoData.setores : ""
            },
            res
        );

    } catch (dbError) {
        console.error('ERRO AO GERAR PDF:', dbError);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Erro no servidor: ${dbError.message}` }));
        }
    }
}

function gerarRelatorioPDF({ data, centro_custo, centro_custo_nome }, res) {
    // Margens ajustadas para segurança
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 30, bottom: 40, left: 30, right: 30 },
        autoFirstPage: false // Vamos criar manualmente para ter controle total
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // --- SETUP DE IMAGEM SEGURO ---
    // Tenta resolver o caminho da imagem de forma robusta para o Render
    let logoPath = null;
    try {
        const possiblePath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
        if (fs.existsSync(possiblePath)) {
            logoPath = possiblePath;
        }
    } catch (e) {
        console.warn("Aviso: Logo não encontrado ou erro de acesso.", e);
    }

    // --- FUNÇÕES DE DESENHO ---

    function drawHeader() {
        // Logo (Só desenha se o caminho for válido e existir)
        if (logoPath) {
            try {
                doc.image(logoPath, 30, 20, { width: 100 });
            } catch (imgErr) {
                console.error("Erro ao desenhar imagem no PDF:", imgErr);
            }
        }

        const headerX = 150;
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000")
           .text("RELATÓRIO DE IMOBILIZADOS", headerX, 25, { align: 'left' });
        
        doc.fontSize(9).font("Helvetica").fillColor("#555");
        doc.text(`Centro de Custo: ${centro_custo}`, headerX, 45);
        doc.text(`Setor: ${centro_custo_nome || ''}`, headerX, 58);
        
        // Data formatada
        const agora = new Date();
        const dataStr = agora.toLocaleDateString('pt-BR');
        const horaStr = agora.toLocaleTimeString('pt-BR');
        doc.text(`Emissão: ${dataStr} ${horaStr}`, headerX, 71);

        // Linha Divisória
        doc.moveTo(30, 90).lineTo(565, 90).strokeColor("#333").lineWidth(2).stroke();
        
        // Define onde começa o conteúdo dessa página
        doc.y = 105; 
    }

    function drawFooter() {
        const bottomY = doc.page.height - 30;
        doc.fontSize(8).fillColor("#999");
        
        // Texto Esquerda
        doc.text("Sistema de Controle de Ativos - Videplast", 30, bottomY, { align: "left", continued: false });
        
        // Paginação Direita
        const range = doc.bufferedPageRange();
        doc.text(`Página ${range.count}`, 500, bottomY, { align: "right", width: 65 });
    }

    function startNewPage() {
        // Se já tiver páginas, desenha o rodapé da anterior antes de criar a nova
        if (doc.bufferedPageRange().count > 0) {
            drawFooter();
        }
        
        doc.addPage();
        drawHeader();
    }

    // --- INÍCIO ---
    startNewPage();

    // --- LOOP DE ITENS ---
    data.forEach((item, index) => {
        // Preparar Textos
        const descricao = item.descricao || "SEM DESCRIÇÃO";
        const imob = item.codigo_imobilizado || "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario || "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        const invAntigo = item.codigo_inventario_antigo || "-";
        
        let dataInc = "-";
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch(e){}
        }

        // Calcular Altura
        doc.fontSize(9).font("Helvetica");
        // Largura útil para descrição
        const descHeight = doc.heightOfString(descricao, { width: 515, align: 'justify' });
        // Altura fixa do cabeçalho do item (linhas de dados) + altura dinâmica da descrição + margens
        const itemTotalHeight = 65 + descHeight;

        // Verificar Espaço Restante
        // Se a posição atual + altura do item passar do limite seguro (altura pag - 50px de rodapé)
        if (doc.y + itemTotalHeight > doc.page.height - 50) {
            startNewPage();
        }

        // --- DESENHAR O ITEM ---
        const startY = doc.y;

        // Fundo Zebrado (Cinza claro nos pares)
        if (index % 2 === 0) {
            doc.rect(30, startY - 5, 535, itemTotalHeight).fillColor("#F5F5F5").fill();
        }
        
        doc.fillColor("#000"); // Reseta cor para texto preto

        // Linha 1: Dados Técnicos (Grid)
        const row1 = startY;
        const row2 = startY + 12;
        
        // Helper interno para colunas
        const col = (lbl, val, x, w) => {
            doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(lbl, x, row1, { width: w, lineBreak: false });
            doc.fontSize(9).font("Helvetica").fillColor("#000").text(val, x, row2, { width: w, lineBreak: false });
        };

        // Distribuição Horizontal
        col("IMOBILIZADO", imob, 35, 70);
        col("SUBNº", sub, 105, 40);
        col("INVENTÁRIO", inv, 150, 70);
        col("INV. ANTIGO", invAntigo, 225, 70);
        col("DATA INC.", dataInc, 300, 65);
        col("LOCAL", local, 370, 90);
        col("SÉRIE", serie, 465, 95);

        // Linha 2: Descrição
        const descLabelY = row2 + 18;
        const descTextY = descLabelY + 10;

        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text("DESCRIÇÃO", 35, descLabelY);
        
        doc.fontSize(9).font("Helvetica").fillColor("#000")
           .text(descricao, 35, descTextY, {
               width: 515,
               align: 'justify'
           });

        // Divisor Fino
        doc.moveDown(0.5);
        doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
        doc.moveDown(0.5);
    });

    // Finaliza desenhando o rodapé da última página
    drawFooter();
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};