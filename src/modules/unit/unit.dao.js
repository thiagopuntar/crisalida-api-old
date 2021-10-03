const BaseDao = require("../../infra/database/BaseDao");

module.exports = class UnitDao extends BaseDao {
  constructor() {
    super("units");
  }
};
