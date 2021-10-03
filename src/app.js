require("express-async-errors");
require("dotenv").config();
require("./automations/utils/mongoDb");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("./infra/routes/api");
const reportRoutes = require("./infra/routes/reports");
const appRoute = require("./infra/routes/app");
const loginRoute = require("./infra/login/login");
const cardapioRoute = require("./modules/loja/loja.route");
const omieRoute = require("./modules/omie/omie.route");
const authMiddleware = require("./infra/middlewares/authetication");

require("./infra/database");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 60,
});

app.get("/", (req, res) => {
  res.send('Ok')
})
app.use("/api/v1/cardapio", limiter, cardapioRoute);
app.use("/api/v1/omie", omieRoute);
app.use("/api/v1/login", loginRoute);
app.use("/api/v1", authMiddleware, apiRoutes);
app.use("/reports", authMiddleware, reportRoutes);
// app.use(appRoute);

module.exports = app;
