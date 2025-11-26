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
        doc.image(path.join(__dirname, '..', 'assets', 'videplast-brand.png'), {
            fit: [75, 75],
            align: 'center',
            y: doc.y
        });
        doc.moveDown(4);

        doc.fontSize(16).font("Helvetica-Bold").fillColor("#333")
            .text("RELATÓRIO DE IMOBILIZADOS", { align: "center" });

        doc.moveDown(1);
        doc.fontSize(11).font("Helvetica")
            .text(`Centro de Custo: ${centro_custo} - ${centro_custo_nome}`);

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
        const spaceNeeded = 120;

        if (doc.y + spaceNeeded > doc.page.height - 60) {
            newPage();
        }

        drawItem(doc, item);
    });

    doc.end();
}

function drawItem(doc, item) {
    const leftX = doc.page.margins.left;
    const rightX = 320;
    const valueOffsetX = 115;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#333");

    let y = doc.y;
    doc.text("Imobilizado:", leftX, y)
       .font("Helvetica").text(item.codigo_imobilizado || "Sem código", leftX + valueOffsetX, y);

    doc.font("Helvetica-Bold").text("Subnº:", rightX, y)
       .font("Helvetica").text(item.sub_numero, rightX + valueOffsetX, y);

    y = doc.y;
    doc.font("Helvetica-Bold").text("Número de inventário:", leftX, y)
       .font("Helvetica").text(item.codigo_inventario || "Sem código", leftX + valueOffsetX, y);

    doc.font("Helvetica-Bold").text("Data incorporação:", rightX, y)
       .font("Helvetica").text(item.data_incorporacao || "Sem data", rightX + valueOffsetX, y);

    y = doc.y;
    doc.font("Helvetica-Bold").text("Inventário Antigo:", leftX, y)
       .font("Helvetica").text(item.codigo_inventario_antigo || "", leftX + valueOffsetX, y);

    doc.font("Helvetica-Bold").text("Local:", rightX, y)
       .font("Helvetica").text(item.local || "Não informado", rightX + valueOffsetX, y);

    y = doc.y;
    doc.font("Helvetica-Bold").text("Descrição:", leftX, y);
    doc.font("Helvetica").text(item.descricao || "Sem descrição", leftX + valueOffsetX, y, { width: 400 });

    const descHeight = doc.heightOfString(item.descricao || "Sem descrição", { width: 400 });
    const serieY = y + descHeight;

    doc.font("Helvetica-Bold").text("Nº Série:", leftX, serieY)
       .font("Helvetica").text(item.numero_serie || "Sem número", leftX + valueOffsetX, serieY);

    doc.y = serieY + 15;

    doc.moveTo(leftX, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .strokeColor("#CCCCCC")
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(1.5);
}

module.exports = {
    handlePdfReportRequest
};
