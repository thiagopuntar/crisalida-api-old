module.exports = class Stock {
  constructor(stock) {
    if (stock) {
      this.id = stock.id;
      this.name = stock.name;
      this.qty = stock.qty;
    } else {
    }
  }
};
