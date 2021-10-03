const OmieServiceBase = require("../../automations/omie/OmieService");

module.exports = class OmieService extends OmieServiceBase {

  async genericList(resource, params) {
    return this._post(resource, params);
  }
}