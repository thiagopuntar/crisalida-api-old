const winston = require("winston");

const formatConsole = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.json()
);

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

winston.loggers.add("emailLogger", {
  format,
  transports: [
    new winston.transports.Console({
      format: formatConsole,
    }),
    new winston.transports.File({
      filename: "./storage/logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "./storage/logs/info.log",
      level: "info",
    }),
  ],
  exitOnError: false,
});

winston.loggers.add("serverLogger", {
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "./logs/info.log", level: "info" }),
  ],
  exitOnError: false,
});

winston.loggers.add("omieLogger", {
  format,
  transports: [
    new winston.transports.Console({
      format: formatConsole,
    }),
    new winston.transports.File({
      filename: "./logs/omie_error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "./logs/omie_info.log",
      level: "info",
    }),
  ],
  exitOnError: false,
});

winston.loggers.add("successLogger", {
  format,
  transports: [
    new winston.transports.Console({
      format: formatConsole,
    }),
    new winston.transports.File({
      filename: "./logs/omie_success.log",
      level: "info",
    }),
  ],
  exitOnError: false,
});

winston.loggers.add("consoleLogger", {
  format,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = (category) => {
  return winston.loggers.get(category);
};
