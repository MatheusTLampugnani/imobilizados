/**
 * Extrai a primeira mensagem de erro amigável de um ZodError (compatível com Zod 3 e Zod 4).
 * @param {import('zod').ZodError} error
 * @returns {string}
 */
function getZodErrorMessage(error) {
    if (!error) return 'Dados inválidos.';
    if (Array.isArray(error.issues) && error.issues.length > 0) {
        return error.issues[0].message;
    }
    if (Array.isArray(error.errors) && error.errors.length > 0) {
        return error.errors[0].message;
    }
    return error.message || 'Dados inválidos.';
}

module.exports = { getZodErrorMessage };
