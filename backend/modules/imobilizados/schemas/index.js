const { z } = require('zod');

const buscarImobilizadoSchema = z.object({
    codigo: z.string().trim().min(1, { message: 'Nenhum código foi fornecido.' }),
    unidadeUsuario: z.string().optional().default(''),
    isAdmin: z.string().optional().transform(v => v === 'true'),
});

const listarSemLocalSchema = z.object({
    unidadeUsuario: z.string().optional().default(''),
    isAdmin: z.string().optional().transform(v => v === 'true'),
});

const listarPorLocalSchema = z.object({
    local: z.string().trim().min(1, { message: 'Nenhum local foi informado.' }),
    unidadeUsuario: z.string().optional().default(''),
    isAdmin: z.string().optional().transform(v => v === 'true'),
});

const inventoryItemSchema = z.object({
    codigo: z.string().trim().min(1, { message: 'Nenhum código foi fornecido.' }),
});

const criarImobilizadoSchema = z.object({
    descricao: z.string().trim().min(1, { message: 'Descrição é obrigatória.' }),
    codigo_inventario: z.union([z.string(), z.number()])
        .transform(v => String(v).trim()),
    centro_custo: z.string().trim().min(1, { message: 'Centro de custo é obrigatório.' }),
    user: z.union([z.string(), z.number()])
        .transform(v => String(v).trim())
        .refine(v => v.length > 0, { message: 'Usuário é obrigatório.' }),
    numero_serie: z.string().optional().nullable(),
    local: z.string().optional().nullable(),
    observacao: z.string().optional().nullable(),
});

const updateInventarioSchema = z.object({
    itemId: z.union([z.string(), z.number()]).transform(v => String(v)),
    newInventoryCode: z.union([z.string(), z.number()])
        .transform(v => String(v).trim())
        .refine(v => v.length > 0, { message: 'Código de inventário inválido.' }),
    user: z.string().optional(),
});

const updateCentroCustoSchema = z.object({
    itemId: z.union([z.string(), z.number()]).transform(v => String(v)),
    newCostCenter: z.string().trim().min(1, { message: 'Centro de custo inválido.' }),
    user: z.string().optional(),
});

const updateSerialSchema = z.object({
    itemId: z.union([z.string(), z.number()]).transform(v => String(v)),
    newSerial: z.string().optional().nullable(),
    user: z.string().optional(),
});

const updateLocalSchema = z.object({
    itemId: z.union([z.string(), z.number()]).transform(v => String(v)),
    newLocal: z.string().trim().min(1, { message: 'Local inválido.' }),
    user: z.string().optional(),
});

module.exports = {
    buscarImobilizadoSchema,
    listarSemLocalSchema,
    listarPorLocalSchema,
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
};
