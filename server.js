const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // 정적 파일 제공

const users = []; // 유저 목록 (배열로 변경)
let currentTurnIndex = 0; // 현재 차례의 인덱스

io.on('connection', (socket) => {
  console.log('새 사용자 연결');

  // 유저 입장 처리
  socket.on('join', (nickname) => {
    if (!users.includes(nickname)) {
      users.push(nickname);
      socket.nickname = nickname; // 소켓에 닉네임 저장
    }
    updateUserList();
    updateTurn();
  });

  // 유저가 돌을 두면 다른 클라이언트로 전송
  socket.on('move', ({ row, col, player }) => {
    if (users.length < 2) return; // 두 명 미만인 경우 착수 무시
    if (users[currentTurnIndex] === player) { // 현재 차례인 유저만 착수 가능
      console.log(socket.broadcast)
      socket.broadcast.emit('update-board', { row, col, player });
      io.emit('update-board', { row, col, player }); // 모든 클라이언트에 상태 업데이트
      nextTurn(); // 차례 넘기기
    }
  });

  // 유저 나가기 처리
  socket.on('disconnect', () => {
    if (socket.nickname) {
      const index = users.indexOf(socket.nickname);
      if (index !== -1) {
        users.splice(index, 1); // 유저 목록에서 제거
        if (index <= currentTurnIndex && currentTurnIndex > 0) {
          currentTurnIndex -= 1; // 현재 차례 인덱스 조정
        }
        updateUserList();
        updateTurn();
      }
    }
  });

  // 명시적으로 나가기 처리
  socket.on('leave', (nickname) => {
    const index = users.indexOf(nickname);
    if (index !== -1) {
      users.splice(index, 1); // 유저 목록에서 제거
      if (index <= currentTurnIndex && currentTurnIndex > 0) {
        currentTurnIndex -= 1; // 현재 차례 인덱스 조정
      }
      updateUserList();
      updateTurn();
    }
  });

  socket.on('chatting', (chatting)=>{
    io.emit('update-chat', chatting, socket.nickname)
  })

  // 유저 리스트 갱신
  function updateUserList() {
    io.emit('update-user-list', users);
  }

  // 현재 차례 전송
  function updateTurn() {
    if (users.length >= 2) {
      io.emit('update-turn', users[currentTurnIndex]);
    }
  }

  // 차례 넘기기
  function nextTurn() {
    if (users.length >= 2) {
      currentTurnIndex = (currentTurnIndex + 1) % users.length;
      updateTurn();
    }
  }
  socket.on('reset', () => {
    if (users.length < 2) {
      socket.emit('reset-error', '두 명 이상 접속해야 게임을 리셋할 수 있습니다.');
      return;
    }
    currentTurnIndex = 0; // 차례 초기화
    io.emit('reset-game'); // 모든 클라이언트에 리셋 알림
  });
});

server.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});

//node server.js