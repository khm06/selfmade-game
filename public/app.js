const socket = io(); // 서버 연결
const board = document.getElementById('board');
const nicknameForm = document.getElementById('nickname-form');
const nicknameInput = document.getElementById('nickname');
const userList = document.getElementById('user-list');

let nickname = null;

// 15x15 오목판 생성
const boardSize = 15;
const state = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
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

  // 서버에 닉네임 전송
  socket.emit('join', nickname);
  nicknameForm.style.display = 'none'; // 닉네임 입력창 숨기기
});

// 서버에서 유저 리스트 업데이트
socket.on('update-user-list', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    const userElement = document.createElement('div');
    userElement.textContent = user;
    userElement.classList.add('user');
    userList.appendChild(userElement);
  });
});

// 오목판 클릭 이벤트 처리
function handleCellClick(row, col) {
  if (state[row][col] || !nickname) return; // 이미 둔 곳이거나 닉네임이 없으면 무시
  state[row][col] = nickname; // 내 닉네임으로 표시
  renderBoard();
  socket.emit('move', { row, col, player: nickname });
}

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

// 서버에서 오목판 업데이트 받기
socket.on('update-board', ({ row, col, player }) => {
  state[row][col] = player;
  renderBoard();
});

// 창 닫힐 때 나가기 처리
window.addEventListener('beforeunload', () => {
  if (nickname) socket.emit('leave', nickname);
});
