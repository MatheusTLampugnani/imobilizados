const {
    buscarImobilizadoSchema,
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
} = require('./schemas');

const {
    buscarImobilizado,
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
    inventoryItemSchema,
    criarImobilizadoSchema,
    updateInventarioSchema,
    updateCentroCustoSchema,
    updateSerialSchema,
    updateLocalSchema,
    // Services
    buscarImobilizado,
    buscarInventoryItem,
    criarImobilizado,
    buscarCCsDaUnidade,
    atualizarInventario,
    atualizarCentroCusto,
    atualizarSerial,
    atualizarLocal,
};
