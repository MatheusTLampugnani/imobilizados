const { supabase } = require('../../../lib/supabase');

/**
 * Registra uma alteração no log de auditoria.
 */
async function registrarLog(itemId, usuario, tipo, detalhes, codImob, sub, dataInc) {
    const { error } = await supabase
        .from('logs_alteracoes')
        .insert([{
            item_id: itemId,
            usuario,
            tipo_alteracao: tipo,
            detalhes,
            codigo_imobilizado: codImob,
            sub_numero: sub,
            data_incorporacao: dataInc,
        }]);

    if (error) {
        console.error('Erro ao salvar log:', error.message);
    } else {
        console.log(`Log salvo: ${tipo} (${codImob})`);
    }
}

/**
 * Busca todos os logs de alterações.
 */
async function buscarLogs() {
    const { data, error } = await supabase
        .from('logs_alteracoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100000);

    if (error) throw error;
    return data;
}

/**
 * Atualiza o campo "verificado" em lote para uma lista de IDs de log.
 */
async function verificarLoteLogs(ids, verificado) {
    const { data, error } = await supabase
        .from('logs_alteracoes')
        .update({ verificado })
        .in('id', ids)
        .select();

    if (error) throw error;
    return data;
}

module.exports = { registrarLog, buscarLogs, verificarLoteLogs };
