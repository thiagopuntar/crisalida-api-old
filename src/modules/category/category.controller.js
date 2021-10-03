const CategoryDao = require("./category.dao");
const categoryDao = new CategoryDao();

class Controller {
  async list(req, res) {
    const data = await categoryDao.findAll();
    res.json(data);
  }
}

module.exports = new Controller();
