const UnitDao = require("./unit.dao");
const unitDao = new UnitDao();

class Controller {
  async list(req, res) {
    const data = await unitDao.findAll();
    res.json(data.map((x) => x.name));
  }

  async insert(req, res) {
    const data = await unitDao.insert(req.body);
    res.json(data);
  }

  async update(req, res) {
    const data = await unitDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    const newData = await data.update(req.body);
    res.json(newData);
  }
}

module.exports = new Controller();
