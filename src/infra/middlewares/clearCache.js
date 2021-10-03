const { clearCashByKey, clearCache } = require('../../infra/cache');

module.exports = async (req, res, next) => {
    await next();
    clearCashByKey(req.tenant.user._id);
}