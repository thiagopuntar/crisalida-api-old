const logger = require("../../infra/logger/Logger")("omieLogger");

module.exports = (error, domain, id) => {
  let errorMsg;

  if (error.isAxiosError) {
    errorMsg = {
      response: error.response.data,
      requestBody: error.config.data,
    };
  } else {
    errorMsg = JSON.stringify(error.message);
  }

  logger.error({ domain, error: errorMsg, id });
};
