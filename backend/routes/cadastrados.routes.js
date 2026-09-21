const { Router } = require('express');
const { listarCadastradosSchema, editarCadastradoSchema, listarCadastrados, excluirCadastrado, editarCadastrado } = require('../modules/imobilizados-cadastrados');
const { getZodErrorMessage } = require('../modules/shared');

const router = Router();

// GET /api/imobilizados-cadastrados
router.get('/', async (req, res) => {
    const parsed = listarCadastradosSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const data = await listarCadastrados(parsed.data);
        return res.status(200).json(data);
    } catch (err) {
        console.error('Erro ao buscar cadastrados:', err);
        return res.status(500).json({ message: `Erro ao buscar dados: ${err.message}` });
    }
});

// DELETE /api/imobilizados-cadastrados/:id
router.delete('/:id', async (req, res) => {
    try {
        await excluirCadastrado(req.params.id);
        return res.status(200).json({ message: 'Item excluído com sucesso.' });
    } catch (err) {
        return res.status(500).json({ message: `Erro ao excluir: ${err.message}` });
    }
});

// PUT /api/imobilizados-cadastrados/:id
router.put('/:id', async (req, res) => {
    const parsed = editarCadastradoSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const data = await editarCadastrado(req.params.id, parsed.data);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ message: `Erro ao editar: ${err.message}` });
    }
});

module.exports = router;
