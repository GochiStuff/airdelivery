import { TODEBUG } from "../config/index.js";

const isDevelopment = TODEBUG ;

const colors = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

const getTimestamp = () => new Date().toISOString();

const log = (level, color, context, message, ...args) => {
    const timestamp = getTimestamp();
    const contextStr = context ? `[${context}]` : '';
    
    const formattedMessage = `${colors.dim}${timestamp}${colors.reset} ${color}[${level.toUpperCase()}]${colors.reset} ${colors.cyan}${contextStr}${colors.reset} ${message}`;
    
    console.log(formattedMessage);
    
    if (args.length > 0) {
        args.forEach(arg => {
            console.dir(arg, { depth: null, colors: true });
        });
    }
};

export const logger = {
    
    debug: (context, message, ...args) => {
        if (isDevelopment) {
            log('debug', colors.magenta, context, message, ...args);
        }
    },
    info: (context, message, ...args) => {
        log('info', colors.green, context, message, ...args);
    },
    warn: (context, message, ...args) => {
        log('warn', colors.yellow, context, message, ...args);
    },
    error: (context, message, error, ...args) => {
        // Pass the error object first for structured logging
        log('error', colors.red, context, message, error, ...args);
    },
};

export default logger;