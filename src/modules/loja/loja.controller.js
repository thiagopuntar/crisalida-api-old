const LojaDao = require("./loja.dao");
const lojaDao = new LojaDao();

const CustomerDao = require("../customer/customer.dao");
const customerDao = new CustomerDao();

const OrderDao = require("../order/order.dao");
const orderDao = new OrderDao(customerDao);

const {
  PAGSEGURO_EMAIL,
  PAGSEGURO_TOKEN,
  PAGSEGURO_DOMAIN,
  PAGSEGURO_CHECKOUT_SITE,
  SENDGRID_TOKEN,
} = process.env;
const PagseguroHelper = require("./pagseguro.helper");
const pagseguroHelper = new PagseguroHelper(
  PAGSEGURO_TOKEN,
  PAGSEGURO_EMAIL,
  PAGSEGURO_DOMAIN
);

const SendgridHelper = require("./sendgrid.helper");
const sendgridHelper = new SendgridHelper(SENDGRID_TOKEN);

const { QrCodePix } = require("./pix.helper");

const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Sao_Paulo");

const cepUrl = "http://www.viacep.com.br/ws";
class Controller {
  async listProducts(req, res) {
    const data = await lojaDao.listProducts();
    const toSend = data.map((x) => ({
      idProduto: x.id,
      nome: x.title,
      comentario: x.description,
      valor: x.price,
      un: x.unit,
      imagem: x.mainImage,
      idCategoria: x.categoryId,
      nomeCategoria: x.categoryName
    }));

    res.json(toSend);
  }

  async getCep(req, res) {
    const { cep } = req.params;
    const { data } = await axios.get(`${cepUrl}/${cep}/json`);

    if (data.localidade.toLowerCase() !== "juiz de fora") {
      return res
        .status(400)
        .json(
          "Localidade não atendida. Favor selecionar retirada ou entrar em contato com a loja."
        );
    }

    res.json(data);
  }

  async getDistricts(req, res) {
    const data = await lojaDao.getDistricts();
    res.json(data);
  }

  _getFormatedWorkingHour(workingHours) {
    const weekdays = {
      0: "Domingo",
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado",
    };

    return workingHours.map(
      (x) =>
        `${weekdays[x.weekday]}: ${x.openHour.slice(
          0,
          5
        )} às ${x.closeHour.slice(0, 5)}`
    );
  }

  getStoreStatus = async (req, res) => {
    const workingHours = await lojaDao.getWorkingHour();
    const formattedWorkingHours = this._getFormatedWorkingHour(workingHours);

    const isClosedStatus = await lojaDao.getIsClosedStatus();
    const response = {
      workingHours: formattedWorkingHours,
      isClosed: true,
    };

    if (isClosedStatus) {
      return res.json(response);
    }

    const actualDay = dayjs.utc().subtract(3, "hour");

    const actualWeekday = actualDay.day();
    const workingDay = workingHours.find((x) => x.weekday === actualWeekday);

    if (!workingDay) {
      return res.json(response);
    }

    const actualHour = actualDay.hour().toString().padStart(2, "0");
    const actualMinutes = actualDay.minute().toString().padStart(2, "0");
    const actualTime = `${actualHour}:${actualMinutes}`;

    const { openHour, closeHour } = workingDay;

    if (actualTime >= openHour && actualTime <= closeHour) {
      response.isClosed = false;
      return res.json(response);
    }

    return res.json(response);
  };

  async getCategories(req, res) {
    const categories = await lojaDao.getProductCategories();
    res.json(categories);
  }

  getOrderByHash = async (req, res) => {
    const { hash } = req.params;
    const [response] = await lojaDao.getOrderIdByHash(hash);

    if (!response) {
      res.status(400).json({ message: "Pedido inexistente ou já concluído." });
    }

    const order = await orderDao.findByPk(response.id);

    let pix;
    if (order.paymentMethod.toLowerCase() === "pix") {
      pix = await this._generatePix(order);
    }

    const transformed = {
      cliente: {
        nome: order.customer.name,
        endereco: {
          bairro: order.district,
          cidade: order.city,
          complemento: order.complement,
          logradouro: order.address,
          numero: order.addressNumber,
        },
      },
      taxa: order.orderDeliveryTax,
      carrinho: order.details.map((x) => ({
        nome: x.product.name,
        quantidade: x.qty,
        valor: x.vl,
      })),
      formaPagamento: order.paymentMethod,
      observacao: order.comments,
      tipoEntrega: order.address ? "Entrega" : "Retirada",
      troco: order.paymentChange,
      dataEntrega: dayjs(order.deliveryDate).format("DD/MM/YYYY"),
      pix,
      id: order.id,
      horarioEntrega: order.deliveryTime
    };

    res.json(transformed);
  };

  addOrder = async (req, res) => {
    try {
      const { carrinho, cliente, ...pedido } = req.body;

      if (pedido.origem !== "Cardapio") {
        throw new Error("Erro inesperado");
      }

      const validProducts = await this._validateProducts(carrinho);

      const customerId = await this._getCustomer(cliente);

      const orderId = await this._createOrder(
        validProducts,
        customerId,
        cliente.endereco,
        pedido
      );

      const savedOrder = await orderDao.findByPk(orderId);
      // const transformedToPagseguro = pagseguroHelper.formatOrderBody(
      //   savedOrder
      // );
      // const pagseguroCode = await pagseguroHelper.getCheckoutLink(
      //   transformedToPagseguro
      // );

      // const urlCheckout = `${PAGSEGURO_CHECKOUT_SITE}?code=${pagseguroCode}`;
      const urlPedido = `https://cardapio.crisalidaconfeitaria.com.br/meu-pedido/${savedOrder.hashId}`;
      const response = {
        orderId,
        urlPedido,
        hash: savedOrder.hashId,
      };

      if (savedOrder.paymentMethod.toLowerCase() === "pix") {
        const pixObject = await this._generatePix(savedOrder);
        response.pix = pixObject;
      }

      sendgridHelper
        .sendOrderConfirmationMail(savedOrder, urlPedido)
        .catch((err) => console.log(err.response));

      res.json(response);
    } catch (error) {
      console.log(error);
    }
  };

  async _generatePix(order) {
    const subtotal = order.details.reduce(
      (acc, cur) => (acc += cur.vl * cur.qty),
      0.0
    );

    const value = parseFloat(
      (subtotal + parseFloat(order.orderDeliveryTax || 0)).toFixed(2)
    );

    // const chavePix = "fddec917-75cd-48d4-82bc-b77eb0824b13"; // PF
    const chavePix = "31634776000197"; // PJ

    const pixData = {
      version: "01",
      key: chavePix,
      city: "Juiz de Fora",
      name: "Crisálida Confeitaria",
      value,
      guid: order.id.toString(),
      message: `Pedido Crisálida ${order.id}`,
      cep: "36011011",
      notRepeatPayment: false,
      currency: 986,
      countryCode: "BR",
    };

    const pix = QrCodePix(pixData);
    const link = pix.payload();
    const qrCode = await pix.base64();

    return {
      link,
      qrCode,
      chave: chavePix
    };
  }

  async _validateProducts(products) {
    const promises = products.map(async (x) => {
      const [product] = await lojaDao.getProduct(x.id);
      if (!product) return Promise.reject("Product not found!");

      return {
        productId: x.id,
        qty: x.quantidade,
        vl: product.price,
      };
    });

    return Promise.all(promises);
  }

  async _getCustomer(customer) {
    const { tel } = customer;

    if (!tel) {
      throw new Error("Telefone obrigatório.");
    }

    if (tel.length < 10) {
      throw new Error("Telefone em formato inválido.");
    }

    const phoneOnlyNumbers = tel.replace(/\D+/g, "");
    let data = await lojaDao.getCustomerByPhone(phoneOnlyNumbers);

    if (!data) {
      return this._createCustomer({ ...customer, phone: phoneOnlyNumbers });
    }

    await lojaDao.updateCustomer(
      {
        name: customer.nome,
        email: customer.email,
      },
      data.id
    );

    return data.id;
  }

  async _createCustomer(customer) {
    const transformed = {
      phone: customer.phone,
      name: customer.nome,
      email: customer.email,
    };

    const newCustomer = await lojaDao.createCustomer(transformed);
    return newCustomer;
  }

  async _createOrder(products, customerId, address, order) {
    const tiposEntrega = {
      Retirada: "Retirada",
      Entrega: "Pronta Entrega",
    };

    const deliveryType = tiposEntrega[order.tipoEntrega];

    if (!deliveryType) {
      throw new Error("Tipo de entrega não previsto!");
    }

    const trx = await lojaDao.getTransaction();

    const transformed = {
      orderDate: dayjs().utc().subtract(3, "hour").format("YYYY-MM-DD HH:mm"),
      deliveryDate: dayjs()
        .utc()
        .subtract(3, "hour")
        .format("YYYY-MM-DD HH:mm"),
      deliveryType,
      comments: order.observacao,
      status: 1,
      customerId,
      discount: 0,
      deliveryTax: 0,
      origin: order.origem,
      hashId: uuidv4(),
      paymentMethod: order.formaPagamento,
      paymentChange: order.troco,
      deliveryTime: order.horarioEntrega
    };

    if (deliveryType !== "Retirada") {
      transformed.address = address.logradouro;
      transformed.addressNumber = address.numero;
      transformed.complement = address.complemento;
      transformed.district = address.bairro;
      transformed.city = address.cidade;
      transformed.state = "MG";

      const district = await lojaDao.getDistrictByName(address.bairro);

      if (!district) {
        throw new Error("Erro ao buscar o bairro.");
      }

      transformed.deliveryTax = district.tax;
    }

    const orderId = await lojaDao.createOrder(transformed, trx);

    const details = products.map((x) => ({
      ...x,
      orderId,
    }));
    await lojaDao.createOrderDetails(details, trx);
    await trx.commit();

    return orderId;
  }
}

module.exports = new Controller();
