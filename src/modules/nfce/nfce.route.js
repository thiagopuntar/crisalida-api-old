const Controller = require("./nfce.controller");

const { Router } = require("express");
const router = new Router();

router.post("/:id", Controller.createNfce);
router.get("/xml", Controller.getXmls);

module.exports = router;
