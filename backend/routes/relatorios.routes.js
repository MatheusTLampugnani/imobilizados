const { Router } = require('express');
const { gerarRelatorioPDF, gerarRelatorioCSV, gerarRelatorioExcel } = require('../modules/relatorios');

const router = Router();

// GET /api/report/pdf
router.get('/pdf', async (req, res) => {
    const { centro_custo } = req.query;
    if (!centro_custo) {
        return res.status(400).json({ message: 'Centro de custo não fornecido.' });
    }

    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        await gerarRelatorioPDF(centro_custo, res);
    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        if (!res.headersSent) {
            const status = err.statusCode || 500;
            return res.status(status).json({ message: err.message });
        }
    }
});

// GET /api/report/csv
router.get('/csv', async (req, res) => {
    const { centro_custo } = req.query;
    if (!centro_custo) {
        return res.status(400).json({ message: 'Centro de custo não fornecido.' });
    }

    try {
        const csvData = await gerarRelatorioCSV(centro_custo);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Relatorio_CC_${centro_custo}.csv"`);
        return res.status(200).end(csvData);
    } catch (err) {
        console.error('Erro ao gerar CSV:', err);
        const status = err.statusCode || 500;
        return res.status(status).json({ message: err.message });
    }
});

// GET /api/report/excel
router.get('/excel', async (req, res) => {
    try {
        await gerarRelatorioExcel(req.query, res);
    } catch (err) {
        console.error('Erro ao gerar Excel:', err);
        if (!res.headersSent) {
            return res.status(500).send('Erro ao gerar relatório Excel');
        }
    }
});

module.exports = router;
