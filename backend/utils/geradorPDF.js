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
            res.end(JSON.stringify({ message: `Erro no banco de dados: ${dbError.message}` }));
        }
    }
}

function gerarRelatorioPDF({ data, centro_custo, centro_custo_nome }, res) {
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 110, bottom: 50, left: 30, right: 30 },
        autoFirstPage: true
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.on('pageAdded', () => {
        desenharCabecalho(doc, centro_custo, centro_custo_nome);
        desenharRodape(doc);
    });

    desenharCabecalho(doc, centro_custo, centro_custo_nome);
    desenharRodape(doc);
    
    data.forEach((item, index) => {
        const descricao = item.descricao || "SEM DESCRIÇÃO";
        const imob = item.codigo_imobilizado || "-";
        const sub = String(item.sub_numero);
        const inv = item.codigo_inventario || "-";
        const local = item.local || "-";
        const serie = item.numero_serie || "-";
        const dataInc = item.data_incorporacao ? new Date(item.data_incorporacao).toLocaleDateString('pt-BR') : "-";

        doc.fontSize(9).font("Helvetica");
        const descHeight = doc.heightOfString(descricao, { width: 515, align: 'justify' });
        const boxHeight = 60 + descHeight; 

        if (doc.y + boxHeight > doc.page.height - 50) {
            doc.addPage();
        }

        const startY = doc.y;

        if (index % 2 === 0) {
            doc.rect(30, startY - 5, 535, boxHeight).fillColor("#F5F5F5").fill();
        }
        
        doc.fillColor("#000");

        const row1 = startY;
        const row2 = startY + 12;
        
        const col = (lbl, val, x, w) => {
            doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(lbl, x, row1, { width: w });
            doc.fontSize(9).font("Helvetica").fillColor("#000").text(val, x, row2, { width: w });
        };

        col("IMOBILIZADO", imob, 35, 70);
        col("SUBNº", sub, 105, 40);
        col("INVENTÁRIO", inv, 150, 80);
        col("DATA", dataInc, 240, 70);
        col("LOCAL", local, 320, 110);
        col("SÉRIE", serie, 440, 90);

        const descY = row2 + 20;
        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text("DESCRIÇÃO", 35, descY - 10);
        doc.fontSize(9).font("Helvetica").fillColor("#000")
           .text(descricao, 35, descY, { width: 515, align: 'justify' });

        doc.moveDown(1);
        
        doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor("#DDD").lineWidth(0.5).stroke();
        doc.moveDown(0.5);
    });

    doc.end();
}

function desenharCabecalho(doc, cc, ccNome) {
    const oldY = doc.y;
    
    try {
        const logoPath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
        doc.image(logoPath, 30, 30, { width: 90 });
    } catch (e) {}

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000")
       .text("RELATÓRIO DE IMOBILIZADOS", 140, 35, { align: 'left' });

    doc.fontSize(9).font("Helvetica").fillColor("#444");
    doc.text(`Centro de Custo: ${cc}`, 140, 55);
    doc.text(`Setor: ${ccNome || ''}`, 140, 68);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 400, 55, { align: 'right' });

    doc.moveTo(30, 90).lineTo(565, 90).strokeColor("#000").lineWidth(1.5).stroke();

    doc.y = 110;
}

function desenharRodape(doc) {
    const bottom = doc.page.height - 40;
    
    doc.fontSize(8).fillColor("#999");
    doc.text("Sistema de Controle de Ativos - Videplast", 30, bottom, { align: 'left', continued: false });
    
    const range = doc.bufferedPageRange();
    doc.text(`Página ${range.count + 1}`, 500, bottom, { align: 'right', width: 65 });
}

module.exports = {
    handlePdfReportRequest
};