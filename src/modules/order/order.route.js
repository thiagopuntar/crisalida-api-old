const Controller = require("./order.controller");

const { Router } = require("express");
const router = new Router();

router.get("/", Controller.list);
router.post("/", Controller.insert);

router.get("/districts", Controller.listDistricts);
router.get("/toPick", Controller.getOrdersToPick);
router.post("/pick/:id", Controller.pickOrder);

router.put("/:id", Controller.update);
router.get("/:id", Controller.findOne);
router.delete("/:id", Controller.delete);

module.exports = router;
