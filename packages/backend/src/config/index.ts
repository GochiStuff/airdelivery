
import dotenv from 'dotenv';
dotenv.config();

export const DB_URI = process.env.DB_URI;
export const PORT = process.env.PORT || 5500;
export const CORS_ORIGIN = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000"];
export const NODE_ENV = process.env.NODE_ENV !== 'production';
export const TODEBUG = process.env.DEBUG === 'true' ;