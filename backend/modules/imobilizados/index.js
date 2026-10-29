const {
    buscarImobilizadoSchema,
    listarSemLocalSchema,
    listarPorLocalSchema,
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
} = require('./schemas');

const {
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
} = require('./services/imobilizados-service');

module.exports = {
    // Schemas
    buscarImobilizadoSchema,
    listarSemLocalSchema,
    listarPorLocalSchema,
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
    // Services
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
