const Controller = require("./stockMovement.controller");

const { Router } = require("express");
const router = new Router();

router.get("/", Controller.list);
router.get("/products", Controller.listProductsWithStock);
router.get("/movements/:id", Controller.listProductMovement);

module.exports = router;
