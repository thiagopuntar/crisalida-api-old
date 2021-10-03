const BaseDao = require("../../infra/database/BaseDao");

module.exports = class CustomerDao extends BaseDao {
  constructor() {
    super("productions");
  }

  async listDemand() {
    const data = await this.db
      .queryBuilder()
      .from("orders as o")
      .join("orderDetails as d", "o.id", "d.orderId")
      .join("products as p", "d.productId", "p.id")
      .where("o.status", 1)
      .select("o.deliveryDate", "d.productId", "p.name", "p.type")
      .sum("d.qty as qty")
      .groupBy("o.deliveryDate", "d.productId", "p.name", "p.type")
      .orderBy("o.deliveryDate", "p.name");

    const compositions = [];
    const demand = [];

    for (const item of data) {
      const { type, ...product } = item;

      if (type === "Kit") {
        let composition = compositions.find((x) => x.id === product.productId);

        if (!composition) {
          composition = await this.getKitComposition(product.productId);
          compositions.push(composition);
        }

        const products = composition.map((x) => ({
          deliveryDate: product.deliveryDate,
          productId: x.id,
          qty: (parseFloat(x.qty) * parseFloat(product.qty)).toFixed(3),
          name: x.name,
        }));

        demand.push(...products);
        continue;
      }

      demand.push(product);
    }

    return demand;
  }

  async getKitComposition(id, trx) {
    const db = trx || this.db;

    return db
      .queryBuilder()
      .from("compositions as c")
      .join("products as p", "c.materialId", "p.id")
      .select("p.id", "p.name", "c.qty")
      .where("c.productId", id)
      .andWhereNot("p.type", "Embalagem");
  }
};
