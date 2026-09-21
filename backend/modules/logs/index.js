const { verifyBatchSchema } = require('./schemas');
const { registrarLog, buscarLogs, verificarLoteLogs } = require('./services/logs-service');

module.exports = { verifyBatchSchema, registrarLog, buscarLogs, verificarLoteLogs };
