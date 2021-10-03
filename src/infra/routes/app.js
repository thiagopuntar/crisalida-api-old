const { Router, ...express } = require('express');
const history = require('connect-history-api-fallback');
const path = require('path');

const router = new Router();

router.use(history());

const distPath = path.resolve(process.cwd(), '../app/dist/spa');
router.use(express.static(distPath));

module.exports = router;