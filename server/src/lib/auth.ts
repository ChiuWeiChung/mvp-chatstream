import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';

// 創建 SQLite 資料庫連接
const db = new Database(process.env.DATABASE_URL || './database.db');

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [process.env.CLIENT_AUTH_URL || 'http://localhost:3000',],
  callbacks: {
    signIn: {
      after: async (user: any, request: any) => {
        // 對於 OAuth 登入，重定向到前端
        return {
          redirect: process.env.CLIENT_AUTH_URL || 'http://localhost:3000',
        };
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
