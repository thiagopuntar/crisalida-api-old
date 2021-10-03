const dayjs = require("dayjs");
const OrderDao = require("./order.dao");
const CustomerDao = require("../customer/customer.dao");
const ProductionDao = require("../production/production.dao");
const StockMovementDao = require("../stockMovement/stockMovement.dao");

const customerDao = new CustomerDao();
const productionDao = new ProductionDao();
const stockMovementDao = new StockMovementDao();
const orderDao = new OrderDao(customerDao, productionDao, stockMovementDao);

class Controller {
  async list(req, res) {
    const data = await orderDao.findAll();
    res.json(data);
  }

  async listDistricts(req, res) {
    const data = await orderDao.listDistricts();
    res.json(data);
  }

  async insert(req, res) {
    const [data] = await orderDao.insert(req.body);
    res.json(data);
  }

  async update(req, res) {
    const data = await orderDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    const newData = await orderDao.update(req.body);
    res.json(newData);
  }

  async findOne(req, res) {
    const data = await orderDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    res.json(data);
  }

  async delete(req, res) {
    const data = await orderDao.del(req.params.id);
    res.json(data);
  }

  async getOrdersToPick(req, res) {
    const { initialDate, finalDate } = req.query;
    const data = await orderDao.getOrdersToPick(initialDate, finalDate);
    res.json(data);
  }

  async pickOrder(req, res) {
    const data = await orderDao.pick(req.params.id);
    res.json(data);
  }
}

module.exports = new Controller();
