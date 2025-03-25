const socket = io(); // 서버 연결
const board = document.querySelector('#board');
const nicknameForm = document.querySelector('#nickname-form');
const nicknameInput = document.querySelector('#nickname');
const userList = document.querySelector('#user-list');
const chat = document.querySelector('#chat')
const chattingInput = document.querySelector('#chatting')
let nickname = null;
let currentTurn = null; // 현재 차례를 클라이언트에서 확인
let isGameActive = false; // 게임 활성 상태
const boardSize = 15;
const state = Array(boardSize).fill().map(() => Array(boardSize).fill(null));

// 15x15 오목판 생성
for (let i = 0; i < boardSize; i++) {
  for (let j = 0; j < boardSize; j++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.row = i;
    cell.dataset.col = j;
    board.appendChild(cell);
    cell.addEventListener('click', () => handleCellClick(i, j));
  }
}

// 닉네임 입력 후 서버에 전송
nicknameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  nickname = nicknameInput.value.trim();
  if (!nickname) return alert('닉네임을 입력하세요.');

  socket.emit('join', nickname);
  document.querySelector('#chat').classList.remove('displayN')

  nicknameForm.style.display = 'none'; // 닉네임 입력창 숨기기
});

chat.addEventListener('submit', (e) => {
  e.preventDefault();
  chatting = chattingInput.value;
  socket.emit('chatting', chatting);
  chattingInput.value = '';
})

// 서버에서 유저 리스트 업데이트
socket.on('update-user-list', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    const userElement = document.createElement('div');
    userElement.textContent = user;
    userElement.classList.add('user');
    userList.appendChild(userElement);
  });

  // 게임 활성 상태 업데이트
  isGameActive = users.length >= 2;
  if (!isGameActive) {
    alert('게임을 진행하려면 최소 두 명이 접속해야 합니다.');
  }
});
socket.on('update-chat', (chatting, nickname) => {
  let span = document.createElement('span')
  span.innerHTML = `${nickname}: ${chatting}`
  document.querySelector('.chatList').append(span)
})
// 서버에서 차례 업데이트 받기
socket.on('update-turn', (turn) => {
  currentTurn = turn; // 현재 차례 동기화
  if (isGameActive && currentTurn === nickname) {
    document.querySelectorAll('#user-list>.user').forEach((e) => {
      e.classList.remove('on')
      if (e.innerHTML == nickname) {
        e.classList.add('on')
      }
    })
  }
});

// 오목판 클릭 이벤트 처리
function handleCellClick(row, col) {
  if (!isGameActive) {
    return alert('두 명 이상이 접속해야 게임을 진행할 수 있습니다.');
  }
  if (state[row][col] || currentTurn !== nickname) return; // 이미 둔 곳이거나 내 차례가 아니면 무시
  socket.emit('move', { row, col, player: nickname }); // 서버에 착수 요청
  document.querySelectorAll('#user-list>.user').forEach((e) => {
    e.classList.remove('on')
  })
}

// 서버에서 오목판 업데이트 받기
socket.on('update-board', ({ row, col, player }) => {
  state[row][col] = player;
  renderBoard();
});

// 오목판 그리기
function renderBoard() {
  document.querySelectorAll('.cell').forEach(cell => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const value = state[row][col];
    if (value) {
      cell.textContent = value === nickname ? '●' : '○'; // 내 닉네임은 ●, 상대는 ○
    }
  });
}
const resetButton = document.querySelector('#reset-button');

// 오목판 초기화 함수
function resetGame() {
  // 클라이언트 상태 초기화
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      state[i][j] = null;
    }
  }
  renderBoard();
}

// 리셋 버튼 클릭 이벤트
resetButton.addEventListener('click', () => {
  if (!nickname) return alert('닉네임을 입력하고 게임에 참여하세요.');
  socket.emit('reset'); // 서버에 리셋 요청
});

// 서버에서 리셋 이벤트 받기
socket.on('reset-game', () => {
  resetGame();
  alert('게임이 초기화되었습니다!');
});


// 창 닫힐 때 나가기 처리
window.addEventListener('beforeunload', () => {
  if (nickname) socket.emit('leave', nickname);
});

