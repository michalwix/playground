// Online Multiplayer Functions

// Initialize Socket.io connection
function initSocket() {
    if (typeof io === 'undefined') {
        console.error('Socket.io not loaded!');
        showToast('שגיאה: Socket.io לא נטען', 'error');
        return;
    }
    
    const serverUrl = window.location.origin; // Use same origin as the page
    console.log('Connecting to:', serverUrl);
    
    // Disconnect existing connection if any
    if (gameState.socket) {
        gameState.socket.disconnect();
    }
    
    gameState.socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });
    
    gameState.socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        showToast('מחובר לשרת', 'reward');
    });
    
    gameState.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        showToast('התנתק מהשרת', 'error');
    });
    
    gameState.socket.on('connect_error', () => {
        updateConnectionStatus(false);
        showToast('שגיאת חיבור לשרת', 'error');
    });
    
    gameState.socket.on('roomCreated', (data) => {
        gameState.roomId = data.roomId;
        gameState.playerIndex = 0;
        updateRoomUI(data.room);
    });
    
    gameState.socket.on('roomJoined', (data) => {
        gameState.playerIndex = 1;
        updateRoomUI(data.room);
    });
    
    gameState.socket.on('roomUpdated', (data) => {
        updateRoomUI(data.room);
    });
    
    gameState.socket.on('roomError', (data) => {
        showToast(data.message, 'error');
    });
    
    gameState.socket.on('gameStart', (data) => {
        startOnlineGame(data.room);
    });
    
    gameState.socket.on('gameStateSync', (data) => {
        // Sync game state from other player
        if (data.gameState) {
            syncGameState(data.gameState);
        }
    });
    
    gameState.socket.on('moveReceived', (data) => {
        // Handle move from other player
        handleRemoteMove(data.moveData);
    });
    
    gameState.socket.on('playerDisconnected', (data) => {
        showToast('השחקן השני התנתק', 'error');
    });
}

// Update room UI
function updateRoomUI(room) {
    const roomInfo = document.getElementById('roomInfo');
    const roomCode = document.getElementById('roomCode');
    const roomStatus = document.getElementById('roomStatus');
    const roomPlayers = document.getElementById('roomPlayers');
    const startBtn = document.getElementById('startOnlineGameBtn');
    
    if (!room) return;
    
    roomInfo.style.display = 'block';
    roomCode.textContent = room.id;
    
    // Update players list
    roomPlayers.innerHTML = '';
    room.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.style.margin = '5px 0';
        playerDiv.textContent = `${index + 1}. ${player.name || 'שחקן ' + (index + 1)} ${player.ready ? '✓ מוכן' : ''}`;
        roomPlayers.appendChild(playerDiv);
    });
    
    if (room.players.length === 1) {
        roomStatus.textContent = 'ממתין לשחקן שני...';
        startBtn.style.display = 'none';
    } else if (room.players.length === 2) {
        if (room.players.every(p => p.ready)) {
            roomStatus.textContent = 'שני השחקנים מוכנים! המשחק יתחיל בקרוב...';
            startBtn.style.display = 'none';
        } else {
            roomStatus.textContent = 'המתן שהשחקן השני יהיה מוכן';
            // Show ready button if it's your turn to be ready
            const myPlayer = room.players[gameState.playerIndex];
            if (myPlayer && !myPlayer.ready) {
                startBtn.textContent = 'אני מוכן';
                startBtn.style.display = 'block';
            } else {
                startBtn.style.display = 'none';
            }
        }
    }
}

// Create room
function createRoom() {
    const playerNameInput = document.getElementById('onlinePlayerName');
    const playerName = playerNameInput ? playerNameInput.value.trim() || 'שחקן 1' : 'שחקן 1';
    
    if (!gameState.socket) {
        showToast('מתחבר לשרת...', 'error');
        // Try to initialize socket
        if (typeof io !== 'undefined') {
            initSocket();
            setTimeout(() => createRoom(), 500);
        } else {
            showToast('Socket.io לא נטען. אנא רענן את הדף.', 'error');
        }
        return;
    }
    
    if (!gameState.socket.connected) {
        showToast('לא מחובר לשרת. מנסה להתחבר...', 'error');
        // Try to reconnect
        if (gameState.socket.disconnected) {
            gameState.socket.connect();
        }
        setTimeout(() => createRoom(), 1000);
        return;
    }
    
    gameState.socket.emit('createRoom', {});
    
    // Set player name
    setTimeout(() => {
        if (gameState.socket && gameState.roomId) {
            gameState.socket.emit('setPlayerName', {
                roomId: gameState.roomId,
                playerName: playerName,
                playerIndex: 0
            });
        }
    }, 200);
}

// Join room
function joinRoom() {
    const roomIdInput = document.getElementById('roomIdInput');
    const roomId = roomIdInput ? roomIdInput.value.trim().toUpperCase() : '';
    const playerNameInput = document.getElementById('onlinePlayerName');
    const playerName = playerNameInput ? playerNameInput.value.trim() || 'שחקן 2' : 'שחקן 2';
    
    if (!roomId) {
        showToast('הכנס קוד חדר', 'error');
        return;
    }
    
    if (!gameState.socket) {
        showToast('מתחבר לשרת...', 'error');
        // Try to initialize socket
        if (typeof io !== 'undefined') {
            initSocket();
            setTimeout(() => joinRoom(), 500);
        }
        return;
    }
    
    if (!gameState.socket.connected) {
        showToast('לא מחובר לשרת. מנסה להתחבר...', 'error');
        // Try to reconnect
        if (gameState.socket.disconnected) {
            gameState.socket.connect();
        }
        setTimeout(() => joinRoom(), 1000);
        return;
    }
    
    gameState.socket.emit('joinRoom', { roomId });
    
    // Set player name after joining
    setTimeout(() => {
        if (gameState.socket && gameState.roomId) {
            gameState.socket.emit('setPlayerName', {
                roomId: gameState.roomId,
                playerName: playerName,
                playerIndex: 1
            });
        }
    }, 200);
}

// Player ready
function setPlayerReady() {
    if (gameState.socket && gameState.roomId !== null) {
        gameState.socket.emit('playerReady', {
            roomId: gameState.roomId,
            playerIndex: gameState.playerIndex
        });
    }
}

// Start online game
function startOnlineGame(room) {
    const names = room.players.map(p => p.name || 'שחקן');
    gameState.isOnline = true;
    gameState.isMyTurn = gameState.playerIndex === 0; // First player starts
    
    document.getElementById('startModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    initGame('2', names);
    
    // Update turn indicator
    updateTurnIndicator();
}

// Sync game state
function syncGameState(remoteState) {
    // Merge remote state with local state
    if (remoteState.board) gameState.board = remoteState.board;
    if (remoteState.players) gameState.players = remoteState.players;
    if (remoteState.currentPlayerIndex !== undefined) {
        gameState.currentPlayerIndex = remoteState.currentPlayerIndex;
        gameState.isMyTurn = gameState.currentPlayerIndex === gameState.playerIndex;
    }
    if (remoteState.racks) gameState.racks = remoteState.racks;
    if (remoteState.bag) gameState.bag = remoteState.bag;
    
    renderAll();
    updateTurnIndicator();
}

// Handle remote move
function handleRemoteMove(moveData) {
    // Process move from other player
    if (moveData.valid) {
        gameState.isMyTurn = true;
        updateTurnIndicator();
        renderAll();
        showToast(`השחקן השני ביצע מהלך: +${moveData.score} נקודות`, 'reward');
    }
}

// Send game state update
function sendGameStateUpdate() {
    if (gameState.socket && gameState.roomId && gameState.isOnline) {
        gameState.socket.emit('gameStateUpdate', {
            roomId: gameState.roomId,
            gameState: {
                board: gameState.board,
                players: gameState.players,
                currentPlayerIndex: gameState.currentPlayerIndex,
                racks: gameState.racks,
                bag: gameState.bag
            }
        });
    }
}

// Update turn indicator for online play
function updateTurnIndicator() {
    const indicator = document.getElementById('currentPlayerName');
    const turnStatus = document.getElementById('turnStatus');
    
    if (gameState.isOnline) {
        if (gameState.isMyTurn) {
            indicator.textContent = gameState.players[gameState.playerIndex].name;
            if (turnStatus) turnStatus.textContent = 'תורך';
            indicator.style.color = '#4caf50';
            if (turnStatus) turnStatus.style.color = '#4caf50';
        } else {
            const otherPlayerIndex = 1 - gameState.playerIndex;
            indicator.textContent = gameState.players[otherPlayerIndex].name;
            if (turnStatus) turnStatus.textContent = 'תורו';
            indicator.style.color = '#f44336';
            if (turnStatus) turnStatus.style.color = '#f44336';
        }
    } else {
        if (indicator) {
            indicator.textContent = gameState.players[gameState.currentPlayerIndex].name;
            indicator.style.color = '';
        }
        if (turnStatus) turnStatus.textContent = 'תורך';
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionIndicator');
    if (statusEl) {
        if (connected) {
            statusEl.textContent = '🟢 מחובר';
            statusEl.style.color = '#4caf50';
        } else {
            statusEl.textContent = '🔴 מנותק';
            statusEl.style.color = '#f44336';
        }
    }
}

// Copy room code to clipboard
function copyRoomCode() {
    const roomCode = document.getElementById('roomCode');
    const copyBtn = document.getElementById('copyRoomCodeBtn');
    
    if (!roomCode || !roomCode.textContent) return;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(roomCode.textContent).then(() => {
            showToast('קוד החדר הועתק!', 'reward');
            if (copyBtn) {
                copyBtn.textContent = '✓ הועתק';
                setTimeout(() => {
                    copyBtn.textContent = 'העתק';
                }, 2000);
            }
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = roomCode.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('קוד החדר הועתק!', 'reward');
        if (copyBtn) {
            copyBtn.textContent = '✓ הועתק';
            setTimeout(() => {
                copyBtn.textContent = 'העתק';
            }, 2000);
        }
    }
}

// Wire up copy button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const copyBtn = document.getElementById('copyRoomCodeBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyRoomCode);
        }
    });
} else {
    const copyBtn = document.getElementById('copyRoomCodeBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyRoomCode);
    }
}

