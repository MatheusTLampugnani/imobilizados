const { z } = require('zod');

const verifyBatchSchema = z.object({
    ids: z.array(z.union([z.string(), z.number()])).min(1, { message: 'Nenhum ID fornecido.' }),
    verificado: z.boolean(),
});

module.exports = { verifyBatchSchema };
