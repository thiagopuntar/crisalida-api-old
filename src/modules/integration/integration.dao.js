const Log = require("../../automations/logger/LogModel");
const dayjs = require("dayjs");
const Integration = require("./integration.model");

module.exports = class IntegrationDao {

  async changeProcessingStatus(name, status) {
    let integration = await Integration.findOne({ name });

    if (!integration) {
      integration = new Integration({
        name, status
      });
      return integration.save();
    }

    integration.status = status;
    await integration.save();
  }

  async listLogs(options = {}) {
    if (!options.createdAt) {
      options.createdAt = { $gte: dayjs().subtract(2, 'day').format("YYYY-MM-DD") };
    }

    const logs = await Log.find(options)
      .select('createdAt idPagamento idPedido idCliente nomeCliente valorPagamento flow status _id')
      .sort('-createdAt')
      .exec();

    return logs;
  }

  async findLogDetail(id) {
    return Log.findById(id);
  }

  async listFlowStatus() {
    return Integration.find().select('name status').exec();
  }
};
