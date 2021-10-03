const BaseDao = require("../../infra/database/BaseDao");
const dayjs = require("dayjs");

class OmieDao extends BaseDao {
  constructor(customerDao) {
    super("payments");
    this.customerDao = customerDao;
  }

  async listCustomers() {
    const customers = await this.db
      .queryBuilder()
      .from("customers as c")
      .whereNull("omieId");

    return customers.map((customer) => ({
      codigo_cliente_integracao: customer.id,
      razao_social: customer.name,
      cnpj_cpf: customer.cpf_cnpj || "",
      telefone1_ddd: customer.phone && customer.phone.slice(0, 2),
      telefone1_numero: customer.phone && customer.phone.slice(2),
      estado: "MG",
    }));
  }

  updateCustomer(data) {
    return this.db("customers").where("id", data.id).update(data);
  }

  async listProducts() {
    const products = await this.db
      .queryBuilder()
      .from("products as p")
      .whereIn("type", ["Produto", "Kit", "Revenda"])
      .andWhereRaw("omieId IS NULL")
      .andWhereNot("price", "0.00")
      .andWhere("isActive", 1);

    return products.map((product) => ({
      codigo_produto_integracao: product.id,
      descricao: product.name,
      unidade: product.unit,
      ncm: product.ncm || "21069090",
      valor_unitario: product.price,
      codigo: product.id,
    }));
  }

  updateProduct(data) {
    return this.db("products").where("id", data.id).update(data);
  }

  async listOrdersToInsert() {
    return this.db
      .queryBuilder()
      .from("orders as o")
      .join("orderTotal as t", "t.id", "o.id")
      .whereNull("o.omieId")
      .andWhere("o.status", ">=", 1)
      // .andWhere("o.status", 3)
      .andWhere("o.deliveryDate", ">=", "2021-02-02")
      // .andWhereRaw("t.totalPaid >= (t.totalValue + t.deliveryTax - t.discount)")
      .select("o.id");
  }

  async listOrdersToUpdate() {
    return this.db
      .queryBuilder()
      .from("orders as o")
      .whereNull("o.isOmieUpdated")
      .andWhereRaw("o.omieId IS NOT NULL")
      .andWhereRaw("o.isOmieFaturado IS NULL")
      .andWhere("o.deliveryDate", ">=", "2021-03-02")
      .andWhere("o.status", ">=", 1)
      .select("o.id");
  }

  async listOrdersToInvoice() {
    return this.db
      .queryBuilder()
      .from("orders as o")
      .join("orderTotal as t", "t.id", "o.id")
      .whereNull("o.isOmieFaturado")
      .andWhereRaw("o.omieId IS NOT NULL")
      .andWhere("o.deliveryDate", ">=", "2021-02-02")
      .andWhereRaw("t.totalPaid >= (t.totalValue + t.deliveryTax - t.discount)")
      .andWhere("o.status", 3)
      .select("o.id");
  }

  updateOrder(data) {
    return this.db("orders").where("id", data.id).update(data);
  }

  async listPayments(omieOrderId) {
    return this.db
      .queryBuilder()
      .from("payments as p")
      .join("paymentTypes as pt", "p.paymentTypeId", "pt.id")
      .join("orders as o", "o.id", "p.orderId")
      .join("customers as c", "c.id", "o.customerId")
      .select(
        "p.id",
        "p.vl",
        "p.date",
        "p.paymentTypeId",
        "pt.tax",
        "pt.deadline",
        "pt.omieContaId",
        "p.orderId",
        "o.customerId",
        "c.name as customerName",
        "o.deliveryType"
      )
      .where("o.id", omieOrderId)
      .andWhereRaw("p.isOmieUsed IS NULL")
      .andWhere("o.deliveryDate", ">=", "2020-10-01");
  }

  async listPaymentsToCreate() {
    return this.db
      .queryBuilder()
      .from("payments as p")
      .join("paymentTypes as pt", "p.paymentTypeId", "pt.id")
      .join("orders as o", "o.id", "p.orderId")
      .join("customers as c", "o.customerId", "c.id")
      .select(
        "p.id",
        "p.vl",
        "p.date",
        "p.paymentTypeId",
        "pt.tax",
        "pt.deadline",
        "pt.omieContaId",
        "p.orderId",
        "o.deliveryDate",
        "o.customerId",
        "o.deliveryType",
        "c.omieId as customerOmieId",
        "c.name as customerName"
      )
      .whereNull("o.omieFinanceiroId")
      .andWhereRaw("o.omieId IS NULL")
      .andWhereRaw("o.isOmieFaturado IS NULL")
      .andWhereRaw("p.omieId IS NULL")
      .andWhere("o.deliveryDate", ">=", "2021-03-01");
  }

  async listPaymentsToInvoice(orderId) {
    return this.db
      .queryBuilder()
      .from("payments as p")
      .join("paymentTypes as pt", "p.paymentTypeId", "pt.id")
      .join("orders as o", "o.id", "p.orderId")
      .join("customers as c", "o.customerId", "c.id")
      .select(
        "p.id",
        "p.vl",
        "p.date",
        "p.paymentTypeId",
        "pt.tax",
        "pt.deadline",
        "pt.omieContaId",
        "p.orderId",
        "o.deliveryDate",
        "o.customerId",
        "o.deliveryType"
      )
      .where("o.id", orderId);
  }

  async listOrdersToInvoicePayment() {
    return this.db
      .queryBuilder()
      .from("orders as o")
      .join("orderTotal as t", "t.id", "o.id")
      .join("customers as c", "c.id", "o.customerId")
      .whereNull("o.isOmieFaturado")
      .andWhereRaw("o.omieId IS NULL")
      .andWhere("o.deliveryDate", ">=", "2021-02-02")
      .andWhere("o.status", 3)
      .select(
        "o.id", 
        "t.totalPaid", 
        "t.totalValue", 
        "t.deliveryTax", 
        "t.discount", 
        "o.customerId", 
        "o.deliveryDate", 
        "c.name as customerName"
      );
  }

  async getOrderByOmieId(omieId) {
    const [order] = await this.db("orders").where("omieId", omieId);
    return order;
  }

  async updatePayment(data, id) {
    return this.db("payments").update(data).where("id", id);
  }
}

module.exports = OmieDao;
