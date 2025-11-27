require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const path = require('path');
const url = require('url');
const fs = require('fs');

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
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 30, bottom: 50, left: 30, right: 30 },
        autoFirstPage: false 
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    let pageNumber = 0;

    // --- FUNÇÕES DE DESENHO ---

    function drawHeader() {
        pageNumber++;
        
        let logoPath = null;
        try {
            const possiblePath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
            if (fs.existsSync(possiblePath)) logoPath = possiblePath;
        } catch (e) {}

        if (logoPath) {
            doc.image(logoPath, 30, 30, { width: 100 });
        }

        const headerX = 150;
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000")
           .text("RELATÓRIO DE IMOBILIZADOS", headerX, 35, { align: 'left' });
        
        doc.fontSize(9).font("Helvetica").fillColor("#555");
        doc.text(`Centro de Custo: ${centro_custo}`, headerX, 55);
        doc.text(`Setor: ${centro_custo_nome || ''}`, headerX, 68);
        
        const agora = new Date();
        doc.text(`Emissão: ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`, headerX, 81);

        doc.moveTo(30, 100).lineTo(565, 100).strokeColor("#333").lineWidth(1.5).stroke();
        
        // Define o início do conteúdo útil da página
        doc.y = 115; 
    }

    function drawFooter() {
        const bottomY = doc.page.height - 40;
        doc.fontSize(8).fillColor("#999");
        doc.text("Sistema de Controle de Ativos - Videplast", 30, bottomY, { align: "left", continued: false });
        doc.text(`Página ${pageNumber}`, 500, bottomY, { align: "right", width: 65 });
    }

    function startNewPage() {
        if (pageNumber > 0) {
            drawFooter(); // Fecha a página anterior
        }
        doc.addPage();
        drawHeader(); // Inicia a nova
    }

    // Função CRÍTICA: Verifica se cabe
    function checkSpace(heightNeeded) {
        const limitY = doc.page.height - 50; // Margem inferior segura
        if (doc.y + heightNeeded > limitY) {
            startNewPage();
            return true; // Indicador que mudou de página
        }
        return false;
    }

    // --- INÍCIO DO RELATÓRIO ---
    startNewPage();

    data.forEach((item, index) => {
        // Dados
        const descricao = item.descricao || "SEM DESCRIÇÃO";
        const imob = item.codigo_imobilizado || "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario || "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        const invAntigo = item.codigo_inventario_antigo || "-";
        const dataInc = item.data_incorporacao ? new Date(item.data_incorporacao).toLocaleDateString('pt-BR') : "-";

        // Cálculo de Altura
        doc.fontSize(9).font("Helvetica");
        const descHeight = doc.heightOfString(descricao, { width: 515, align: 'justify' });
        // Altura Fixa (Cabeçalho do Item) + Altura Variável (Descrição) + Margem (20px)
        const itemTotalHeight = 65 + descHeight + 10;

        // Verifica espaço ANTES de começar a desenhar
        checkSpace(itemTotalHeight);

        const startY = doc.y;

        // Fundo Zebrado
        if (index % 2 === 0) {
            doc.rect(30, startY - 5, 535, itemTotalHeight).fillColor("#F5F5F5").fill();
        }
        
        doc.fillColor("#000");

        // Linha 1 (Grid)
        const row1 = startY;
        const row2 = startY + 12;
        
        const col = (lbl, val, x, w) => {
            doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(lbl, x, row1, { width: w, lineBreak: false });
            doc.fontSize(9).font("Helvetica").fillColor("#000").text(val, x, row2, { width: w, lineBreak: false });
        };

        col("IMOBILIZADO", imob, 35, 70);
        col("SUBNº", sub, 105, 40);
        col("INVENTÁRIO", inv, 150, 70);
        col("INV. ANTIGO", invAntigo, 225, 70);
        col("DATA INC.", dataInc, 300, 65);
        col("LOCAL", local, 370, 90);
        col("SÉRIE", serie, 465, 95);

        // Linha 2 (Descrição)
        const descLabelY = row2 + 20;
        const descTextY = descLabelY + 10;

        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text("DESCRIÇÃO", 35, descLabelY);
        doc.fontSize(9).font("Helvetica").fillColor("#000")
           .text(descricao, 35, descTextY, { width: 515, align: 'justify' });

        // Espaçamento final
        doc.moveDown(0.5); 
        
        // Linha pontilhada apenas se não for o último item da página
        const nextY = doc.y + 10;
        if (nextY < doc.page.height - 50) {
             doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
             doc.moveDown(0.5);
        }
    });

    drawFooter(); // Fecha a última página
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};