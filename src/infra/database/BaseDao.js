const db = require("./db");

class Schema {
  constructor(schema) {
    this.name = schema.name;
    this.type = schema.type || "array";
    this._fields = schema.fields;
  }

  get fields() {
    return this._fields.map((x) =>
      typeof x === "object" ? Object.keys(x)[0] : x
    );
  }

  get aliasMap() {
    return this._fields
      .filter((x) => typeof x === "object")
      .reduce((acc, x) => Object.assign(acc, x), {});
  }
}

module.exports = class BaseDao {
  constructor(tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findAll() {
    return this.db(this.tableName);
  }

  async findByPk(id) {
    return this.db(this.tableName).where("id", id);
  }

  async insert(data) {
    const id = await this.db(this.tableName).insert(data);
    return this.findByPk(id);
  }

  async update(data) {
    await this.db(this.tableName).where("id", data.id).update(data);
    return this.findByPk(data.id);
  }

  async del(id) {
    return this.db(this.tableName).where("id", id).del();
  }

  async updateNestedData(trx, data, tableName) {
    const { deleted, created, updated } = data.reduce(
      (objs, item) => {
        if (item.deleted) {
          objs.deleted.push(item.id);
          return objs;
        }

        const { deleted, ...obj } = item;
        item.id ? objs.updated.push(obj) : objs.created.push(obj);

        return objs;
      },
      { deleted: [], created: [], updated: [] }
    );

    const promises = [];
    // SQL
    promises.push(trx(tableName).whereIn("id", deleted).del());
    promises.push(trx(tableName).insert(created));

    updated.forEach((x) => {
      promises.push(trx(tableName).where("id", x.id).update(x));
    });

    return Promise.all(promises);
  }

  structureNestedData(data, ...nestedSchemas) {
    nestedSchemas = nestedSchemas.map((x) => new Schema(x));

    return data.reduce((newData, item) => {
      const existentData = newData.find((x) => x.id === item.id);

      const nestedObject = Object.keys(item).reduce((newObj, key) => {
        const schema = nestedSchemas.find((schema) =>
          schema.fields.some((field) => field === key)
        );

        if (!schema) {
          newObj[key] = item[key];
          return newObj;
        }

        const aliasKey = schema.aliasMap[key] || key;

        if (!newObj[schema.name]) {
          newObj[schema.name] = schema.type === "array" ? [] : {};
        }

        const prop = newObj[schema.name];

        if (item[key] != null) {
          if (schema.type === "array") {
            !prop.length && prop.push({});
            prop[0][aliasKey] = item[key];
          } else {
            // object
            prop[aliasKey] = item[key];
          }
        }

        return newObj;
      }, {});

      if (!existentData) {
        newData.push(nestedObject);
        return newData;
      }

      const arraySchemas = nestedSchemas.filter((x) => x.type === "array");
      arraySchemas.forEach((schema) => {
        existentData[schema.name].push(nestedObject[schema.name][0]);
      });

      return newData;
    }, []);
  }

  addParentId(data, objId) {
    return data.map((item) => {
      delete item.deleted;
      return Object.assign(item, objId);
    });
  }
};
