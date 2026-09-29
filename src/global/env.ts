// Khai báo lại type cho process.env - gõ process.env.DATABASE_URL sẽ có gợi ý và
// báo lỗi TypeScript nếu gõ sai tên biến, thay vì process.env.X luôn trả về `string | undefined`.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      FRONTEND_URL: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_SECRET: string;
      JWT_REFRESH_EXPIRES_IN: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
    }
  }
}

export {};
