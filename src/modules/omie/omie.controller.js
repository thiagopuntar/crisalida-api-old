const OmieService = require("./omie.service");
const omieService = new OmieService();

class Controller {
  async list(req, res) {
    try {
      let { resource, call } = req.query;
      const configInput = {
        call,
        param: [
          {
            registros_por_pagina: 500,
            pagina: 1
          }
        ]
      }
  
      if (!resource.endsWith("/")) {
        resource += "/";
      }
  
      const data = await omieService.genericList(resource, configInput);
      
      res.json(data);

    } catch(error) {
      if (error.isAxiosInstance) {
        return res.status(400).json(error.response.data);
      }

      res.status(500).json(error);
    }
  }
}

module.exports = new Controller();
