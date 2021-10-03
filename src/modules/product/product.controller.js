const ProductDao = require("./product.dao");

const productDao = new ProductDao();

class Controller {
  async list(req, res) {
    const data = await productDao.findAll();
    res.json(data);
  }

  async listMaterials(req, res) {
    const { type } = req.query;

    const types = {
      Produto: ["Insumo", "Granel", "Embalagem"],
      Granel: ["Insumo", "Granel", "Embalagem"],
      Kit: ["Granel", "Embalagem", "Produto", "Kit", "Revenda"],
    };

    const materialTypes = types[type];

    if (!materialTypes) {
      return res.status(400).send("Tipo de produto não previsto.");
    }

    const data = await productDao.findMaterials(materialTypes);
    res.json(data);
  }

  async insert(req, res) {
    const data = await productDao.insert(req.body);
    res.json(data);
  }

  async update(req, res) {
    const data = await productDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    const [newData] = await productDao.update(req.body);
    res.json(newData);
  }

  async changeStatus(req, res) {
    await productDao.changeStatus(req.body.id, req.body.newStatus);
    res.send("Success");
  }

  async findOne(req, res) {
    const data = await productDao.findByPk(req.params.id);

    if (!data) {
      return res.status(404).send("Not found");
    }

    res.json(data);
  }

  async delete(req, res) {
    const data = await productDao.del(req.params.id);
    res.json(data);
  }

  async listForSaleProducts(req, res) {
    const data = await productDao.findAllForSale();

    res.json(data);
  }

  async listForProductionProducts(req, res) {
    const data = await productDao.findAllForProduction();

    res.json(data);
  }
}

module.exports = new Controller();
