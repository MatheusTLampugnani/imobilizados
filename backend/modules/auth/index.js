const { loginSchema } = require('./schemas');
const { autenticarCracha } = require('./services/auth-service');

module.exports = { loginSchema, autenticarCracha };
