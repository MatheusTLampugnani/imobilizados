const { z } = require('zod');

const loginSchema = z.object({
    cracha: z.union([z.string(), z.number()])
        .transform(v => String(v).trim())
        .refine(v => v.length > 0, { message: 'Por favor, informe o crachá.' }),
});

module.exports = { loginSchema };
