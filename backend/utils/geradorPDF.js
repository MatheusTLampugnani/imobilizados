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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
    }
}

function gerarRelatorioPDF({ data, centro_custo, centro_custo_nome }, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 40, autoFirstPage: false });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    function drawHeader() {
        try {
            doc.image(path.join(__dirname, '..', 'assets', 'videplast-brand.png'), {
                fit: [100, 50],
                align: 'center',
                x: (doc.page.width - 100) / 2,
                y: 30
            });
        } catch (e) {
            console.log("Logo não encontrado, gerando sem imagem.");
        }
        
        doc.moveDown(4);

        doc.fontSize(16).font("Helvetica-Bold").fillColor("#333")
            .text("RELATÓRIO DE IMOBILIZADOS", { align: "center" });

        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica")
            .text(`Centro de Custo: ${centro_custo} - ${centro_custo_nome}`, { align: "center" });

        doc.moveDown(0.5);
        doc.moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .strokeColor("#AAAAAA")
            .lineWidth(1)
            .stroke();

        doc.moveDown(1);
    }

    function drawFooter() {
        const bottomY = doc.page.height - 40;
        const datetime = new Date().toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        doc.fontSize(8).fillColor("#666");

        doc.text(`Gerado em: ${datetime}`,
            doc.page.margins.left,
            bottomY,
            { align: "left" }
        );

        doc.text(
            `Página ${doc.pageNumber}`,
            doc.page.margins.left,
            bottomY,
            {
                align: "right",
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            }
        );
    }

    function newPage() {
        doc.addPage();
        drawHeader();
        drawFooter();
    }

    newPage();

    data.forEach(item => {
        doc.fontSize(9).font("Helvetica");
        const descWidth = 380;
        const descText = item.descricao || "Sem descrição";
        const descHeight = doc.heightOfString(descText, { width: descWidth });
        
        const itemBlockHeight = 85 + descHeight; 

        if (doc.y + itemBlockHeight > doc.page.height - 50) {
            newPage();
        }

        drawItem(doc, item, descHeight);
    });

    doc.end();
}

function drawItem(doc, item, descHeight) {
    const leftX = doc.page.margins.left;
    const rightX = 320;
    const labelOffset = 110;
    const valueX = leftX + labelOffset;
    const valueXRight = rightX + 60;

    const startY = doc.y;
    let currentY = startY;

    doc.fontSize(9).fillColor("#333");

    doc.font("Helvetica-Bold").text("Imobilizado:", leftX, currentY);
    doc.font("Helvetica").text(item.codigo_imobilizado || "Sem código", valueX, currentY);
    
    doc.font("Helvetica-Bold").text("Subnº:", rightX, currentY);
    doc.font("Helvetica").text(item.sub_numero, valueXRight, currentY);
    
    currentY += 14;

    doc.font("Helvetica-Bold").text("Nº Inventário:", leftX, currentY);
    doc.font("Helvetica").text(item.codigo_inventario || "Sem código", valueX, currentY);

    doc.font("Helvetica-Bold").text("Data Incorp.:", rightX, currentY);
    
    let dataFormatada = item.data_incorporacao;
    try {
        if (item.data_incorporacao) {
            const dateObj = new Date(item.data_incorporacao);
            dataFormatada = dateObj.toLocaleDateString('pt-BR');
        }
    } catch (e) {}

    doc.font("Helvetica").text(dataFormatada || "Sem data", valueXRight, currentY);

    currentY += 14;

    doc.font("Helvetica-Bold").text("Inv. Antigo:", leftX, currentY);
    doc.font("Helvetica").text(item.codigo_inventario_antigo || "", valueX, currentY);

    doc.font("Helvetica-Bold").text("Local:", rightX, currentY);
    doc.font("Helvetica").text(item.local || "Não informado", valueXRight, currentY);

    currentY += 14;

    doc.font("Helvetica-Bold").text("Descrição:", leftX, currentY);
    
    const descY = currentY;
    
    doc.font("Helvetica").text(item.descricao || "Sem descrição", valueX, descY, { 
        width: 380,
        align: 'left'
    });

    currentY = descY + Math.max(descHeight, 14) + 6; 

    doc.font("Helvetica-Bold").text("Nº Série:", leftX, currentY);
    doc.font("Helvetica").text(item.numero_serie || "Sem número", valueX, currentY);

    currentY += 18;

    doc.moveTo(leftX, currentY)
        .lineTo(doc.page.width - doc.page.margins.right, currentY)
        .strokeColor("#DDDDDD")
        .lineWidth(0.5)
        .stroke();

    doc.y = currentY + 10;
}

module.exports = {
    handlePdfReportRequest
};