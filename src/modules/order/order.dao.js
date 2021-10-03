const BaseDao = require("../../infra/database/BaseDao");
const { NF_API_DOMAIN } = process.env;
const dayjs = require("dayjs");

module.exports = class OrderDao extends (
  BaseDao
) {
  constructor(customerDao, productionDao, stockMovementDao) {
    super("orders");
    this.customerDao = customerDao;
    this.productionDao = productionDao;
    this.stockMovementDao = stockMovementDao;
  }

  get productSchema() {
    return {
      name: "product",
      fields: [
        { productId: "id" },
        "name",
        "unit",
        "price",
        "ncm",
        "cfop",
        "title",
      ],
      type: "object",
    };
  }

  get paymentTypeSchema() {
    return {
      name: "paymentType",
      fields: [
        { paymentTypeId: "id" },
        "name",
        "forma_pagamento",
        "bandeira_operadora",
        "tax",
        "deadline",
        "omieContaId"
      ],
      type: "object",
    };
  }

  get findOrderTotal() {
    return this.db
      .queryBuilder()
      .from(`orderTotal as o`)
      .join("customers as c", "o.customerId", "c.id")
      .select(
        "*",
        "o.id",
        "totalValue as totalItens",
        "o.deliveryTax as orderDeliveryTax"
      )
      .orderBy("o.deliveryDate");
  }
  // FIND ALL
  async findAll() {
    const data = await this.findOrderTotal;
    const addNfePath = data.map((x) => ({
      ...x,
      deliveryDate: dayjs(x.deliveryDate).add(3, "hour").format(),
      danfePath: x.caminho_danfe && `${NF_API_DOMAIN}${x.caminho_danfe}`,
      xmlPath:
        x.caminho_xml_nota_fiscal &&
        `${NF_API_DOMAIN}${x.caminho_xml_nota_fiscal}`,
    }));
    return this._addCustomerOnStructure(addNfePath);
  }

  async findByPk(id) {
    const [transformed] = await this.db
      .queryBuilder()
      .from(`${this.tableName} as o`)
      .select("*", "o.id", "o.deliveryTax as orderDeliveryTax", "o.customerId")
      .where("o.id", id);

    const [details, payments, customer] = await Promise.all([
      this._getOrderDetails(id),
      this._getPayments(id),
      this.customerDao.findByPk(transformed.customerId),
    ]);

    transformed.paymentMethodChosen = transformed.paymentMethod;
    transformed.deliveryDate = dayjs(transformed.deliveryDate)
      .add(3, "hour")
      .format();
    transformed.details = details;
    transformed.payments = payments;
    transformed.customer = customer;
    transformed.danfePath =
      transformed.caminho_danfe &&
      `${NF_API_DOMAIN}${transformed.caminho_danfe}`;
    transformed.xmlPath =
      transformed.caminho_xml_nota_fiscal &&
      `${NF_API_DOMAIN}${transformed.caminho_xml_nota_fiscal}`;

    return transformed;
  }

  async _getOrderDetails(orderId) {
    const data = await this.db
      .queryBuilder()
      .from("orderDetails as d")
      .join("products as p", "d.productId", "p.id")
      .where("d.orderId", orderId)
      .select(
        "d.*",
        "p.name",
        "p.unit",
        "p.price",
        "p.ncm",
        "p.cfop",
        "p.title"
      );

    const transformed = this.structureNestedData(data, this.productSchema);
    return transformed;
  }

  async _getPayments(orderId) {
    const data = await this.db
      .queryBuilder()
      .from("payments as p")
      .join("paymentTypes as pt", "p.paymentTypeId", "pt.id")
      .where("p.orderId", orderId)
      .select(
        "p.*",
        "pt.name",
        "pt.forma_pagamento",
        "pt.bandeira_operadora",
        "pt.tax",
        "pt.deadline",
        "pt.omieContaId"
      );

    const transformed = this.structureNestedData(data, this.paymentTypeSchema);
    return transformed;
  }

  async _addCustomerOnStructure(data) {
    const { customerSchema } = this.customerDao;
    return this.structureNestedData(data, customerSchema);
  }

  async insert(data) {
    const { details, payments, ...order } = data;
    const trx = await this.db.transaction();

    const orderId = await trx(this.tableName).insert(order);
    const transformedDetails = this.addParentId(details, { orderId });
    const transformedPayments = this.addParentId(payments, { orderId });

    await trx("orderDetails").insert(transformedDetails);
    await trx("payments").insert(transformedPayments);

    if (data.status > 1) {
      await this.updateStock(trx, transformedDetails, orderId);
    }

    await trx.commit();

    const inserted = await this.findOrderTotal.where("o.id", orderId);
    return this._addCustomerOnStructure(inserted);
  }

  async update(data) {
    const { details = [], payments = [], ...order } = data;
    const trx = await this.db.transaction();
    order.isOmieUpdated = null;

    const paymentsToIntegrate = payments.map((x) => ({ ...x, omieId: null }));

    await trx(this.tableName).where("id", order.id).update(order);
    await this.stockMovementDao.removeFromRef(order.id, trx);
    await this.updateNestedData(trx, details, "orderDetails");
    await this.updateNestedData(trx, paymentsToIntegrate, "payments");

    if (data.status > 1) {
      await this.updateStock(trx, details, order.id);
    }

    await trx.commit();

    const inserted = await this.findOrderTotal.where("o.id", order.id);
    return this._addCustomerOnStructure(inserted);
  }

  async updateNfce(data) {
    const updated = await super.update(data);
    return updated;
  }

  async updateStock(trx, details, orderId) {
    for (const detail of details) {
      const [product] = await trx("products").where("id", detail.productId);

      if (product.type === "Kit") {
        const composition = await this.productionDao.getKitComposition(
          detail.productId,
          trx
        );
        const stockData = composition.map((x) => {
          return {
            qty: (parseFloat(x.qty) * detail.qty * -1).toFixed(3),
            productId: x.id,
            ref: orderId,
            moveType: "V",
          };
        });

        await this.stockMovementDao.insert(stockData, trx);
        continue;
      }

      const stockData = {
        qty: (detail.qty * -1).toFixed(3),
        productId: detail.productId,
        ref: orderId,
        moveType: "V",
      };

      await this.stockMovementDao.insert(stockData, trx);
    }
  }

  async getOrdersToRoute(ids) {
    const data = await this.db
      .queryBuilder()
      .from("orderTotal as o")
      .join("customerAddresses as ca", "o.addressId", "ca.id")
      .join("customers as c", "o.customerId", "c.id")
      .whereIn("o.id", ids.split(","))
      .select("*", "o.id", "o.deliveryTax as orderDeliveryTax");

    return this._addCustomerOnStructure(data);
  }

  async getXmlPathsByMonth(initialDate, finalDate) {
    const orders = await this.db(this.tableName)
      .select("caminho_xml_nota_fiscal")
      .whereNotNull("caminho_xml_nota_fiscal")
      .andWhereBetween("deliveryDate", [initialDate, finalDate]);

    return orders.map((x) => `${NF_API_DOMAIN}/${x.caminho_xml_nota_fiscal}`);
  }

  async listDistricts() {
    return this.db("districts");
  }

  async getOrdersToPick(initialDate, finalDate) {
    const orders = await this.findOrderTotal
      .where("o.status", 1)
      .andWhere("o.deliveryDate", ">=", initialDate)
      .andWhere("o.deliveryDate", "<=", finalDate);

    const promises = orders.map(async (x) => {
      x.deliveryDate = dayjs(x.deliveryDate).add(3, "hour").format();
      x.details = await this._getOrderDetails(x.id);
      return x;
    });

    const data = await Promise.all(promises);
    return this._addCustomerOnStructure(data);
  }

  async pick(id) {
    const data = await this.db(this.tableName)
      .update({ status: 2 })
      .where("id", id);

    return data;
  }
};
