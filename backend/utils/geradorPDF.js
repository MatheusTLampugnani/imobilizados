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
                message: `Nenhum imobilizado encontrado.`
            }));
        }

        const { data: centroCustoData } = await supabase
            .from('centro_de_custo')
            .select('setores')
            .eq('centro_custo', centro_custo)
            .single();

        gerarRelatorioRustico(
            {
                data,
                centro_custo,
                centro_custo_nome: centroCustoData ? centroCustoData.setores : ""
            },
            res
        );

    } catch (dbError) {
        console.error('ERRO PDF:', dbError);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: dbError.message }));
        }
    }
}

function gerarRelatorioRustico({ data, centro_custo, centro_custo_nome }, res) {
    // CONFIGURAÇÕES "RÚSTICAS" (Valores fixos para controle total)
    const PAGE_HEIGHT = 841.89; // Altura A4
    const MARGIN_TOP = 30;
    const MARGIN_BOTTOM = 50;
    const HEADER_HEIGHT = 100; // Espaço reservado para o cabeçalho
    const LIMIT_Y = PAGE_HEIGHT - MARGIN_BOTTOM; // Onde devemos parar de escrever
    
    const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: 30, right: 30 },
        autoFirstPage: false // NÓS criaremos as páginas
    });

    const filename = `Relatorio_CC_${centro_custo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    let pageCount = 0;

    // --- FUNÇÕES DE APOIO ---

    function addPage() {
        // Se não é a primeira página, desenha o rodapé da anterior antes de criar a nova
        if (pageCount > 0) {
            drawFooter();
        }
        
        doc.addPage();
        pageCount++;
        drawHeader();
        
        // Define o cursor Y logo após o cabeçalho
        doc.y = MARGIN_TOP + HEADER_HEIGHT + 10;
    }

    function drawHeader() {
        // Logo
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 30, 30, { width: 100 });
            }
        } catch (e) {}

        const startX = 150;
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000")
           .text("RELATÓRIO DE IMOBILIZADOS", startX, 35, { align: 'left' });
        
        doc.fontSize(9).font("Helvetica").fillColor("#555");
        doc.text(`Centro de Custo: ${centro_custo}`, startX, 55);
        doc.text(`Setor: ${centro_custo_nome || ''}`, startX, 68);
        
        const dataStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
        doc.text(`Emissão: ${dataStr}`, startX, 81);

        // Linha grossa
        const lineY = MARGIN_TOP + HEADER_HEIGHT;
        doc.moveTo(30, lineY).lineTo(565, lineY).strokeColor("#000").lineWidth(2).stroke();
    }

    function drawFooter() {
        const footerY = PAGE_HEIGHT - 30;
        doc.fontSize(8).fillColor("#999");
        doc.text("Videplast - Controle de Ativos", 30, footerY, { align: 'left', continued: false });
        doc.text(`Página ${pageCount}`, 500, footerY, { align: 'right', width: 65 });
    }

    // --- INÍCIO ---
    addPage();

    // --- LOOP PRINCIPAL (LÓGICA RÚSTICA) ---
    data.forEach((item, index) => {
        // 1. Preparar textos (sanitização)
        const descricao = (item.descricao || "SEM DESCRIÇÃO").replace(/[\r\n]+/g, " "); // Remove quebras de linha que bugam o cálculo
        const imob = String(item.codigo_imobilizado || "-");
        const sub = String(item.sub_numero);
        const inv = String(item.codigo_inventario || "-");
        const invAntigo = String(item.codigo_inventario_antigo || "-");
        const local = String(item.local || "-");
        const serie = String(item.numero_serie || "-");
        let dataInc = "-";
        if (item.data_incorporacao) {
            try { dataInc = new Date(item.data_incorporacao).toLocaleDateString('pt-BR'); } catch(e){}
        }

        // 2. Calcular ALTURA REAL necessária
        doc.fontSize(9).font("Helvetica");
        
        // A altura da descrição é a parte variável. Calculamos com precisão.
        const descWidth = 515;
        const descHeight = doc.heightOfString(descricao, { width: descWidth });
        
        // Altura fixa dos outros campos + margens
        // (Linha 1 dados + margem) + (Label Descrição + margem) + (Texto Descrição) + (Margem final)
        const itemTotalHeight = 15 + 15 + descHeight + 15; 

        // 3. O CHECK DECISIVO: Cabe nesta página?
        // Se a posição atual + altura do item for maior que o limite (fim da folha - margem)
        if (doc.y + itemTotalHeight > LIMIT_Y) {
            addPage(); // Cria nova página e reseta o doc.y para o topo
        }

        // 4. Desenhar o item (Agora sabemos que cabe!)
        const startY = doc.y;

        // Fundo zebrado
        if (index % 2 === 0) {
            doc.rect(30, startY - 5, 535, itemTotalHeight).fillColor("#F5F5F5").fill();
        }
        
        doc.fillColor("#000");

        // Linha 1: Grid de Dados
        const row1 = startY;
        const row2 = startY + 12;
        
        // Funçãozinha para desenhar coluna
        const drawCol = (lbl, val, x, w) => {
            doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(lbl, x, row1, { width: w, lineBreak: false });
            doc.fontSize(9).font("Helvetica").fillColor("#000").text(val, x, row2, { width: w, lineBreak: false, ellipsis: true });
        };

        drawCol("IMOBILIZADO", imob, 35, 60);
        drawCol("SUBNº", sub, 100, 30);
        drawCol("INVENTÁRIO", inv, 135, 70);
        drawCol("INV. ANTIGO", invAntigo, 210, 70);
        drawCol("DATA", dataInc, 285, 60);
        drawCol("LOCAL", local, 350, 90);
        drawCol("SÉRIE", serie, 445, 90);

        // Linha 2: Descrição
        const descLabelY = row2 + 15;
        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666").text("DESCRIÇÃO", 35, descLabelY);
        
        const descTextY = descLabelY + 10;
        doc.fontSize(9).font("Helvetica").fillColor("#000")
           .text(descricao, 35, descTextY, { 
               width: descWidth, 
               align: 'justify',
               lineBreak: true 
           });

        // Atualiza Y para o próximo item
        // Forçamos o Y para baixo da descrição desenhada
        doc.y = descTextY + descHeight + 10; 

        // Linha pontilhada separadora
        doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor("#DDD").lineWidth(0.5).dash(2, {space: 2}).stroke().undash();
        doc.moveDown(0.5);
    });

    // 5. Finalizar
    drawFooter(); // Desenha rodapé da última página
    doc.end();
}

module.exports = {
    handlePdfReportRequest
};