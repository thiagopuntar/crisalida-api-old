const Controller = require("./integration.controller");

const { Router } = require("express");
const router = new Router();

router.post("/omie", Controller.startAutomation);
router.get("/omie/status", Controller.checkIntegrationStatus);
router.get("/flowNames", Controller.listFlowNames);
router.post("/records", Controller.listRecords);
router.get("/records/:id", Controller.getLogDetail);

module.exports = router;
;