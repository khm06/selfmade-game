const socket = io(); // 서버와 연결
const board = document.getElementById('board');
const boardSize = 15;
const state = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let currentTurn = 'black'; // 흑이 시작

// 오목판 생성
for (let i = 0; i < boardSize; i++) {
  for (let j = 0; j < boardSize; j++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.row = i;
    cell.dataset.col = j;
    board.appendChild(cell);
    cell.addEventListener('click', () => handleMove(i, j));
  }
}

function handleMove(row, col) {
  if (state[row][col]) return; // 이미 둔 곳
  state[row][col] = currentTurn;
  socket.emit('move', { row, col, color: currentTurn });
  renderBoard();
  currentTurn = currentTurn === 'black' ? 'white' : 'black';
}

function renderBoard() {
  document.querySelectorAll('.cell').forEach(cell => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const value = state[row][col];
    if (value) {
      cell.textContent = value === 'black' ? '●' : '○';
      cell.style.color = value === 'black' ? 'black' : 'white';
    }
  });
}

socket.on('update', ({ row, col, color }) => {
  state[row][col] = color;
  renderBoard();
  currentTurn = color === 'black' ? 'white' : 'black';
});
