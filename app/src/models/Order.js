import { date } from 'quasar';
import Date2, { dateBuilder } from '../utils/dateHelper'

class Detail {
  constructor(detail) {
    if (detail) {
      this.id = detail.id;
      this._product = detail.product;
      this.qty = detail.qty;
      this.vl = detail.vl;
      this.comments = detail.comments;
    } else {
      this.product = null;
      this.qty = 0.0;
      this.vl = 0.0;
    }
  }

  get product() {
    return this._product;
  }

  set product(product) {
    this._product = product;

    if (!product) {
      this.vl = 0.0;
    }

    if (product && this.vl === 0.0) {
      this.vl = product.price;
    }
  }

  get unit() {
    if (this.product) {
      return this.product.unit;
    }

    return '';

  }

  get total() {
    return parseFloat((parseFloat(this.vl) * parseFloat(this.qty)).toFixed(2));
  }

  toJSON() {
    const { _product, ...obj } = this;
    obj.productId = _product.id;

    return obj;
  }
}

class Payment {
  constructor(payment) {
    if (payment) {
      this.id = payment.id
      this.vl = parseFloat(payment.vl);
      this.date = date.formatDate(payment.date, "DD/MM/YYYY");
      this.paymentType = payment.paymentType;
    } else {
      this.vl = 0.0;
      this.date = date.formatDate(new Date(), "DD/MM/YYYY");
      this.paymentType = null;
    }
  }

  toJSON() {
    const { date, paymentType, ...obj } = this;
    obj.date = dateBuilder(date);
    obj.paymentTypeId = paymentType && paymentType.id;

    return obj;
  }
}

export default class Order {
  constructor(order) {
    if (order) {
      this.id = order.id;
      this.orderDate = date.formatDate(order.orderDate, "DD/MM/YYYY");
      this.comments = order.comments;
      this.deliveryDate = date.formatDate(order.deliveryDate, "DD/MM/YYYY");
      this._deliveryType = order.deliveryType;
      this.deliveryTax = order.deliveryTax;
      this.discount = order.discount;
      this.status = order.status;
      this._customer = order.customer;
      this._address = order.address;
      this.details = order.details ? order.details.map(d => new Detail(d)) : [];
      this.payments = order.payments ? order.payments.map(p => new Payment(p)) : [];
      this.isSeparated = order.isSeparated;
      this.isDelivered = order.isDelivered;
      this._totalItens = order.totalItens;
      this._totalPaid = order.totalPaid;
    } else {
      this._customer = null;
      this._address = null;
      this.deliveryTax = 0.0;
      this._deliveryType = null;
      this.discount = 0.0;
      this.orderDate = date.formatDate(new Date(), "DD/MM/YYYY");
      this.details = [ new Detail() ];
      this.payments = [ new Payment() ];
      this.isSeparated = false;
      this.isDelivered = false;
    }
  }

  get customer() {
    return this._customer;
  }

  set customer(customer) {
    this._customer = customer;

    if (customer) {
      const mainAddress = customer.addresses[0];
      
      if (mainAddress) {
        this.address = mainAddress;
      }
    }
  }

  get address() {
    return this._address;
  }

  set address(address) {
    this._address = address;
    const { deliveryTax } = address || {};

    if (deliveryTax) {
      this.deliveryTax = deliveryTax;
    }
  }

  get deliveryType() {
    return this._deliveryType;
  }

  set deliveryType(deliveryType) {
    this._deliveryType = deliveryType;

    if (deliveryType === 'Retirada') {
      this.address = null;
      this.deliveryTax = 0.0;
    }
  }

  get hasDelivery() {
    return this.deliveryType !== 'Retirada';
  }

  get isRealTimeDelivery() {
    return this.deliveryType === 'Pronta Entrega';
  }

  get total() {
    const totalItens = this._totalItens || this.details.reduce((total, item) => {
      total += item.total;
      return total;
    }, 0.0);

    return parseFloat(totalItens) + parseFloat(this.deliveryTax) - parseFloat(this.discount);
  }

  get totalPaid() {
    return this._totalPaid === undefined 
      ? parseFloat(this.payments.reduce((total, payment) => {
        total += parseFloat(payment.vl);
        return total;
      }, 0.0))
      : parseFloat(this._totalPaid);
  }

  get remainingPayment() {
    return this.total - this.totalPaid;
  }

  addDetail() {
    this.details.push(new Detail());
  }

  addPayment() {
    this.payments.push(new Payment());
  }

  toJSON() {
    const { _address, _customer, _deliveryType, orderDate, deliveryDate, ...obj } = this;
    obj.addressId = _address ? _address.id : null;
    obj.customerId = _customer &&_customer.id;
    obj.orderDate = dateBuilder(orderDate);
    obj.deliveryDate = dateBuilder(deliveryDate);
    obj.deliveryType = _deliveryType;
    obj.details = this.details.filter(x => x.product);

    return obj;
  }
}