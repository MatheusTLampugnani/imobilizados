const { supabase } = require('../../../lib/supabase');
const { formatarValor } = require('../../shared');
const { buscarSetoresPorCCs, buscarSetorPorCC } = require('../../centro-custo');

/**
 * Mapeia item do banco para o formato de resposta padrão da API.
 */
function mapearItem(item, centroCustoMap = {}) {
    return {
        id: item.id,
        'Subnº': item.sub_numero,
        'Data': item.data_incorporacao,
        'Descrição': item.descricao,
        'Inventário': item.codigo_inventario,
        'Inventário_Antigo': item.codigo_inventario_antigo,
        'Série': item.numero_serie,
        'CentroCusto': item.centro_custo,
        'CentroCustoNome': centroCustoMap[item.centro_custo] || '',
        'codigo_imobilizado': item.codigo_imobilizado,
        'Local': item.local,
        'local': item.local,
    };
}

/**
 * Busca imobilizados por múltiplos campos (busca unificada).
 */
async function buscarImobilizado({ codigoFormatado, listaCCs }) {
    const applyUnitFilter = (query) =>
        listaCCs ? query.in('centro_custo', listaCCs) : query;

    const searchByText = async (field, value) => {
        const { data, error } = await applyUnitFilter(
            supabase.from('imobilizados').select('*').ilike(field, `%${value}%`)
        );
        if (error) throw error;
        return data || [];
    };

    const searchByNumber = async (field, value) => {
        const { data, error } = await applyUnitFilter(
            supabase.from('imobilizados').select('*').eq(field, value)
        );
        if (error) throw error;
        return data || [];
    };

    const searchByDescription = async (value) => {
        const { data, error } = await applyUnitFilter(
            supabase.from('imobilizados').select('*').ilike('descricao', `%${value}%`)
        );
        if (error) throw error;
        return data || [];
    };

    const promises = [
        searchByText('codigo_inventario', codigoFormatado),
        searchByText('numero_serie', codigoFormatado),
        searchByText('centro_custo', codigoFormatado),
        searchByText('local', codigoFormatado),
        searchByDescription(codigoFormatado),
    ];

    if (/^\d+$/.test(codigoFormatado)) {
        promises.push(searchByNumber('codigo_imobilizado', parseInt(codigoFormatado, 10)));
    }

    const results = await Promise.all(promises);
    const allResults = results.flat();

    const uniqueIds = new Set();
    const itensEncontrados = allResults.filter(item => {
        if (uniqueIds.has(item.id)) return false;
        uniqueIds.add(item.id);
        return true;
    });

    if (itensEncontrados.length === 0) return null;

    const codes = [...new Set(itensEncontrados.map(i => i.centro_custo).filter(Boolean))];
    const centroCustoMap = await buscarSetoresPorCCs(codes);

    return {
        codigo_imobilizado: itensEncontrados[0].codigo_imobilizado,
        itens: itensEncontrados.map(item => mapearItem(item, centroCustoMap)),
    };
}

/**
 * Lista os imobilizados com o campo local vazio, só com espaços ou "Não informado".
 * Busca em páginas porque o Supabase devolve no máximo 1000 linhas por consulta.
 */
async function listarSemLocal({ listaCCs }) {
    const TAMANHO_PAGINA = 1000;
    const itens = [];

    for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
        let query = supabase
            .from('imobilizados')
            .select('*')
            .or('local.is.null,local.match.^\\s*$,local.ilike.n_o informado')
            .order('id', { ascending: true })
            .range(inicio, inicio + TAMANHO_PAGINA - 1);
        if (listaCCs) query = query.in('centro_custo', listaCCs);

        const { data, error } = await query;
        if (error) throw error;
        itens.push(...(data || []));
        if (!data || data.length < TAMANHO_PAGINA) break;
    }

    const codes = [...new Set(itens.map(i => i.centro_custo).filter(Boolean))];
    const centroCustoMap = await buscarSetoresPorCCs(codes);

    return {
        codigo_imobilizado: null,
        itens: itens.map(item => mapearItem(item, centroCustoMap)),
    };
}

/**
 * Lista os imobilizados de um local exato ("SETOR - AMBIENTE"), para a página aberta pelo QR code da sala.
 * Busca em páginas porque o Supabase devolve no máximo 1000 linhas por consulta.
 */
async function listarPorLocal({ local, listaCCs }) {
    const TAMANHO_PAGINA = 1000;
    const itens = [];

    for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
        let query = supabase
            .from('imobilizados')
            .select('*')
            .eq('local', local)
            .order('id', { ascending: true })
            .range(inicio, inicio + TAMANHO_PAGINA - 1);
        if (listaCCs) query = query.in('centro_custo', listaCCs);

        const { data, error } = await query;
        if (error) throw error;
        itens.push(...(data || []));
        if (!data || data.length < TAMANHO_PAGINA) break;
    }

    const codes = [...new Set(itens.map(i => i.centro_custo).filter(Boolean))];
    const centroCustoMap = await buscarSetoresPorCCs(codes);

    return {
        codigo_imobilizado: null,
        itens: itens.map(item => mapearItem(item, centroCustoMap)),
    };
}

/**
 * Busca um item específico por código de inventário ou número de série (para o modo inventário).
 */
async function buscarInventoryItem(codigoFormatado) {
    const { data, error } = await supabase
        .from('imobilizados')
        .select('*')
        .or(`codigo_inventario.eq.${codigoFormatado},numero_serie.eq.${codigoFormatado}`)
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const nomeSetor = await buscarSetorPorCC(data.centro_custo);
    return { itens: [mapearItem(data, { [data.centro_custo]: nomeSetor })] };
}

/**
 * Cria um novo imobilizado na tabela de cadastrados.
 */
async function criarImobilizado({ descricao, codigo_inventario, centro_custo, user, numero_serie, local, observacao }) {
    const invCodeClean = formatarValor(codigo_inventario);

    const { data: existeOficial } = await supabase
        .from('imobilizados')
        .select('id, descricao')
        .eq('codigo_inventario', invCodeClean)
        .maybeSingle();

    if (existeOficial) {
        const err = new Error(`O código ${invCodeClean} JÁ EXISTE na base oficial (Item: ${existeOficial.descricao}).`);
        err.statusCode = 400;
        throw err;
    }

    const { data: existeCadastrado } = await supabase
        .from('imobilizados_cadastrados')
        .select('id, descricao')
        .eq('codigo_inventario', invCodeClean)
        .maybeSingle();

    if (existeCadastrado) {
        const err = new Error(`O código ${invCodeClean} JÁ FOI CADASTRADO recentemente (Item: ${existeCadastrado.descricao}).`);
        err.statusCode = 400;
        throw err;
    }

    const insertPayload = {
        descricao,
        codigo_inventario: invCodeClean,
        numero_serie: numero_serie || null,
        centro_custo,
        local: local || null,
        cracha: user,
    };

    if (observacao !== undefined && observacao !== null) {
        insertPayload.observacao = observacao;
    }

    const { data, error } = await supabase
        .from('imobilizados_cadastrados')
        .insert([insertPayload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Busca CCsda unidade do usuário para filtrar resultados.
 */
async function buscarCCsDaUnidade(unidade) {
    const { data, error } = await supabase
        .from('centro_de_custo')
        .select('centro_custo')
        .eq('unidade', unidade);
    if (error) throw error;
    return (data || []).map(cc => cc.centro_custo);
}

/**
 * Atualiza o código de inventário de um item.
 */
async function atualizarInventario({ itemId, newInventoryCode, user }) {
    const newCode = formatarValor(newInventoryCode);

    const { data: currentItem, error: fetchError } = await supabase
        .from('imobilizados')
        .select('codigo_inventario, codigo_imobilizado, sub_numero, data_incorporacao')
        .eq('id', itemId)
        .single();
    if (fetchError) throw fetchError;

    const valorAntigo = currentItem.codigo_inventario || 'Vazio';

    const { error: updateError } = await supabase
        .from('imobilizados')
        .update({ codigo_inventario: newCode, codigo_inventario_antigo: valorAntigo, usuario_atualizacao: user || 'Sistema' })
        .eq('id', itemId);
    if (updateError) throw updateError;

    return { valorAntigo, newCode, item: currentItem };
}

/**
 * Atualiza o centro de custo de um item.
 */
async function atualizarCentroCusto({ itemId, newCostCenter, user }) {
    const { data: currentItem, error: fetchError } = await supabase
        .from('imobilizados')
        .select('centro_custo, codigo_imobilizado, sub_numero, data_incorporacao')
        .eq('id', itemId)
        .single();
    if (fetchError) throw fetchError;

    const valorAntigo = currentItem.centro_custo || 'Vazio';

    const { error: updateError } = await supabase
        .from('imobilizados')
        .update({ centro_custo: newCostCenter, centro_custo_antigo: valorAntigo, usuario_atualizacao: user || 'Sistema' })
        .eq('id', itemId);
    if (updateError) throw updateError;

    return { valorAntigo, newValue: newCostCenter, item: currentItem };
}

/**
 * Atualiza o número de série de um item.
 */
async function atualizarSerial({ itemId, newSerial, user }) {
    const { data: currentItem, error: fetchError } = await supabase
        .from('imobilizados')
        .select('numero_serie, codigo_imobilizado, sub_numero, data_incorporacao')
        .eq('id', itemId)
        .single();
    if (fetchError) throw fetchError;

    const valorAntigo = currentItem.numero_serie || 'Vazio';

    const { error: updateError } = await supabase
        .from('imobilizados')
        .update({ numero_serie: newSerial, numero_serie_antigo: valorAntigo, usuario_atualizacao: user || 'Sistema' })
        .eq('id', itemId);
    if (updateError) throw updateError;

    return { valorAntigo, newValue: newSerial, item: currentItem };
}

/**
 * Atualiza o local físico de um item.
 */
async function atualizarLocal({ itemId, newLocal, user }) {
    const { data: currentItem, error: fetchError } = await supabase
        .from('imobilizados')
        .select('local, codigo_imobilizado, sub_numero, data_incorporacao')
        .eq('id', itemId)
        .single();
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
        .from('imobilizados')
        .update({ local: newLocal, usuario_atualizacao: user || 'Sistema' })
        .eq('id', itemId);
    if (updateError) throw updateError;

    return { valorAntigo: currentItem.local || 'Vazio', newValue: newLocal, item: currentItem };
}

module.exports = {
    buscarImobilizado,
    listarSemLocal,
    listarPorLocal,
    buscarInventoryItem,
    criarImobilizado,
    buscarCCsDaUnidade,
    atualizarInventario,
    atualizarCentroCusto,
    atualizarSerial,
    atualizarLocal,
};
