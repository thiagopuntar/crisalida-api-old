const Controller = require('./customer.controller');

const { Router } = require('express');
const router = new Router();

router.get('/', Controller.list);
router.post('/', Controller.insert);

router.put('/:id', Controller.update);
router.get('/:id', Controller.findOne);
router.delete('/:id', Controller.delete);

module.exports = router;