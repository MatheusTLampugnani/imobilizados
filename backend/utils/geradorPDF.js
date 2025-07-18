require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable");
const fs = require('fs');
const path = require('path');
const url = require('url');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para converter a imagem do logo para base64
const getLogoBase64 = () => {
    const logoPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'videplast-brand.png');
    if (fs.existsSync(logoPath)) {
        const logo = fs.readFileSync(logoPath);
        return Buffer.from(logo).toString('base64');
    }
    return null;
};

const logoBase64 = getLogoBase64();

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
    const doc = new jsPDF();
    const filename = `Relatorio_CC_${centro_custo}.pdf`;

    const tableColumns = ["Imobilizado", "Subnº", "Inventario", "Descrição", "Nº Série", "Data Incorporação"];
    const tableRows = [];

    data.forEach(item => {
        const row = [
            item.codigo_imobilizado || 'N/A',
            item.sub_numero ?? 'N/A',
            item.codigo_inventario || 'N/A',
            item.descricao || 'Sem descrição',
            item.numero_serie || 'N/A',
            item.data_incorporacao || 'N/A'
        ];
        tableRows.push(row);
    });

    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 50, // Posição inicial da tabela para dar espaço ao cabeçalho
        didDrawPage: (data) => {
            // Cabeçalho
            if (logoBase64) {
                const imgWidth = 50;
                const imgHeight = 12;
                const centerX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
                doc.addImage(logoBase64, 'PNG', centerX, 10, imgWidth, imgHeight);
            }

            doc.setFontSize(16);
            doc.text('Relatório de Imobilizados', doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Centro de Custo: ${centro_custo}`, 14, 45);

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            const datetime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            doc.setFontSize(8);
            doc.text(`Gerado em: ${datetime}`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        },
        headStyles: { fillColor: [41, 46, 51], textColor: [255, 255, 255] },
        margin: { top: 60 } // Margem superior para o cabeçalho personalizado
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Converte o documento para um Buffer e envia
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
}

module.exports = {
    handlePdfReportRequest
};