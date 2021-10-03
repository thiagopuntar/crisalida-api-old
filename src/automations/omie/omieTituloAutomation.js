require("dotenv").config();

require("../utils/mongoDb");
const OmieService = require("./OmieService");
const OmieDao = require("./OmieDao");
const success = require("../../infra/logger/Logger")("successLogger");
const errorHandler = require("../utils/errorHandler");
const dayjs = require("dayjs");
const businessDays = require("../../utils/businessDays");
const { createPayments, invoiceOrders } = require("../utils/flowNames");
const Logger = require('../logger');

const omieService = new OmieService();
const omieDao = new OmieDao();

class Automation {
  async run() {
    try {
      await this.createCustomers();
      await this.createPayments();
      await this.invoiceOrders();
      await this.createDeliveryTaxExpense();
      console.log("Done");
      process.exit(0);
    } catch (error) {
      console.error(error);
    }
  }

  async changeCategory() {
    await omieService.listAllContas(async (contasReceber) => {
      for (const contaReceber of contasReceber) {
        try {
          if (contaReceber.codigo_categoria === "1.04.01") {
            const data = {
              codigo_lancamento_omie: contaReceber.codigo_lancamento_omie,
              codigo_categoria: "1.01.01"
            };
            const response = await omieService.updateContaReceber(data);
            console.log(response);
          }
        } catch (error) {
          console.error(error);
        }
      }
    })
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

  async createPayments() {
    const payments = await omieDao.listPaymentsToCreate();

    for (const payment of payments) {
      const logger = new Logger();
      await logger.start({
        flow: createPayments,
        idPedido: payment.orderId,
        idCliente: payment.customerId,
        valorPagamento: payment.vl,
        idPagamento: payment.id,
        nomeCliente: payment.customerName
      });

      try {

        const isAdiantamento = payment.date < payment.deliveryDate;
        if (isAdiantamento) {
          await this._lancaAdiantamentoContaCorrente(payment, logger);
        }

        const data_vencimento = dayjs(payment.date).add(payment.deadline, "day");
        const dataDiaUtil = businessDays(data_vencimento).format("DD/MM/YYYY");
        const observacao = isAdiantamento 
          ? `Adiantamento do pedido ${payment.orderId}, id pagamento ${payment.id}`
          : `Título do pedido ${payment.orderId}, id pagamento ${payment.id}`;

        const transformed = {
          codigo_lancamento_integracao: payment.id,
          codigo_cliente_fornecedor_integracao: payment.customerId,
          data_vencimento: dataDiaUtil,
          data_previsao: dataDiaUtil,
          data_emissao: dayjs(payment.date).format("DD/MM/YYYY"),
          data_registro: dayjs(payment.date).format("DD/MM/YYYY"),
          valor_documento: payment.vl,
          codigo_categoria: isAdiantamento ? "1.04.01" : "1.01.01",
          id_conta_corrente: this._getCodigoContaCorrente(payment),
          numero_documento: payment.orderId,
          id_origem: isAdiantamento ? "ADVR": "VENR",
          observacao,
          baixar_documento: isAdiantamento ? "S" : "N"
        };

        await logger.log({
          title: 'Incluir conta receber - INPUT',
          content: transformed
        });

        const response = await  omieService.incluirContaReceber(transformed);

        await logger.log({
          title: 'Incluir conta receber - OUTPUT',
          content: response
        });

        const { codigo_lancamento_omie } = response;

        await omieDao.updatePayment({ omieId: codigo_lancamento_omie }, payment.id);
        success.info({
          domain: "createPayment",
          idOmie: codigo_lancamento_omie,
          id: payment.id,
        });

        await logger.finish('SUCCESS');
        
      } catch (error) {
        await logger.handleError(error);
      }

    }
  }

  _getCodigoContaCorrente(payment) {
    if (payment.paymentTypeId === 1 && payment.deliveryType === "Retirada") {
      return "2137502305";
    }
  
    return payment.omieContaId;
  }

  async _lancaAdiantamentoContaCorrente(payment, logger) {
    const transformed = {
      cCodIntLanc: `${payment.id}-ADI`,
      cabecalho: {
        nCodCC: "1966403980",
        dDtLanc: dayjs(payment.date).format("DD/MM/YYYY"),
        nValorLanc: payment.vl
      },
      detalhes: {
        cCodCateg: "2.08.01",
        cTipo: "ADI",
        nCodCliente: payment.customerOmieId,
        cObs: `Adiantamento relativo ao pagamento id ${payment.id} do pedido ${payment.orderId}`
      }
    };

    await logger.log({
      title: "Lançamento do adiantamento conta corrente - INPUT",
      content: transformed
    });

    const response = await omieService.incluirLancamentoCC(transformed);

    await logger.log({
      title: "Lançamento do adiantamento conta corrente - OUTPUT",
      content: response
    });
  }

  async invoiceOrders() {
    const orders = await omieDao.listOrdersToInvoicePayment();
    for (const order of orders) {
      const logger = new Logger();
      await logger.start({
        flow: invoiceOrders,
        idPedido: order.id,
        idCliente: order.customerId,
        nomeCliente: order.customerName
      });

      const payments = await omieDao.listPaymentsToInvoice(order.id);
      const adiantamentos = payments.filter(payment => payment.date < order.deliveryDate);

      try {

        await this._invoiceAdiantamentos(adiantamentos, order, logger);        
        const orderTotal = (parseFloat(order.totalValue) + parseFloat(order.deliveryTax) - parseFloat(order.discount));
        const totalPaid = parseFloat(order.totalPaid);
        
        let omieFinanceiroId;
        if (totalPaid < orderTotal) {
          const date = dayjs(order.deliveryDate).format("DD/MM/YYYY");
          const observacao = `Título referente ao ${order.id}. Pagamento não efetuado no admin da Crisálida`;
    
          const transformed = {
            codigo_lancamento_integracao: order.id,
            codigo_cliente_fornecedor_integracao: order.customerId,
            data_vencimento: date,
            data_previsao: date,
            data_emissao: date,
            data_registro: date,
            valor_documento: (orderTotal - totalPaid).toFixed(2),
            codigo_categoria: "1.01.01",
            id_conta_corrente: "1966403980",
            numero_documento: order.id,
            id_origem: "VENR",
            observacao,            
          };

          await logger.log({
            title: 'Título ref a pagamento não registrado no admin - INPUT',
            content: transformed
          });
          
          const response = await  omieService.incluirContaReceber(transformed);

          await logger.log({
            title: 'Título ref a pagamento não registrado no admin - OUTPUT',
            content: response
          });

          const { codigo_lancamento_omie } = response;
          omieFinanceiroId = codigo_lancamento_omie;
  
          success.info({
            domain: "invoiceOrder",
            idOmie: codigo_lancamento_omie,
            id: order.id,
            message: "Pagamento não lançado."
          });
        }
  
        await omieDao.updateOrder({ id: order.id, isOmieFaturado: 1, omieFinanceiroId });

        await logger.log({
          title: "Pedido Faturado",
          content: "Status alterado para faturado no Admin"
        });
  
        success.info({
          domain: "invoiceOrder",
          id: order.id,
          message: "Pedido faturado."
        });

        await logger.finish('SUCCESS');

      } catch (error) {
        errorHandler(error, "invoiceOrders", order.id);
        await logger.handleError(error);
      }

    }
  }

  async _invoiceAdiantamentos(adiantamentos, order, logger) {
    for (const payment of adiantamentos) {
      await logger.log({
        title: `Faturamento do adiantamento ${payment.id}`,
        content: payment
      })

      const date = dayjs(order.deliveryDate).format("DD/MM/YYYY");
      const observacao = `Venda do pedido ${payment.orderId}, id pagamento ${payment.id}`;

      const transformed = {
        codigo_lancamento_integracao: `${payment.id}-FAT`,
        codigo_cliente_fornecedor_integracao: payment.customerId,
        data_vencimento: date,
        data_previsao: date,
        data_emissao: date,
        data_registro: date,
        valor_documento: payment.vl,
        codigo_categoria: "1.01.01",
        id_conta_corrente: "1966403980",
        numero_documento: payment.orderId,
        id_origem: "VENR",
        observacao,
        baixar_documento: "S"
      };

      await logger.log({
        title: `Incluir conta a receber ${payment.id} - INPUT`,
        content: transformed
      })
      
      const response = await omieService.incluirContaReceber(transformed);

      await logger.log({
        title: `Incluir conta a receber ${payment.id} - OUTPUT`,
        content: response
      });
    }
  }

  async createDeliveryTaxExpense() {
    // rotina de criar contas a pagar pro Lucas
      // colocar na tabela custoFrete
      // Somar os pedidos do dia e incluir contas a pagar 
  }
}

async function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

new Automation().run();
