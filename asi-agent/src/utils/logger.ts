import winston from 'winston';
import config from '../config';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.dirname(config.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    // Write logs to file
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Write errors to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
    }),
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Create a stream for HTTP request logging (if needed)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
