const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const rooms = new Map();

// Room management
function createRoom(roomId, hostId) {
  rooms.set(roomId, {
    id: roomId,
    host: hostId,
    players: [{ id: hostId, name: null, ready: false }],
    gameState: null,
    status: 'waiting' // waiting, playing, finished
  });
  return rooms.get(roomId);
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function joinRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  if (room && room.players.length < 2 && room.status === 'waiting') {
    room.players.push({ id: playerId, name: null, ready: false });
    return room;
  }
  return null;
}

function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  if (room) {
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else if (room.host === playerId && room.players.length > 0) {
      // Transfer host to remaining player
      room.host = room.players[0].id;
    }
    return room;
  }
  return null;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create room
  socket.on('createRoom', (data) => {
    const roomId = data.roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = createRoom(roomId, socket.id);
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room });
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  // Join room
  socket.on('joinRoom', (data) => {
    const { roomId } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('roomError', { message: 'החדר לא קיים' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('roomError', { message: 'החדר מלא' });
      return;
    }
    
    if (room.status !== 'waiting') {
      socket.emit('roomError', { message: 'המשחק כבר התחיל' });
      return;
    }
    
    const updatedRoom = joinRoom(roomId, socket.id);
    if (updatedRoom) {
      socket.join(roomId);
      socket.emit('roomJoined', { room });
      io.to(roomId).emit('roomUpdated', { room: updatedRoom });
      console.log(`Player ${socket.id} joined room ${roomId}`);
    }
  });

  // Set player name
  socket.on('setPlayerName', (data) => {
    const { roomId, playerName, playerIndex } = data;
    const room = getRoom(roomId);
    
    if (room && room.players[playerIndex]) {
      room.players[playerIndex].name = playerName;
      io.to(roomId).emit('roomUpdated', { room });
    }
  });

  // Player ready
  socket.on('playerReady', (data) => {
    const { roomId, playerIndex } = data;
    const room = getRoom(roomId);
    
    if (room && room.players[playerIndex]) {
      room.players[playerIndex].ready = true;
      io.to(roomId).emit('roomUpdated', { room });
      
      // Check if both players are ready
      if (room.players.length === 2 && room.players.every(p => p.ready)) {
        room.status = 'playing';
        io.to(roomId).emit('gameStart', { room });
      }
    }
  });

  // Game state sync
  socket.on('gameStateUpdate', (data) => {
    const { roomId, gameState } = data;
    const room = getRoom(roomId);
    
    if (room) {
      room.gameState = gameState;
      // Broadcast to other players in room
      socket.to(roomId).emit('gameStateSync', { gameState });
    }
  });

  // Move submission
  socket.on('submitMove', (data) => {
    const { roomId, moveData } = data;
    // Broadcast move to other player
    socket.to(roomId).emit('moveReceived', { moveData });
  });

  // Chat message
  socket.on('chatMessage', (data) => {
    const { roomId, message, playerName } = data;
    io.to(roomId).emit('chatMessage', { message, playerName });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        const updatedRoom = leaveRoom(roomId, socket.id);
        if (updatedRoom) {
          io.to(roomId).emit('roomUpdated', { room: updatedRoom });
          io.to(roomId).emit('playerDisconnected', { playerId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Game accessible at http://localhost:${PORT}/index.html`);
});



