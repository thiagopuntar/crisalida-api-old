const { Schema, model } = require("mongoose");

const IntegrationSchema = new Schema({
  name: String,
  status: Boolean
});

const Integration = model('Integration', IntegrationSchema);

module.exports = Integration;
