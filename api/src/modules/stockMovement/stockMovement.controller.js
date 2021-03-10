const StockMovementDao = require("./stockMovement.dao");
const stockMovementDao = new StockMovementDao();

class Controller {
  async list(req, res) {
    const { ids } = req.query;

    if (!ids) {
      return res.json([]);
    }

    const data = await stockMovementDao.findAll(ids.split(","));
    res.json(data);
  }

  async listProductsWithStock(req, res) {
    const data = await stockMovementDao.listProductsWithStock();
    res.json(data);
  }

  async listProductMovement(req, res) {
    const { id: productId } = req.params;
    const data = await stockMovementDao.listMovements(productId);

    res.json(data);
  }
}

module.exports = new Controller();
