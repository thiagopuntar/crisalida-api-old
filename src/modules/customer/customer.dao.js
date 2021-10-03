const BaseDao = require("../../infra/database/BaseDao");

module.exports = class CustomerDao extends (
  BaseDao
) {
  constructor() {
    super("customers");
  }

  get addressSchema() {
    return {
      name: "addresses",
      fields: [
        { addressId: "id" },
        "address",
        "number",
        "complement",
        "district",
        "city",
        "state",
        "zipCode",
        "type",
        "deliveryTax",
        "contact",
      ],
    };
  }

  get customerSchema() {
    return {
      type: "object",
      name: "customer",
      fields: [
        { customerId: "id" },
        "name",
        "phone",
        "instagram",
        "cpf_cnpj",
        "email",
        "omieId"
      ],
    };
  }

  get customerJoined() {
    return this.db
      .queryBuilder()
      .from(`${this.tableName} as c`)
      .select("*", "c.id", "ca.id as addressId")
      .leftJoin("customerAddresses as ca", "c.id", "ca.customerId")
      .orderBy("c.name");
  }

  async findAll() {
    const data = await this.customerJoined;
    const transformed = this.structureNestedData(data, this.addressSchema);
    return transformed;
  }

  async findByPk(id) {
    const data = await this.customerJoined.where("c.id", id);
    const [customer] = this.structureNestedData(data, this.addressSchema);
    return customer;
  }

  async insert(data) {
    const { addresses, ...obj } = data;
    const trx = await this.db.transaction();

    const customerId = await trx(this.tableName).insert(obj);

    const transformedAddresses = this.addParentId(addresses, { customerId });
    await trx("customerAddresses").insert(transformedAddresses);

    await trx.commit();

    return this.findByPk(customerId);
  }

  async update(data) {
    const { addresses = [], ...customer } = data;
    const trx = await this.db.transaction();
    await this.updateNestedData(trx, addresses, "customerAddresses");

    await trx(this.tableName)
      .where("id", customer.id)
      .update({ ...customer, omieId: null });

    await trx.commit();

    return this.findByPk(customer.id);
  }
};
