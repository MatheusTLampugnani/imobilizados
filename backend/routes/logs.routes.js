const { Router } = require('express');
const { verifyBatchSchema, buscarLogs, verificarLoteLogs } = require('../modules/logs');
const { getZodErrorMessage } = require('../modules/shared');

const router = Router();

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const data = await buscarLogs();
        return res.status(200).json(data);
    } catch (err) {
        console.error('Erro ao buscar logs:', err);
        return res.status(500).json({ message: err.message });
    }
});

// PUT /api/logs/verify-batch
router.put('/verify-batch', async (req, res) => {
    const parsed = verifyBatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const data = await verificarLoteLogs(parsed.data.ids, parsed.data.verificado);
        return res.status(200).json({ message: `${parsed.data.ids.length} logs atualizados.`, data });
    } catch (err) {
        console.error('Erro verify-batch:', err);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;
