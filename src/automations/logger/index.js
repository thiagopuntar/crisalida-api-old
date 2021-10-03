const Log = require('./LogModel');

class Logger {
  async start({ idPedido, idCliente, nomeCliente, idPagamento, valorPagamento, flow }) {
    const log = new Log({
      idPedido,
      idCliente,
      nomeCliente,
      idPagamento,
      valorPagamento,
      flow
    });
  
    const savedLog = await log.save();
    this.innerLog = savedLog;
  }

  async update(props) {
    for (const key in props) {
      this.innerLog[key] = props[key]
    }

    await this.innerLog.save();
  }

  async log({title, content}) {
    this.innerLog.logs.push({
      title,
      content: JSON.stringify(content)
    });

    await this.innerLog.save();
  }

  async finish(status) {
    this.innerLog.status = status;
    await this.innerLog.save();
  }

  async handleError(error) {
    const content = error.response ? error.response.data : (error.message || error.stack);

    await this.log({
      title: 'ERROR',
      content
    });

    await this.finish('ERROR');
  }
}

module.exports = Logger