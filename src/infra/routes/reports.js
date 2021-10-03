const { Router } = require("express");
const router = new Router();
const controller = require("../reports/report.controller");

router.get("/order/:id", controller.order);
router.get("/orders/routes", controller.routeList);

module.exports = router;
