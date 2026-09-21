const { Router } = require('express');
const { validarCentroCusto } = require('../modules/centro-custo');

const router = Router();

// GET /api/centro-custo/validate/:cc
router.get('/validate/:cc', async (req, res) => {
    const { cc } = req.params;
    if (!cc) return res.status(400).json({ isValid: false, message: 'Centro de Custo não fornecido.' });

    try {
        const isValid = await validarCentroCusto(cc);
        if (isValid) return res.status(200).json({ isValid: true });
        return res.status(404).json({ isValid: false, message: 'Centro de Custo não encontrado.' });
    } catch (err) {
        console.error('Erro ao validar CC:', err);
        return res.status(500).json({ isValid: false, message: 'Erro interno do servidor.' });
    }
});

module.exports = router;
