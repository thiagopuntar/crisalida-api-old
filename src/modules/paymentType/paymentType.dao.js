const BaseDao = require("../../infra/database/BaseDao");

module.exports = class PaymentTypeDao extends BaseDao {
  constructor() {
    super("paymentTypes");
  }

  async findAll() {
    return this.db(this.tableName).orderBy("name");
  }
};
