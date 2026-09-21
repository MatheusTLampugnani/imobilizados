const { criarCadastradoSchema, editarCadastradoSchema, listarCadastradosSchema } = require('./schemas');
const { listarCadastrados, excluirCadastrado, editarCadastrado } = require('./services/cadastrados-service');

module.exports = {
    criarCadastradoSchema,
    editarCadastradoSchema,
    listarCadastradosSchema,
    listarCadastrados,
    excluirCadastrado,
    editarCadastrado,
};
