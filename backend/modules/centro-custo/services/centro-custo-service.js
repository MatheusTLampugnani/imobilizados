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
 * Confere se um Centro de Custo existe: primeiro no cadastro de centros de custo
 * (traz o nome do setor), depois em algum item da base de imobilizados.
 * @param {string} cc
 * @returns {{ existe: boolean, setor: string }}
 */
async function consultarCentroCusto(cc) {
    const { data, error } = await supabase
        .from('centro_de_custo')
        .select('centro_custo, setores')
        .ilike('centro_custo', cc)
        .limit(1);

    if (error) throw error;
    if (data && data.length > 0) return { existe: true, setor: data[0].setores || '' };

    return { existe: await validarCentroCusto(cc), setor: '' };
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

module.exports = { validarCentroCusto, consultarCentroCusto, buscarSetoresPorCCs, buscarSetorPorCC };
