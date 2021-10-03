const CustomerDao = require("./customer.dao");
const customerDao = new CustomerDao();

class Controller {
  async list(req, res) {
    const data = await customerDao.findAll();
    res.json(data);
  }

  async insert(req, res) {
    const data = await customerDao.insert(req.body);
    res.json(data);
  }

  async update(req, res) {
    const data = await customerDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    const newData = await customerDao.update(req.body);
    res.json(newData);
  }

  async findOne(req, res) {
    const data = await customerDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    res.json(data);
  }

  async delete(req, res) {
    const data = await customerDao.del(req.params.id);
    res.json(data);
  }
}

module.exports = new Controller();
