const PaymentTypeDao = require("./paymentType.dao");
const paymentTypeDao = new PaymentTypeDao();
class Controller {
  async list(req, res) {
    const data = await paymentTypeDao.findAll();
    res.json(data);
  }
}

module.exports = new Controller();
