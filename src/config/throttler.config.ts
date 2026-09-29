import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10), // ms
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10), // số request tối đa / ttl / IP
}));
