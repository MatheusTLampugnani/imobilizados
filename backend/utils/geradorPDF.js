require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
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
            return res.end(JSON.stringify({ message: "Nenhum dado encontrado." }));
        }

        const { data: ccData } = await supabase
            .from('centro_de_custo')
            .select('setores')
            .eq('centro_custo', centro_custo)
            .single();

        await gerarRelatorioHTMLtoPDF(
            {
                data,
                centro_custo,
                centro_custo_nome: ccData ? ccData.setores : ""
            },
            res
        );

    } catch (dbError) {
        console.error('ERRO:', dbError);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end(JSON.stringify({ message: dbError.message }));
        }
    }
}

async function gerarRelatorioHTMLtoPDF({ data, centro_custo, centro_custo_nome }, res) {
    try {
        const logoPath = path.join(__dirname, '..', 'assets', 'videplast-brand.png');
        let logoBase64 = '';
        if (fs.existsSync(logoPath)) {
            const bitmap = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${bitmap.toString('base64')}`;
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Helvetica, Arial, sans-serif; margin: 40px; font-size: 10px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .logo { width: 100px; margin-bottom: 10px; }
                h1 { font-size: 16px; margin: 5px 0; color: #333; }
                h2 { font-size: 12px; margin: 0; color: #555; font-weight: normal; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                
                /* O segredo para não quebrar página errado: */
                tr { page-break-inside: avoid; } 
                
                td, th { border: 1px solid #ddd; padding: 6px; vertical-align: top; }
                
                .label { font-weight: bold; color: #444; width: 90px; background-color: #f0f0f0; }
                .value { color: #000; }
                
                .item-container { margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
                
                /* Estilo Zebrado */
                .row-container:nth-child(even) { background-color: #f9f9f9; }

                .grid-info { display: flex; flex-wrap: wrap; }
                .grid-item { width: 14%; box-sizing: border-box; padding: 5px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; }
                .grid-item strong { display: block; font-size: 7px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
                .grid-item span { font-size: 9px; font-weight: bold; }
                
                .desc-box { padding: 8px; border-top: 1px solid #eee; }
                .desc-title { font-size: 7px; color: #666; font-weight: bold; text-transform: uppercase; }
                .desc-text { font-size: 10px; margin-top: 2px; line-height: 1.3; }

                .footer { position: fixed; bottom: 0; left: 0; right: 0; height: 30px; font-size: 8px; color: #999; text-align: right; background: white; padding-top: 5px;}
            </style>
        </head>
        <body>
            <div class="header">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
                <h1>RELATÓRIO DE IMOBILIZADOS</h1>
                <h2>Centro de Custo: ${centro_custo} - ${centro_custo_nome}</h2>
                <h2>Data Emissão: ${new Date().toLocaleDateString('pt-BR')}</h2>
            </div>

            ${data.map(item => {
                const dataInc = item.data_incorporacao ? new Date(item.data_incorporacao).toLocaleDateString('pt-BR') : '-';
                return `
                <div class="item-container row-container">
                    <div class="grid-info">
                        <div class="grid-item"><strong>Imobilizado</strong><span>${item.codigo_imobilizado || '-'}</span></div>
                        <div class="grid-item"><strong>Subnº</strong><span>${item.sub_numero}</span></div>
                        <div class="grid-item"><strong>Inventário</strong><span>${item.codigo_inventario || '-'}</span></div>
                        <div class="grid-item"><strong>Inv. Antigo</strong><span>${item.codigo_inventario_antigo || '-'}</span></div>
                        <div class="grid-item"><strong>Data</strong><span>${dataInc}</span></div>
                        <div class="grid-item"><strong>Local</strong><span>${item.local || '-'}</span></div>
                        <div class="grid-item" style="border-right: none;"><strong>Série</strong><span>${item.numero_serie || '-'}</span></div>
                    </div>
                    <div class="desc-box">
                        <div class="desc-title">Descrição do Ativo</div>
                        <div class="desc-text">${item.descricao || 'SEM DESCRIÇÃO'}</div>
                    </div>
                </div>
                `;
            }).join('')}
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '30px', bottom: '40px', left: '30px', right: '30px' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 8px; color: #999; width: 100%; text-align: right; padding-right: 30px;">
                    Página <span class="pageNumber"></span> de <span class="totalPages"></span>
                </div>
            `
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.pdf"`);
        res.end(pdfBuffer);

    } catch (err) {
        console.error("Erro Puppeteer:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ message: "Erro ao gerar PDF com Puppeteer" }));
    }
}

module.exports = {
    handlePdfReportRequest
};