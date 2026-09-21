/**
 * Normaliza um valor de entrada para string limpa.
 * Remove zeros à esquerda de valores puramente numéricos.
 * @param {*} valor
 * @returns {string}
 */
function formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    const str = String(valor).trim();
    if (/^\d+$/.test(str)) {
        return String(parseInt(str, 10));
    }
    return str;
}

module.exports = { formatarValor };
