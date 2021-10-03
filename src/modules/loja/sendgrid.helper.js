const axios = require("axios");
const hbs = require("handlebars");
const path = require("path");
const fs = require("fs-extra");
const dayjs = require("dayjs");

module.exports = class SendgridHelper {
  constructor(token) {
    this.http = axios.create({
      baseURL: "https://api.sendgrid.com/v3",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    this.token = token;
  }

  _formatCurrency(val) {
    if (!val) {
      return null;
    }

    return `R$ ${val.toFixed(2).replace(",")}`;
  }

  _formatData(order, urlPedido) {
    const subtotal = order.details.reduce(
      (acc, cur) => (acc += cur.vl * cur.qty),
      0.0
    );

    const enderecoCrisalida = {
      logradouro: "Av Olegário Maciel 1885",
      bairro: "Paineiras",
      cidade: "Juiz de Fora - MG",
    };

    const enderecoEntrega = {
      logradouro: `${order.address} ${order.addressNumber}`,
      bairro: order.district,
      cidade: order.city,
    };

    const taxaEntrega = parseFloat(order.orderDeliveryTax || 0);

    return {
      nomeCliente: order.customer.name,
      dataEntrega: dayjs(order.deliveryDate).format("DD/MM/YYYY"),
      produtos: order.details.map((x) => ({
        quantidade: x.qty,
        nome: x.product.name,
        preco: x.vl,
      })),
      subtotal: this._formatCurrency(subtotal),
      hasTaxaEntrega: !!taxaEntrega,
      taxaEntrega: this._formatCurrency(taxaEntrega),
      total: this._formatCurrency(
        parseFloat(subtotal) + parseFloat(order.orderDeliveryTax || 0)
      ),
      hasEndereco: !!order.address,
      endereco: order.address ? enderecoEntrega : enderecoCrisalida,
      urlPedido,
    };
  }

  async _getMailHtml(data) {
    const filePath = path.resolve(
      __dirname,
      "../../infra/reports/emails/orderConfirmed.hbs"
    );
    const html = await fs.readFile(filePath, "utf-8");
    return hbs.compile(html)(data);
  }

  async sendOrderConfirmationMail(order, urlPedido) {
    const data = this._formatData(order, urlPedido);
    const htmlValue = await this._getMailHtml(data);
    const body = {
      personalizations: [
        {
          to: [
            {
              email: order.customer.email,
              nome: order.customer.name,
            },
          ],
          subject: `Pedido ${order.id}`,
        },
      ],
      from: {
        email: "noreply@crisalidaconfeitaria.com.br",
        name: "Pedidos Crisálida",
      },
      reply_to: {
        email: "noreply@crisalidaconfeitaria.com.br",
        name: "Pedidos Crisálida",
      },
      content: [
        {
          type: "text/html",
          value: htmlValue,
        },
      ],
    };

    const response = await this.http.post("/mail/send", body);
    return response;
  }
};
