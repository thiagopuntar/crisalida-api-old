const Controller = require('./supplier.controller');

const { Router } = require('express');
const router = new Router();

router.get('/', Controller.list);
router.post('/', Controller.insert);

router.get('/:id', Controller.getById);
router.put('/:id', Controller.update);
router.delete('/:id', Controller.delete);

module.exports = router;