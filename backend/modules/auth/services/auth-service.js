const { supabase } = require('../../../lib/supabase');

/**
 * Autentica um operador pelo número do crachá.
 * @param {string} cracha
 * @returns {{ cracha: string, nome: string, isAdmin: boolean, unidade: string }}
 */
async function autenticarCracha(cracha) {
    const { data, error } = await supabase
        .from('crachas')
        .select('*')
        .eq('id', cracha)
        .single();

    if (error || !data) {
        const err = new Error('Crachá não encontrado ou não autorizado.');
        err.statusCode = 401;
        throw err;
    }

    return {
        cracha: data.id,
        nome: data.nome_completo,
        isAdmin: data.admin,
        unidade: data.unidade,
    };
}

module.exports = { autenticarCracha };
