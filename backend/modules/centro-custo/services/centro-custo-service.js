const { supabase } = require('../../../lib/supabase');

/**
 * Verifica se um Centro de Custo existe na tabela de imobilizados.
 * @param {string} cc
 * @returns {boolean}
 */
async function validarCentroCusto(cc) {
    const { count, error } = await supabase
        .from('imobilizados')
        .select('centro_custo', { count: 'exact', head: true })
        .ilike('centro_custo', cc);

    if (error) throw error;
    return count > 0;
}

/**
 * Busca o nome (setores) de uma lista de centros de custo.
 * @param {string[]} codes
 * @returns {Record<string, string>} Mapa { codigo: nomeSetor }
 */
async function buscarSetoresPorCCs(codes) {
    if (!codes || codes.length === 0) return {};

    const { data, error } = await supabase
        .from('centro_de_custo')
        .select('centro_custo, setores')
        .in('centro_custo', codes);

    if (error) throw error;

    const map = {};
    (data || []).forEach(cc => { map[cc.centro_custo] = cc.setores; });
    return map;
}

/**
 * Busca o nome (setor) de um único centro de custo.
 * @param {string} cc
 * @returns {string}
 */
async function buscarSetorPorCC(cc) {
    if (!cc) return '';
    const { data } = await supabase
        .from('centro_de_custo')
        .select('setores')
        .eq('centro_custo', cc)
        .single();
    return data ? data.setores : '';
}

module.exports = { validarCentroCusto, buscarSetoresPorCCs, buscarSetorPorCC };
