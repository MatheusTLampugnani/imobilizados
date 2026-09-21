const { gerarRelatorioPDF } = require('./services/pdf-service');
const { gerarRelatorioCSV } = require('./services/csv-service');
const { gerarRelatorioExcel } = require('./services/excel-service');

module.exports = { gerarRelatorioPDF, gerarRelatorioCSV, gerarRelatorioExcel };
