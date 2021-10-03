const Controller = require("./loja.controller");

const { Router } = require("express");
const router = new Router();

router.get("/produtos", Controller.listProducts);
router.get("/categorias", Controller.getCategories);
router.get("/bairros", Controller.getDistricts);
router.get("/status", Controller.getStoreStatus);
router.get("/cep/:cep", Controller.getCep);
router.post("/pedido", Controller.addOrder);
router.get("/pedido/:hash", Controller.getOrderByHash);

module.exports = router;
