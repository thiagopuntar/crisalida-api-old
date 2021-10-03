const { Router } = require("express");
const router = new Router();

// const Login = require('../login/login');

const product = require("../../modules/product/product.route");
const customer = require("../../modules/customer/customer.route");
const unit = require("../../modules/unit/unit.route");
const order = require("../../modules/order/order.route");
const paymentType = require("../../modules/paymentType/paymentType.route");
const supplier = require("../../modules/supplier/supplier.route");
const nfce = require("../../modules/nfce/nfce.route");
const family = require("../../modules/family/family.route");
const production = require("../../modules/production/production.route");
const stockMovement = require("../../modules/stockMovement/stockMovement.route");
const category = require("../../modules/category/category.route");
const integration = require("../../modules/integration/integration.route");

// app.use(`${apiRoute}/login`, Login);

router.use("/products", product);
router.use("/customers", customer);
router.use("/units", unit);
router.use("/orders", order);
router.use("/paymentTypes", paymentType);
router.use("/suppliers", supplier);
router.use("/nfce", nfce);
router.use("/families", family);
router.use("/productions", production);
router.use("/stock", stockMovement);
router.use("/categories", category);
router.use("/integration", integration);

module.exports = router;
