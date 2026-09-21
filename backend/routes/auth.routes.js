const { Router } = require('express');
const { loginSchema, autenticarCracha } = require('../modules/auth');
const { getZodErrorMessage } = require('../modules/shared');

const router = Router();

// POST /api/login
router.post('/login', async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: getZodErrorMessage(result.error) });
    }

    try {
        const user = await autenticarCracha(result.data.cracha);
        return res.status(200).json({ message: 'Login OK', user });
    } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({ message: err.message || 'Erro interno no servidor.' });
    }
});

module.exports = router;
