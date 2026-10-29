const { Router } = require('express');
const {
    buscarImobilizadoSchema,
    listarSemLocalSchema,
    listarPorLocalSchema,
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
    buscarImobilizado,
    listarSemLocal,
    listarPorLocal,
    buscarInventoryItem,
    criarImobilizado,
    buscarCCsDaUnidade,
    atualizarInventario,
    atualizarCentroCusto,
    atualizarSerial,
    atualizarLocal,
} = require('../modules/imobilizados');
const { registrarLog } = require('../modules/logs');
const { formatarValor, getZodErrorMessage } = require('../modules/shared');

const router = Router();

// GET /api/imobilizado — busca unificada
router.get('/', async (req, res) => {
    const parsed = buscarImobilizadoSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    const { codigo, unidadeUsuario, isAdmin } = parsed.data;
    const codigoFormatado = formatarValor(codigo);

    try {
        let listaCCs = null;
        if (!isAdmin && unidadeUsuario) {
            listaCCs = await buscarCCsDaUnidade(unidadeUsuario);
            if (listaCCs.length === 0) {
                return res.status(404).json({ message: `A unidade ${unidadeUsuario} não possui Centros de Custo vinculados.` });
            }
        }

        const resultado = await buscarImobilizado({ codigoFormatado, listaCCs });
        if (!resultado) {
            return res.status(404).json({ message: `Nenhum item encontrado para o termo: ${codigo}` });
        }
        return res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro na busca de imobilizado:', err);
        return res.status(500).json({ message: `Erro no banco de dados: ${err.message}` });
    }
});

// GET /api/imobilizado/sem-local — itens com local em branco ou "Não informado"
router.get('/sem-local', async (req, res) => {
    const parsed = listarSemLocalSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    const { unidadeUsuario, isAdmin } = parsed.data;

    try {
        let listaCCs = null;
        if (!isAdmin && unidadeUsuario) {
            listaCCs = await buscarCCsDaUnidade(unidadeUsuario);
            if (listaCCs.length === 0) {
                return res.status(404).json({ message: `A unidade ${unidadeUsuario} não possui Centros de Custo vinculados.` });
            }
        }

        const resultado = await listarSemLocal({ listaCCs });
        return res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro ao listar itens sem local:', err);
        return res.status(500).json({ message: `Erro no banco de dados: ${err.message}` });
    }
});

// GET /api/imobilizado/por-local?local=SETOR - AMBIENTE — itens de um local (página aberta pelo QR code da sala)
router.get('/por-local', async (req, res) => {
    const parsed = listarPorLocalSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    const { local, tambem, unidadeUsuario, isAdmin } = parsed.data;

    try {
        let listaCCs = null;
        if (!isAdmin && unidadeUsuario) {
            listaCCs = await buscarCCsDaUnidade(unidadeUsuario);
            if (listaCCs.length === 0) {
                return res.status(404).json({ message: `A unidade ${unidadeUsuario} não possui Centros de Custo vinculados.` });
            }
        }

        const resultado = await listarPorLocal({ locais: [local, tambem].filter(Boolean), listaCCs });
        return res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro ao listar itens do local:', err);
        return res.status(500).json({ message: `Erro no banco de dados: ${err.message}` });
    }
});

// Handler para GET /api/inventory-item
async function handleInventoryItem(req, res) {
    const parsed = inventoryItemSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    const codigoFormatado = formatarValor(parsed.data.codigo);

    try {
        const resultado = await buscarInventoryItem(codigoFormatado);
        if (!resultado) {
            return res.status(404).json({ message: `Nenhum item encontrado para o código: ${parsed.data.codigo}` });
        }
        return res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro na busca de inventory-item:', err);
        return res.status(500).json({ message: `Erro no banco de dados: ${err.message}` });
    }
}

router.get('/inventory-item', handleInventoryItem);

// POST /api/imobilizado — cadastrar novo item
router.post('/', async (req, res) => {
    const parsed = criarImobilizadoSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const data = await criarImobilizado(parsed.data);
        return res.status(201).json(data);
    } catch (err) {
        console.error('Erro ao cadastrar item:', err);
        const status = err.statusCode || 500;
        return res.status(status).json({ message: err.message });
    }
});

// PUT /api/imobilizado/update-inventory
router.put('/update-inventory', async (req, res) => {
    const parsed = updateInventarioSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const { valorAntigo, newCode, item } = await atualizarInventario(parsed.data);
        await registrarLog(parsed.data.itemId, parsed.data.user, 'Alteração de Inventário',
            `Valor Antigo: ${valorAntigo}; Novo Valor: ${newCode}`,
            item.codigo_imobilizado, item.sub_numero, item.data_incorporacao);
        return res.status(200).json({ message: 'Inventário atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro update-inventory:', err);
        return res.status(500).json({ message: err.message });
    }
});

// PUT /api/imobilizado/update-cost-center
router.put('/update-cost-center', async (req, res) => {
    const parsed = updateCentroCustoSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const { valorAntigo, newValue, item } = await atualizarCentroCusto(parsed.data);
        await registrarLog(parsed.data.itemId, parsed.data.user, 'Alteração de Centro de Custo',
            `Valor Antigo: ${valorAntigo}; Novo Valor: ${newValue}`,
            item.codigo_imobilizado, item.sub_numero, item.data_incorporacao);
        return res.status(200).json({ message: 'Centro de Custo atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro update-cost-center:', err);
        return res.status(500).json({ message: err.message });
    }
});

// PUT /api/imobilizado/update-serial
router.put('/update-serial', async (req, res) => {
    const parsed = updateSerialSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const { valorAntigo, newValue, item } = await atualizarSerial(parsed.data);
        await registrarLog(parsed.data.itemId, parsed.data.user, 'Alteração de N. Série',
            `Valor Antigo: ${valorAntigo}; Novo Valor: ${newValue}`,
            item.codigo_imobilizado, item.sub_numero, item.data_incorporacao);
        return res.status(200).json({ message: 'Número de Série atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro update-serial:', err);
        return res.status(500).json({ message: err.message });
    }
});

// PUT /api/imobilizado/update-local
router.put('/update-local', async (req, res) => {
    const parsed = updateLocalSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: getZodErrorMessage(parsed.error) });
    }

    try {
        const { valorAntigo, newValue, item } = await atualizarLocal(parsed.data);
        await registrarLog(parsed.data.itemId, parsed.data.user, 'Alteração de Local',
            `Valor Antigo: ${valorAntigo}; Novo Valor: ${newValue}`,
            item.codigo_imobilizado, item.sub_numero, item.data_incorporacao);
        return res.status(200).json({ message: 'Local atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro update-local:', err);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = {
    imobilizadosRouter: router,
    handleInventoryItem,
};
