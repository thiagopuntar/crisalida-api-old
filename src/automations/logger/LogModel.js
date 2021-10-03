const { Schema, model } = require('mongoose');

const LogSchema = new Schema({
  idPedido: String,
  idPagamento: String,
  createdAt: { type: Date, default: new Date().toISOString() },
  idCliente: String,
  nomeCliente: String,
  valorPagamento: Number,
  flow: String,
  status: { type: String, enum: ['SUCCESS', 'ERROR'] },
  logs: [
    {
      title: String,
      content: String
    }
  ]
})

module.exports = model('Log', LogSchema);