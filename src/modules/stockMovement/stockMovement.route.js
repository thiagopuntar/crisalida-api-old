const Controller = require("./stockMovement.controller");

const { Router } = require("express");
const router = new Router();

router.get("/", Controller.list);

module.exports = router;
