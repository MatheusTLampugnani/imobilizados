require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
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

        const { data: centroCustoData, error: ccError } = await supabase
            .from('centro_de_custo')
            .select('setores')
            .eq('centro_custo', centro_custo)
            .single();

        if (ccError) console.error("Erro ao buscar nome do CC:", ccError);

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
            res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
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

    function drawHeader() {
        pageNumber++;
        
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
            doc.image(logoPath, 30, 20, { width: 100 });
        } catch (e) { }

        const headerX = 150;
        doc.fontSize(14).font("Helvetica-Bold").text("RELATÓRIO DE IMOBILIZADOS", headerX, 25, { align: 'left' });
        
        doc.fontSize(9).font("Helvetica").fillColor("#555");
        doc.text(`Centro de Custo: ${centro_custo}`, headerX, 45);
        doc.text(`Setor: ${centro_custo_nome}`, headerX, 58);
        doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, headerX, 71);

        doc.moveTo(30, 90).lineTo(565, 90).strokeColor("#333").lineWidth(2).stroke();
        
        doc.y = 105;
    }

    function drawFooter() {
        const bottomY = doc.page.height - 40;
        
        doc.fontSize(8).fillColor("#999");
        doc.text("Sistema de Controle de Ativos", 30, bottomY, { align: "left", continued: false });
        doc.text(`Página ${pageNumber}`, 500, bottomY, { align: "right", width: 65 });
    }

    function checkPageBreak(heightNeeded) {
        const safetyLimit = doc.page.height - doc.page.margins.bottom - 10;

        if (doc.y + heightNeeded > safetyLimit) {
            drawFooter(); 
            doc.addPage();
            drawHeader(); 
            return true;
        }
        return false;
    }

    doc.addPage();
    drawHeader();

    data.forEach((item, index) => {
        const imob = item.codigo_imobilizado || "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario || "-";
        const invAntigo = item.codigo_inventario_antigo || "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        
        let dataInc = "-";
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch(e){}
        }

        const descricao = item.descricao || "SEM DESCRIÇÃO";

        doc.fontSize(9).font("Helvetica");
        const descWidth = 515; 
        const descHeight = doc.heightOfString(descricao, { width: descWidth }) + 10;
        const blockHeight = 65 + descHeight;

        checkPageBreak(blockHeight);

        const startY = doc.y;
        
        if (index % 2 === 0) {
            doc.rect(30, startY - 5, 535, blockHeight).fillColor("#F9F9F9").fill();
        }
        
        doc.fillColor("#000"); 

        const row1Y = startY;
        const row2Y = startY + 12;

        const drawField = (label, value, x, w) => {
            doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(label, x, row1Y, { width: w, align: 'left' });
            doc.fontSize(9).font("Helvetica").fillColor("#000").text(value, x, row2Y, { width: w, align: 'left' });
        };

        drawField("IMOBILIZADO", imob, 35, 70);
        drawField("SUBNº", sub, 105, 40);
        drawField("INVENTÁRIO", inv, 150, 80);
        drawField("INV. ANTIGO", invAntigo, 235, 80);
        drawField("DATA INCORP.", dataInc, 320, 70);
        drawField("LOCAL", local, 400, 100);
        drawField("SÉRIE", serie, 505, 60);

        const descLabelY = row2Y + 18;
        const descTextY = descLabelY + 10;

        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text("DESCRIÇÃO DO ATIVO", 35, descLabelY);
        
        doc.fontSize(9).font("Helvetica").fillColor("#000")
           .text(descricao, 35, descTextY, {
               width: descWidth,
               align: 'justify'
           });

        doc.moveDown(0.5); 
        
        doc.moveTo(30, doc.y)
           .lineTo(565, doc.y)
           .lineWidth(0.5)
           .dash(2, { space: 2 })
           .strokeColor("#CCC")
           .stroke();
        
        doc.undash(); 
        doc.moveDown(0.8); 
    });

    drawFooter(); 
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};