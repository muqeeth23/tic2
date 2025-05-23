const socket = io();
let mySymbol = '';
let isMyTurn = false;
let currentRoom = '';
let myName = '';

function joinGame() {
  const roomId = document.getElementById('roomInput').value.trim();
  const username = document.getElementById('username').value.trim();
  if (!roomId || !username) {
    alert("Enter both room ID and name.");
    return;
  }
  myName = username;
  currentRoom = roomId;
  socket.emit('joinRoom', { roomId, username });
}

socket.on('symbol', data => {
  mySymbol = data.symbol;
  document.getElementById('status').innerText = `You are ${data.symbol} (${data.name})`;
});

socket.on('start', ({ turn, players }) => {
  isMyTurn = (turn === mySymbol);
  updateStatus(turn);
});

socket.on('turn', turn => {
  isMyTurn = (turn === mySymbol);
  updateStatus(turn);
});

socket.on('moveMade', ({ index, symbol }) => {
  document.querySelectorAll('.cell')[index].innerText = symbol;
});

socket.on('rollbackMove', index => {
  document.querySelectorAll('.cell')[index].innerText = '';
});

socket.on('draw-continue', msg => {
  document.getElementById('status').innerText = msg;
});

socket.on('gameOver', message => {
  alert(message);
  location.reload();
});

function updateStatus(turn) {
  document.getElementById('status').innerText = isMyTurn ? "Your turn" : "Opponent's turn";
}

function createBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => {
      if (isMyTurn && !cell.innerText) {
        socket.emit('makeMove', i);
      }
    });
    board.appendChild(cell);
  }
}
createBoard();

