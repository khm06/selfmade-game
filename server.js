const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // 정적 파일 제공

io.on('connection', (socket) => {
  console.log('새 사용자 접속');

  socket.on('move', (data) => {
    socket.broadcast.emit('update', data); // 다른 사용자에게 전달
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제');
  });
});

server.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});
