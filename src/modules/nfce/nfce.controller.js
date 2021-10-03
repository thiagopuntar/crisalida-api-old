const axios = require("axios");
const moment = require("moment");
const { NF_DOMAIN, NF_TOKEN, NF_CNPJ_EMITENTE, NF_API_DOMAIN } = process.env;
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const OrderDao = require("../order/order.dao");
const CustomerDao = require("../customer/customer.dao");
const customerDao = new CustomerDao();
const orderDao = new OrderDao(customerDao);

class Controller {
  static _getItems(data) {
    let discount = parseFloat(data.discount);

    return data.details.map((item, index) => {
      const vl = parseFloat(item.vl);
      const totalValue = item.qty * vl;

      let itemDiscount = 0.0;

      if (discount) {
        if (totalValue > discount) {
          itemDiscount += discount;
          discount = 0.0;
        } else {
          itemDiscount = totalValue;
          discount -= totalValue;
        }
      }

      return {
        numero_item: (index + 1).toString(),
        codigo_ncm: item.product.ncm,
        quantidade_comercial: item.qty.toFixed(2),
        quantidade_tributavel: item.qty.toFixed(2),
        cfop: item.product.cfop,
        valor_unitario_tributavel: vl.toFixed(2),
        valor_unitario_comercial: vl.toFixed(2),
        valor_desconto: itemDiscount.toFixed(2),
        valor_frete: index === 0 ? data.orderDeliveryTax : "0.00",
        descricao: item.product.name,
        codigo_produto: item.product.id,
        icms_origem: "0",
        icms_situacao_tributaria: "102",
        unidade_comercial: item.product.unit,
        unidade_tributavel: item.product.unit,
      };
    });
  }

  static _getFormasPagamento(data) {
    return data.payments.map((payment) => ({
      forma_pagamento: payment.paymentType.forma_pagamento,
      valor_pagamento: payment.vl,
      bandeira_operadora: payment.paymentType.bandeira_operadora,
    }));
  }

  static _formatNfce(data) {
    const items = Controller._getItems(data);
    const formas_pagamento = Controller._getFormasPagamento(data);

    const nfceBody = {
      cnpj_emitente: NF_CNPJ_EMITENTE,
      data_emissao: moment().subtract(3, 'hours').format("YYYY-MM-DD HH:mm:ss"),
      modalidade_frete: "9",
      presenca_comprador: "1",
      natureza_operacao: "VENDA AO CONSUMIDOR",
      items,
      formas_pagamento,
    };

    return nfceBody;
  }

  async createNfce(req, res) {
    const { id } = req.params;
    const order = await orderDao.findByPk(id);
    const data = Controller._formatNfce(order);

    axios({
      method: "post",
      url: `${NF_DOMAIN}/v2/nfce`,
      auth: {
        username: NF_TOKEN,
        password: "",
      },
      params: { ref: id },
      data,
    })
      .then(async (response) => {
        const {
          chave_nfe,
          numero,
          serie,
          caminho_xml_nota_fiscal,
          caminho_danfe,
        } = response.data;

        await orderDao.updateNfce({
          id,
          chave_nfe: chave_nfe.replace("NFe", ""),
          numero,
          serie,
          caminho_xml_nota_fiscal,
          caminho_danfe,
        });

        res.send(`${NF_API_DOMAIN}${caminho_danfe}`);
      })
      .catch((err) => {
        const error = err.response ? err.response.data : err;

        res.status(400).send({ error, payload: data });
      });
  }

  async getXmls(req, res) {
    // const dirPath = path.resolve(__dirname, "/temp");
    const { month = moment().subtract(1, "months").format() } = req.query;
    const initialDate = moment(month)
      .startOf("month")
      .format("YYYY-MM-DD HH:mm");
    const finalDate = moment(month).endOf("month").format("YYYY-MM-DD HH:mm");

    const xmlPaths = await orderDao.getXmlPathsByMonth(initialDate, finalDate);
    const zipFile = new AdmZip();
    const promises = xmlPaths.map((xmlPath) => {
      return Controller._saveXml(xmlPath, zipFile);
    });

    await Promise.all(promises);
    res.send(zipFile.toBuffer());
  }

  static async _saveXml(xmlPath, zipFile) {
    const fileName = path.basename(xmlPath);

    const response = await axios({
      url: xmlPath,
      method: "GET",
      responseType: "arraybuffer",
    });

    zipFile.addFile(fileName, response.data);
  }
}

module.exports = new Controller();
