import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
    level: 'info', // Set the default logging level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }), 
        format.splat(),
        format.json() 
    ),
    defaultMeta: { service: 'Testly-logger-service' }, // Default metadata for logs
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
            level: 'info',
        }),

        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Compress rotated files
            maxSize: '20m', // Rotate file if it exceeds 20MB
            maxFiles: '3d', // Keep logs for up to 14 days
            level: 'error', // Log only errors to this file
        }),

        // Log all levels to a daily rotating file
        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Compress rotated files
            maxSize: '20m', // Rotate file if it exceeds 20MB
            maxFiles: '3d', // Keep logs for up to 14 days
            level: 'info', // Log levels info and above to this file
        }),
    ],
});

// Optionally, add a dedicated console logger for debug in non-production
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new transports.Console({
//     format: format.simple(),
//     level: 'debug',
//   }));
// }

export default logger; 