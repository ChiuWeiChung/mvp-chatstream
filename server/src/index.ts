import { config } from 'dotenv';
config(); // 先載入環境變數
import express from 'express';
import namespaces from './data/namespaces';
import cors from 'cors';
import http from 'http';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { streamKeyRouter } from './routes/stream-key.routes';
import { rtmpRouter } from './routes/rtmp.routes';
import { createIOServer, registerNamespaces } from './socket';
import { IoContainer } from './classes/IoContainer';

const app = express();
const server = http.createServer(app);

// ===== Middlewares =====
app.use(
  cors({
    origin: [process.env.CLIENT_AUTH_URL || 'http://localhost:3000'],
    credentials: true,
  }),
);

// ===== API Routes =====
app.all('/api/auth/*', toNodeHandler(auth)); // better-auth routes
app.use('/api', streamKeyRouter); // streamKey routes (提供 client 使用)
app.use('/rtmp', rtmpRouter); // rtmp routes (提供 Nginx 推流使用)

// ===== Socket.IO =====
const io = createIOServer(server, {
  // Note: 測試需求，所以允許所有來源，但實際上應該要限制來源
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
});
IoContainer.set(io);
registerNamespaces(io, namespaces); // 註冊所有 namespace

// ===== 啟動 =====
const PORT = Number(process.env.PORT) 
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});