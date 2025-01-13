const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // 정적 파일 제공

const users = new Set(); // 유저 목록

io.on('connection', (socket) => {
  console.log('새 사용자 연결');

  // 유저 입장 처리
  socket.on('join', (nickname) => {
    users.add(nickname);
    socket.nickname = nickname;
    updateUserList();
  });

  // 유저가 돌을 두면 다른 클라이언트로 전송
  socket.on('move', ({ row, col, player }) => {
    socket.broadcast.emit('update-board', { row, col, player });
  });

  // 유저 나가기 처리
  socket.on('disconnect', () => {
    if (socket.nickname) {
      users.delete(socket.nickname);
      updateUserList();
    }
  });

  // 명시적으로 나가기 처리
  socket.on('leave', (nickname) => {
    users.delete(nickname);
    updateUserList();
  });

  // 유저 리스트 갱신
  function updateUserList() {
    io.emit('update-user-list', Array.from(users));
  }
});

server.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});



//node server.js 실행