const ProductionDao = require("./production.dao");
const StockMovementDao = require("../stockMovement/stockMovement.dao");
const productionDao = new ProductionDao();
const stockMovementDao = new StockMovementDao();

class Controller {
  async list(req, res) {
    const data = await productionDao.listDemand();
    res.json(data);
  }

  async insert(req, res) {
    const { productId, qty } = req.body;

    const stockMovement = {
      productId,
      qty,
      warehouseId: 1,
      moveType: "PR",
    };

    const data = await stockMovementDao.insert(stockMovement);
    res.json(data);
  }
}

module.exports = new Controller();
