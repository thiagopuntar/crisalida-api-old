const BaseDao = require("../../infra/database/BaseDao");

module.exports = class CustomerDao extends BaseDao {
  constructor() {
    super("stockMovement");
  }

  async findAll(ids) {
    let query = this.db("stock");
    ids && query.whereIn("id", ids);

    const data = await query;

    return data;
  }

  async insert(data, trx) {
    if (!trx) return super.insert(data);

    const inserted = await trx(this.tableName).insert(data);
    return inserted;
  }

  async removeFromRef(ref, trx) {
    const db = trx || this.db;

    const removed = await db(this.tableName).where("ref", ref).del();
    return removed;
  }
};
