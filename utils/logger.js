import winston from 'winston';
import 'winston-daily-rotate-file';

const isDeployment = !!process.env.DEPLOYMENT || !!process.env.VERCEL || process.env.NODE_ENV === 'production';

const transports = [
    new winston.transports.Console({
        format: winston.format.simple(),
    }),
];

// Only use file logging if NOT on Vercel
if (!isDeployment)
{
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '3d',
            zippedArchive: true,
            level: 'info',
        })
    );
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports,
});

export default logger;