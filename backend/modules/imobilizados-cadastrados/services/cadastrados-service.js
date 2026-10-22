const { supabase } = require('../../../lib/supabase');

/**
 * Lista imobilizados cadastrados ou baixas com filtros.
 */
async function listarCadastrados({ start_date, end_date, centro_custo, termo, baixas_only }) {
    let query;

    if (baixas_only) {
        query = supabase
            .from('imobilizados')
            .select('*')
            .ilike('local', '%baixa%');

        if (centro_custo) query = query.ilike('centro_custo', `%${centro_custo}%`);
    } else {
        query = supabase
            .from('imobilizados_cadastrados')
            .select('*')
            .order('created_at', { ascending: false });

        if (start_date) query = query.gte('created_at', `${start_date}T00:00:00`);
        if (end_date) query = query.lte('created_at', `${end_date}T23:59:59`);
        if (centro_custo) query = query.ilike('centro_custo', `%${centro_custo}%`);
    }

    if (termo) {
        const isNumeric = /^\d+$/.test(termo);
        const orConditions = [
            `descricao.ilike.%${termo}%`,
            `local.ilike.%${termo}%`,
            `numero_serie.ilike.%${termo}%`,
        ];
        if (!baixas_only) {
            orConditions.push(`observacao.ilike.%${termo}%`);
        }
        if (isNumeric) {
            orConditions.push(`codigo_inventario.eq.${termo}`);
            if (!baixas_only) orConditions.push(`cracha.eq.${termo}`);
        }
        query = query.or(orConditions.join(','));
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Exclui um imobilizado cadastrado pelo ID.
 */
async function excluirCadastrado(id) {
    const { error } = await supabase
        .from('imobilizados_cadastrados')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/**
 * Edita um imobilizado cadastrado pelo ID.
 */
async function editarCadastrado(id, campos) {
    const updatePayload = {};
    for (const [key, val] of Object.entries(campos)) {
        if (val !== undefined) {
            updatePayload[key] = val;
        }
    }

    const { data, error } = await supabase
        .from('imobilizados_cadastrados')
        .update(updatePayload)
        .eq('id', id)
        .select();

    if (error) {
        if (error.message && error.message.includes('observacao')) {
            const friendlyErr = new Error("A coluna 'observacao' ainda não existe no banco de dados. Execute o script em 'backend/migrations/add_observacao_column.sql' no Supabase.");
            friendlyErr.statusCode = 400;
            throw friendlyErr;
        }
        throw error;
    }
    return data;
}

module.exports = { listarCadastrados, excluirCadastrado, editarCadastrado };
