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

  async listProductsWithStock() {
    return this.db
      .queryBuilder()
      .from("stock as s")
      .join("products as p", "p.id", "s.id")
      .select("p.id", "p.name", "s.stockQty")
      .where("s.stockQty", "<>", 0)
      .orderBy("p.name");
  }

  async listMovements(id) {
    const data = await this.db
      .queryBuilder()
      .from("stockMovement as sm")
      .join("products as p", "p.id", "sm.productId")
      .where("sm.productId", id)
      .select("p.id as productId", "p.name", "sm.qty", "sm.id", "sm.moveType");

    const { productId, name } = data[0];

    const movements = data.map((x) => {
      const { productId, name, ...remain } = x;
      return remain;
    });

    return {
      productId,
      name,
      movements,
    };
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
