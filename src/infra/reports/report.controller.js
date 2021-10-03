const path = require("path");
const fs = require("fs-extra");
const hbs = require("handlebars");
const moment = require("moment");
const OrderDao = require("../../modules/order/order.dao");
const CustomerDao = require("../../modules/customer/customer.dao");
const customerDao = new CustomerDao();
const orderDao = new OrderDao(customerDao);

exports.order = async (req, res) => {
  const data = await getOrder(req.params.id);

  if (!data) {
    res.status(404).send("Pedido não localizado.");
  }

  const filePath = path.join(__dirname, "/orders/order.report.hbs");
  const html = await fs.readFile(filePath, "utf-8");
  const reportCompiled = hbs.compile(html)(data);

  res.send(reportCompiled);
};

exports.routeList = async (req, res) => {
  const data = await orderDao.getOrdersToRoute(req.query.ids);
  const objReport = {
    orders: data.map((x) => {
      const totalPaid = parseFloat(x.totalPaid || 0);
      const totalValue =
        parseFloat(x.totalValue) +
        parseFloat(x.orderDeliveryTax) -
        parseFloat(x.discount);

      return {
        customer: x.customer,
        address: formatAddress(x.address),
        deliveryDate: x.deliveryDate,
        comments: x.comments,
        deliveryTax: x.orderDeliveryTax,
        discount: x.discount,
        remainingPayment: (totalValue - totalPaid).toFixed(2),
      };
    }),
  };

  const filePath = path.join(__dirname, "/orders/orderList.report.hbs");
  const html = await fs.readFile(filePath, "utf-8");
  const reportCompiled = hbs.compile(html)(objReport);

  res.send(reportCompiled);
};

async function getOrder(id) {
  const data = await orderDao.findByPk(id);

  if (!data) {
    return null;
  }

  const {
    deliveryDate,
    orderDeliveryTax,
    discount,
    payments,
    details,
    ...formatedData
  } = data;

  formatedData.hasPaymentChange = !!formatedData.paymentChange;
  formatedData.deliveryDate = formatDate(deliveryDate);
  formatedData.deliveryTax = formatCurrency(orderDeliveryTax);
  formatedData.discount = formatCurrency(discount);
  formatedData.address = formatAddress(data);
  const totalPaid = payments.reduce((total, payment) => {
    total += payment.vl;
    return total;
  }, 0.0);

  const total =
    parseFloat(
      details.reduce((total, detail) => (total += detail.vl * detail.qty), 0.0)
    ) +
    parseFloat(data.orderDeliveryTax) -
    parseFloat(data.discount);

  formatedData.totalPaid = formatCurrency(totalPaid);
  formatedData.total = formatCurrency(total);
  formatedData.remainingPayment = formatCurrency(total - totalPaid);
  formatedData.details = details.map((d) => {
    const {
      product: { name },
      comments,
      vl,
      ...obj
    } = d;

    obj.product = comments ? `${name} (${comments})` : name;
    obj.total = vl * obj.qty;
    obj.vl = vl;
    return obj;
  });

  return formatedData;
}

function formatCurrency(val) {
  const floatVal = parseFloat(val);
  return `R$ ${floatVal.toFixed(2)}`;
}

function formatDate(val) {
  if (!val) {
    return "";
  }

  return moment(val).format("DD/MM/YYYY");
}

function formatAddress(val) {
  if (!val || !Object.keys(val).length) {
    return "";
  }

  const { address, addressNumber, complement, district } = val;

  if (!address) {
    return null;
  }

  let formated = address;
  formated += addressNumber ? `, ${addressNumber}` : "";
  formated += complement ? ` ${complement}` : "";
  formated += district ? ` - ${district}` : "";

  return formated;
}
