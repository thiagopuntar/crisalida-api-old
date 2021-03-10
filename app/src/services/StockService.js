import Service from "./Service";

export default class StockService extends Service {
  constructor() {
    super("stock");
  }

  listProductsStock() {
    return this._axios.get(`${this._url}/products`).then(res => res.data);
  }

  listProductMovement(productId) {
    return this._axios
      .get(`${this._url}/movements/${productId}`)
      .then(res => res.data);
  }
}
