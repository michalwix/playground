# Online Multiplayer Troubleshooting

## Common Issues and Solutions

### 1. "לא מחובר לשרת" (Not connected to server)

**Problem**: The client cannot connect to the server.

**Solutions**:
- Make sure the server is running: `npm start` or `node server.js`
- Check that you're accessing the game through the server URL (e.g., `http://localhost:3000`)
- Don't open `index.html` directly - it needs to be served by the server
- Check browser console for connection errors

### 2. Socket.io not loading

**Problem**: Error message about Socket.io not being loaded.

**Solutions**:
- Check your internet connection (Socket.io is loaded from CDN)
- Make sure `index.html` includes: `<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>`
- Try refreshing the page

### 3. Room creation/joining fails

**Problem**: Buttons don't work or show errors.

**Solutions**:
- Wait a moment after selecting "Online" mode for the socket to initialize
- Check browser console for JavaScript errors
- Make sure both players are using the same server URL
- Try refreshing the page

### 4. Game doesn't start after both players ready

**Problem**: Both players clicked "אני מוכן" but game doesn't start.

**Solutions**:
- Check server console for errors
- Make sure both players are in the same room
- Try leaving and rejoining the room
- Check that `gameStart` event is being emitted from server

### 5. Moves not syncing between players

**Problem**: One player makes a move but the other doesn't see it.

**Solutions**:
- Check that `sendGameStateUpdate()` is called after moves
- Check browser console for socket errors
- Verify both players are still connected (check connection status indicator)
- Try refreshing both clients

## How to Test

1. **Start the server**:
   ```bash
   cd bonus-game
   npm install  # if not done already
   npm start
   ```

2. **Open two browser windows/tabs**:
   - Window 1: `http://localhost:3000`
   - Window 2: `http://localhost:3000`

3. **Test flow**:
   - Window 1: Select "Online" → "צור חדר חדש" → Copy room code
   - Window 2: Select "Online" → Enter room code → "הצטרף"
   - Both: Click "אני מוכן"
   - Game should start automatically

## Debugging Tips

1. **Open browser console** (F12) to see:
   - Connection status
   - Socket events
   - JavaScript errors

2. **Check server console** to see:
   - Client connections
   - Room creation/joining
   - Game events

3. **Common console messages**:
   - `Connected to server` - Good!
   - `User connected: [socket-id]` - Server sees client
   - `Room created: [room-id]` - Room created successfully
   - `Player [socket-id] joined room [room-id]` - Player joined

## Server Requirements

- Node.js installed
- Dependencies installed: `npm install`
- Port 3000 available (or set `PORT` environment variable)
- No firewall blocking the port

## Network Issues

If playing over network (not localhost):
- Make sure server is accessible from other devices
- Check firewall settings
- Use server's IP address instead of localhost
- Update `serverUrl` in `online.js` if needed



