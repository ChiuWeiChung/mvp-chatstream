import express, { Request, Response } from 'express';
import {Server} from 'socket.io'

const app = express();

app.get('/hello', (_: Request, res: Response) => {
  return res.json({ message: 'hello' }); // 包裝成物件格式
});


const expressServer = app.listen(3001,()=>{
    console.log("Server is running on port 3001");
});
// 使用 Server 創建 Socket.IO 實例
const io = new Server(expressServer);
io.on('connection', (socket) => {
  console.log('A user connected');

  // 接收前端訊息
  socket.on('hello', (msg) => {
    console.log('Received:', msg);
  });
  
  // 傳送訊息到前端
  socket.emit('message', 'Welcome to the server!');
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
