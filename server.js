const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let rooms = {};

io.on('connection', socket => {
  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        board: Array(9).fill(null),
        moveHistory: [],
        players: {},
        turn: 'X'
      };
    }

    const room = rooms[roomId];
    const playerSymbol = Object.values(room.players).some(p => p.symbol === 'X') ? 'O' : 'X';
    room.players[socket.id] = { symbol: playerSymbol, name: username };

    socket.emit('symbol', { symbol: playerSymbol, name: username });

    if (Object.keys(room.players).length === 2) {
      const players = Object.values(room.players).map(p => p.name);
      io.to(roomId).emit('start', { turn: room.turn, players });
    }

    socket.on('makeMove', index => {
      const player = room.players[socket.id];
      if (player && room.turn === player.symbol && !room.board[index]) {
        room.board[index] = player.symbol;
        room.moveHistory.push({ index, symbol: player.symbol });
        io.to(roomId).emit('moveMade', { index, symbol: player.symbol });

        if (checkWinner(room.board, player.symbol)) {
          io.to(roomId).emit('gameOver', `${player.name} (${player.symbol}) wins!`);
          delete rooms[roomId];
        } 
        else if (room.board.every(cell => cell !== null)) {
          // 💡 Draw: remove oldest move and switch turn
          const oldest = room.moveHistory.shift();
          room.board[oldest.index] = null;
          io.to(roomId).emit('rollbackMove', oldest.index);
          io.to(roomId).emit('draw-continue', `Board was full. Oldest move (${oldest.symbol}) removed at position ${oldest.index}.`);

          // ✅ Switch turn to next player after rollback
          room.turn = room.turn === 'X' ? 'O' : 'X';
          io.to(roomId).emit('turn', room.turn);
        } 
        else {
          // Switch turns normally
          room.turn = room.turn === 'X' ? 'O' : 'X';
          io.to(roomId).emit('turn', room.turn);
        }
      }
    });

    socket.on('disconnect', () => {
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        if (Object.keys(rooms[roomId].players).length === 0) {
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

