const logger = require('../logger/Logger')('serverLogger');

module.exports = function(err, req, res, next) {
    logger.error(err);

    if (err.name === 'BusinessError') {
        res.status(400).send(err.message);
    } else {
        res.status(500).send('Something happened!!');
    }
}