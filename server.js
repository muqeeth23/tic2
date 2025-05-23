const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let rooms = {};

io.on('connection', socket => {
  socket.on('joinRoom', roomId => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        board: Array(9).fill(null),
        players: {},
        turn: 'X'
      };
    }

    const room = rooms[roomId];
    const playerSymbol = Object.keys(room.players).length === 0 ? 'X' : 'O';

    room.players[socket.id] = playerSymbol;
    socket.emit('symbol', playerSymbol);

    if (Object.keys(room.players).length === 2) {
      io.to(roomId).emit('start', room.turn);
    }

    socket.on('makeMove', index => {
      const r = rooms[roomId];
      if (r && r.turn === r.players[socket.id] && !r.board[index]) {
        r.board[index] = r.turn;
        io.to(roomId).emit('moveMade', { index, symbol: r.turn });

        if (checkWinner(r.board, r.turn)) {
          io.to(roomId).emit('gameOver', `${r.turn} wins!`);
          delete rooms[roomId];
        } else if (r.board.every(cell => cell)) {
          io.to(roomId).emit('gameOver', 'Draw!');
          delete rooms[roomId];
        } else {
          r.turn = r.turn === 'X' ? 'O' : 'X';
          io.to(roomId).emit('turn', r.turn);
        }
      }
    });

    socket.on('disconnect', () => {
      const r = rooms[roomId];
      if (r) {
        delete r.players[socket.id];
        if (Object.keys(r.players).length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('gameOver', 'Opponent disconnected.');
        }
      }
    });
  });
});

function checkWinner(board, sym) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(([a,b,c]) => board[a] === sym && board[b] === sym && board[c] === sym);
}

http.listen(3000, () => console.log('Listening on http://localhost:3000'));

