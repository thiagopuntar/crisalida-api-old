require("dotenv").config();
require("../utils/mongoDb");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const OmieService = require("./OmieService");
const OmieDao = require("./OmieDao");
const Logger = require('../logger');
const success = require("../../infra/logger/Logger")("successLogger");
const errorHandler = require("../utils/errorHandler");
const { financeiro } = require("../utils/flowNames");

const omieService = new OmieService();
const omieDao = new OmieDao();

class Automation {
  async run() {
    try {
      await this.finishPayments();
      console.log("Done");
      process.exit(0);
    } catch (error) {
      console.error(error);
    }
  }

  async finishPayments() {
    await omieService.getContasReceber(async (contasReceber) => {
      for (const contaReceberOmie of contasReceber) {
        const logger = new Logger();
        await logger.start({
          flow: financeiro,
          idPagamento: contaReceberOmie.numero_documento,
          valorPagamento: contaReceberOmie.valor_documento
        });

        await logger.log({
          title: 'Conta Receber do Omie',
          content: contaReceberOmie
        });

        try {

          if (!contaReceberOmie.numero_documento) {
            await logger.log({
              title: 'Título manual, sem id de pedido.',
              content: 'Título manual, sem id de pedido.'
            });

            await logger.finish("SUCCESS");

            success.info({
              domain: "finishPayment",
              idOmie: contaReceberOmie.codigo_lancamento_omie,
              id: null,
              message: "Título manual, sem id de pedido."
            });
            continue;
          }

          if (
            dayjs(contaReceberOmie.data_previsao, "DD/MM/YYYY").isAfter(dayjs())
          ) {
            await logger.log({
              title: 'Data de vencimento do título posterior à hoje.',
              content: { data_previsao: dayjs(contaReceberOmie.data_previsao, "DD/MM/YYYY") }
            });
            await logger.finish("SUCCESS");
            continue;
          }

          const pagamentos = await omieDao.listPayments(
            contaReceberOmie.numero_documento
          );

          await logger.log({
            title: 'Pagamentos do pedido no admin',
            content: pagamentos
          });

          const pagamento = pagamentos.find(
            (x) => parseFloat(x.vl) === contaReceberOmie.valor_documento
          );

          if (!pagamento) {
            await logger.log({
              title: 'Nenhum pagamento localizado.',
              content: 'Nenhum pagamento localizado.'
            });
            await logger.finish("ERROR");
            continue;
          }

          await logger.update({
            idPedido: pagamento.orderId,
            idCliente: pagamento.customerId,
            nomeCliente: pagamento.customerName
          });

          const transformed = {
            codigo_lancamento: contaReceberOmie.codigo_lancamento_omie,
            valor: pagamento.vl,
            codigo_baixa_integracao: pagamento.id,
            codigo_conta_corrente: this._getCodigoContaCorrente(pagamento),
            data: contaReceberOmie.data_previsao,
            observacao: `Baixado por integração relativo ao pedido ${pagamento.orderId}`,
          };

          await logger.log({
            title: 'Baixa do pagamento - INPUT',
            content: transformed
          });

          const response = await omieService.lancarRecebimento(
            transformed
          );

          await logger.log({
            title: 'Baixa do pagamento - OUTPUT',
            content: response
          });

          const { codigo_lancamento } = response;


          await omieDao.updatePayment(
            { isOmieUsed: 1, omieId: contaReceberOmie.codigo_lancamento_omie },
            pagamento.id
          );

          success.info({
            domain: "finishPayment",
            idOmie: codigo_lancamento,
            id: pagamento.id,
          });

          await logger.finish("SUCCESS");
        } catch (error) {
          errorHandler(
            error,
            "finishPayments",
            contaReceberOmie.codigo_lancamento_omie
          );

          await logger.handleError(error);
        }
      }
    });
  }

  async updateContaReceber(contaReceberOmie, pagamento) {
    try {
      const order = await omieDao.getOrderByOmieId(contaReceberOmie.nCodPedido);

      const dataPagamento = pagamento 
      ? dayjs(pagamento.date).format("DD/MM/YYYY")
      : dayjs(order.deliveryDate).format("DD/MM/YYYY");
  
      const transformed = {
        codigo_lancamento_omie: contaReceberOmie.codigo_lancamento_omie,
        data_registro: dataPagamento,
        data_emissao: dataPagamento,
        observacao: `${contaReceberOmie.observacao} - Pedido Crisálida id: ${order.id}`,
        id_conta_corrente: pagamento ? pagamento.omieContaId : contaReceberOmie.id_conta_corrente,
        numero_documento: order.id
      }

      const response = await omieService.updateContaReceber(transformed);

      success.info({
        domain: "updateTítulo",
        idOmie: contaReceberOmie.codigo_lancamento_omie,
        id: pagamento.id,
      });

    } catch(error) {
      errorHandler(
        error,
        "updateContaReceber",
        contaReceberOmie.codigo_lancamento_omie
      );
    }
  }

  _getCodigoContaCorrente(payment) {
    if (payment.paymentTypeId === 1 && payment.deliveryType === "Retirada") {
      return "2137502305";
    }
  
    return payment.omieContaId;
  }
}

new Automation().run();
