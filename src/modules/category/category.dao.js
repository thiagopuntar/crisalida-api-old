const BaseDao = require("../../infra/database/BaseDao");

module.exports = class FamilyDao extends (
  BaseDao
) {
  constructor() {
    super("productCategories");
  }

  async findAll() {
    return this.db(this.tableName).orderBy("name");
  }
};
