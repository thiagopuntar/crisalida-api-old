const FamilyDao = require("./family.dao");
const familyDao = new FamilyDao();

class Controller {
  async list(req, res) {
    const data = await familyDao.findAll();
    res.json(data);
  }
}

module.exports = new Controller();
