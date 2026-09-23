const { z } = require('zod');

const criarCadastradoSchema = z.object({
    descricao: z.string().trim().min(1, { message: 'Descrição é obrigatória.' }),
    codigo_inventario: z.union([z.string(), z.number()]).transform(v => String(v).trim()),
    centro_custo: z.string().trim().min(1, { message: 'Centro de custo é obrigatório.' }),
    user: z.union([z.string(), z.number()]).transform(v => String(v).trim()),
    numero_serie: z.string().optional().nullable(),
    local: z.string().optional().nullable(),
    observacao: z.string().optional().nullable(),
});

const editarCadastradoSchema = z.object({
    descricao: z.string().optional(),
    numero_serie: z.string().optional().nullable(),
    centro_custo: z.string().optional(),
    local: z.string().optional().nullable(),
    observacao: z.string().optional().nullable(),
});

const listarCadastradosSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    centro_custo: z.string().optional(),
    termo: z.string().optional(),
    baixas_only: z.string().optional().transform(v => v === 'true'),
});

module.exports = { criarCadastradoSchema, editarCadastradoSchema, listarCadastradosSchema };
