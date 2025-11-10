const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const addLog = (log) => logger.info(log)

module.exports = {
    addLog
}