// Barrel file - nơi khác chỉ cần `import { appConfig, ... } from '../config'`
// thay vì import từng file config riêng lẻ.
export { default as appConfig } from './app.config';
export { default as databaseConfig } from './database.config';
export { default as jwtConfig } from './jwt.config';
export { default as redisConfig } from './redis.config';
export { default as throttlerConfig } from './throttler.config';
export { validationSchema } from './validation.schema';
