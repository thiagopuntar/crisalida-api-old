const axios = require("axios");
// const { js2xml } = require("xml-js");
var xmlParser = require("js2xmlparser");

const notificationURL = "https://teste987.gateway.linkapi.com.br/v1/teste";

module.exports = class PagSeguroHelper {
  constructor(token, email, domain) {
    this.token = token;
    this.email = email;
    this.http = axios.create({
      baseURL: domain,
    });
  }

  formatOrderBody(order) {
    const transformed = {
      currency: "BRL",
      sender: {
        name: order.customer.name,
        email: order.customer.email,
        phone: {
          areaCode: order.customer.phone.slice(0, 2),
          number: order.customer.phone.slice(2),
        },
      },
      items: {
        item: order.details.map((detail) => ({
          id: detail.product.id,
          description: detail.product.title,
          amount: detail.vl,
          quantity: detail.qty,
        })),
      },
      shipping: {
        cost: order.orderDeliveryTax,
      },
      reference: order.id,
      notificationURL,
      maxUses: 5,
      acceptedPaymentMethods: {
        exclude: {
          paymentMethod: [
            { group: "BOLETO" },
            { group: "DEPOSIT" },
            { group: "BALANCE" },
          ],
        },
      },
      // redirectURL
    };

    const xml = xmlParser.parse("checkout", transformed);
    return xml;
  }

  async getCheckoutLink(body) {
    const url = `/v2/checkout?email=${this.email}&token=${this.token}`;
    const { data } = await this.http.post(url, body, {
      headers: {
        "Content-Type": "application/xml",
      },
    });

    const codeRgx = /<code>(\w+)<\/code>/g;
    const [, code] = codeRgx.exec(data);

    return code;
  }
};
