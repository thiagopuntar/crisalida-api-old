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
}

module.exports = new Controller();
