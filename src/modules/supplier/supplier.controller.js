exports.list = async (req, res) => {
  const data = await supplier.findAll();
  res.json(data);
};

exports.insert = async (req, res) => {
  const data = await supplier.create(req.body);
  res.json(data);
};

exports.getById = async (req, res) => {
  const data = await supplier.findByPk(req.params.id);

  if (!data) {
    return res.status(404).send("Not found");
  }

  res.json(data);
};

exports.update = async (req, res) => {
  const data = await supplier.findByPk(req.params.id);

  if (!data) {
    return res.status(404).send("Not found");
  }

  const newData = await data.update(req.body);
  res.json(newData);
};

exports.delete = async (req, res) => {
  const data = await supplier.findByPk(req.params.id);

  if (!data) {
    return res.status(404).send("Not found");
  }

  await data.destroy();
  res.json(data);
};
