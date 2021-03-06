import Service from "./Service";

export default class ProductService extends Service {
  constructor() {
    super("products");
  }

  listForSaleProducts() {
    return this._axios
      .get(`${this._url}/forSale`)
      .then(res => res.data)
      .catch(err => {
        throw err;
      });
  }

  listMaterials(type) {
    return this._axios
      .get(`${this._url}/materials`, {
        params: { type }
      })
      .then(res => res.data)
      .catch(err => {
        throw err;
      });
  }
}
