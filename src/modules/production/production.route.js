const Controller = require("./production.controller");

const { Router } = require("express");
const router = new Router();

router.get("/", Controller.list);
router.post("/", Controller.insert);

module.exports = router;
