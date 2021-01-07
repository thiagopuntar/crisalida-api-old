require("dotenv").config();

const OmieService = require("./OmieService");
const OmieDao = require("./OmieDao");
const OrderDao = require("../../modules/order/order.dao");
const CustomerDao = require("../../modules/customer/customer.dao");
const orderDt = require("./omieOrderDt");
const logger = require("../../infra/logger/Logger")("automationLogger");
const success = require("../../infra/logger/Logger")("successLogger");
const errorHandler = require("../utils/errorHandler");

const omieService = new OmieService();
const omieDao = new OmieDao();
const customerDao = new CustomerDao();
const orderDao = new OrderDao(customerDao);

class Automation {
  async run() {
    try {
      await this.createCustomers();
      await this.createProducts();
      await this.createOrders();
      // await this.updateOrders();
      // await this.invoiceOrders();
      // await this.finishPayments();
      console.log("Done");
      process.exit(0);
    } catch (error) {
      logger.error(error);
    }
  }

  async createCustomers() {
    const customers = await omieDao.listCustomers();
    const customersSave = customers.map(async (customer) => {
      try {
        const { codigo_cliente_omie } = await omieService.insertCustomer(
          customer
        );

        await omieDao.updateCustomer({
          id: customer.codigo_cliente_integracao,
          omieId: codigo_cliente_omie,
        });

        success.info({
          domain: "customer",
          idOmie: codigo_cliente_omie,
          id: customer.id,
        });
      } catch (error) {
        errorHandler(error, "customer", customer.id);
      }
    });

    await Promise.all(customersSave);
  }

  async createProducts() {
    const products = await omieDao.listProducts();
    const productsSave = products.map(async (product) => {
      try {
        const { codigo_produto } = await omieService.insertProduct(product);

        await omieDao.updateProduct({
          id: product.codigo,
          omieId: codigo_produto,
        });

        success.info({
          domain: "product",
          idOmie: codigo_produto,
          id: product.id,
        });
      } catch (error) {
        errorHandler(error, "product", product.id);
      }
    });

    await Promise.all(productsSave);
  }

  async createOrders() {
    const ordersId = await omieDao.listOrdersToInsert();

    const ordersSave = ordersId.map(async ({ id }) => {
      try {
        const order = await orderDao.findByPk(id);
        const transformed = orderDt(order);

        const { codigo_pedido } = await omieService.insertPedido(transformed);

        await omieDao.updateOrder({
          id,
          omieId: codigo_pedido,
        });

        success.info({
          domain: "createOrder",
          idOmie: codigo_pedido,
          id,
        });
      } catch (error) {
        errorHandler(error, "createOrder", id);
      }
    });

    await Promise.all(ordersSave);
  }

  async updateOrders() {
    const ordersId = await omieDao.listOrdersToUpdate();
    const ordersSave = ordersId.map(async (id) => {
      try {
        const order = await orderDao.findByPk(id);
        const transformed = orderDt(order);

        const { codigo_pedido } = await omieService.insertPedido(transformed);

        await omieDao.updateOrder({
          id,
          omieId: codigo_pedido,
          omieFinanceiroId: 1,
        });
      } catch (error) {
        errorHandler(error, "updateOrder", id);
      }
    });

    await Promise.all(ordersSave);
  }

  async invoiceOrders() {
    // const ordersId = await omieDao.listOrdersToInvoice();
    const ordersId = [673];

    const ordersSave = ordersId.map(async (id) => {
      try {
        await omieService.faturarPedido(id);

        await omieDao.updateOrder({
          id,
          isOmieFaturado: 1,
        });
      } catch (error) {
        errorHandler(error, "invoiceOrder");
      }
    });

    await Promise.all(ordersSave);
  }

  async finishPayments() {
    await omieService.getContasReceber(async (contasReceber) => {
      try {
        for (const contaReceberOmie of contasReceber) {
          const pagamentos = await omieDao.listPayments(
            contaReceberOmie.nCodPedido
          );
        }
      } catch (error) {
        errorHandler(error, "finishPayments");
      }
    });
  }
}

new Automation().run();
