# Online Multiplayer Setup

## Quick Start

### 1. Install Dependencies
```bash
cd bonus-game
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Open the Game
Open your browser and go to: `http://localhost:3000`

## How to Play Online

### Player 1 (Host):
1. Select **"אונליין (2 שחקנים)"** mode
2. Enter your name
3. Click **"צור חדר חדש"**
4. Share the **Room Code** with Player 2
5. Wait for Player 2 to join
6. Click **"אני מוכן"** when ready
7. Game starts when both players are ready!

### Player 2 (Join):
1. Select **"אונליין (2 שחקנים)"** mode
2. Enter your name
3. Enter the **Room Code** from Player 1
4. Click **"הצטרף"**
5. Click **"אני מוכן"** when ready
6. Game starts when both players are ready!

## Deploy Online

### Option 1: Heroku (Free)
1. Create account at https://heroku.com
2. Install Heroku CLI
3. Run:
```bash
heroku create bonus-game
git push heroku main
```

### Option 2: Railway (Free)
1. Go to https://railway.app
2. Connect GitHub repo
3. Deploy automatically

### Option 3: Render (Free)
1. Go to https://render.com
2. Create new Web Service
3. Connect repo and deploy

## Environment Variables
- `PORT` - Server port (default: 3000)

## Features
- ✅ Real-time multiplayer
- ✅ Room-based matchmaking
- ✅ Turn-based gameplay
- ✅ Game state synchronization
- ✅ Disconnect handling

