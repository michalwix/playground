# תוכנית יישום תכונות נוספות למשחק בונוס

## סטטוס נוכחי

המשחק כבר כולל:
- ✅ מילון עברי עם 1500+ מילים
- ✅ משחק לוקאלי (1-2 שחקנים)
- ✅ משחק אונליין (2 שחקנים)
- ✅ מערכת אתגרים
- ✅ מערכת משימות
- ✅ מערכת dispute

## תכונות שנתבקשו ליישום

### 1. ✅ מילון גדול יותר - **הושלם**
המילון כבר מכיל 1500+ מילים עבריות נפוצות. זה מספיק לרוב משחקי Scrabble.

### 2. 🚧 גרירה ושחרור (Drag & Drop)
**קל ליישום - 30 דקות**

יש להוסיף:
```javascript
// Add to app.js
function makeTileDraggable(tileElement, tileId) {
    tileElement.draggable = true;
    tileElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('tileId', tileId);
        tileElement.classList.add('dragging');
    });
    tileElement.addEventListener('dragend', () => {
        tileElement.classList.remove('dragging');
    });
}

function makeCellDroppable(cellElement, row, col) {
    cellElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        cellElement.classList.add('drag-over');
    });
    cellElement.addEventListener('dragleave', () => {
        cellElement.classList.remove('drag-over');
    });
    cellElement.addEventListener('drop', (e) => {
        e.preventDefault();
        cellElement.classList.remove('drag-over');
        const tileId = e.dataTransfer.getData('tileId');
        if (tileId) {
            gameState.selectedTileId = tileId;
            placeTile(row, col);
        }
    });
}
```

### 3. ✅ משחק מרובה משתתפים - **כבר קיים**
המשחק כבר תומך ב:
- משחק לוקאלי: 1-2 שחקנים
- משחק אונליין: 2 שחקנים

להרחבה ל-3+ שחקנים צריך:
- שינוי ב-UI (הוספת שחקנים נוספים)
- שינוי ב-server.js (תמיכה בחדרים גדולים יותר)

### 4. 💡 מערכת רמזים AI
**בינוני - 1-2 שעות**

רעיונות ליישום:
```javascript
// Simple AI hints - find possible words from rack
function getAIHints() {
    const rack = getCurrentRack();
    const letters = rack.map(t => t.letter);
    const hints = [];
    
    // Check all combinations of letters
    for (let len = 2; len <= letters.length; len++) {
        const combinations = getCombinations(letters, len);
        for (const combo of combinations) {
            const word = combo.join('');
            if (isWordValid(word)) {
                // Check if can be placed on board
                const placements = findValidPlacements(word);
                if (placements.length > 0) {
                    hints.push({
                        word,
                        placements,
                        score: estimateScore(word, placements[0])
                    });
                }
            }
        }
    }
    
    // Sort by score
    return hints.sort((a, b) => b.score - a.score).slice(0, 3);
}
```

### 5. 💾 שמירת שיאים
**קל - 20 דקות**

```javascript
// High scores system using localStorage
const HIGH_SCORES_KEY = 'bonusGameHighScores';

function saveHighScore(playerName, score, date) {
    const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
    highScores.push({
        name: playerName,
        score: score,
        date: date || new Date().toISOString()
    });
    
    // Keep top 10
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(10);
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
}

function getHighScores() {
    return JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
}

function displayHighScores() {
    const scores = getHighScores();
    const modal = document.getElementById('highScoresModal');
    const list = document.getElementById('highScoresList');
    
    list.innerHTML = scores.map((s, i) => `
        <div class="high-score-item">
            <span class="rank">${i + 1}</span>
            <span class="name">${s.name}</span>
            <span class="score">${s.score}</span>
            <span class="date">${new Date(s.date).toLocaleDateString('he')}</span>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}
```

### 6. 🎯 מצבי קושי שונים
**בינוני - 1 שעה**

```javascript
const DIFFICULTY_MODES = {
    easy: {
        name: 'קל',
        turnTime: null, // No time limit
        aiHints: true,
        boardSize: 15,
        rackSize: 7
    },
    normal: {
        name: 'רגיל',
        turnTime: null,
        aiHints: false,
        boardSize: 15,
        rackSize: 7
    },
    hard: {
        name: 'קשה',
        turnTime: 120, // 2 minutes per turn
        aiHints: false,
        boardSize: 15,
        rackSize: 6 // One less tile
    },
    expert: {
        name: 'מומחה',
        turnTime: 60, // 1 minute per turn
        aiHints: false,
        boardSize: 15,
        rackSize: 5 // Even fewer tiles
    }
};

function setDifficulty(level) {
    gameState.difficulty = DIFFICULTY_MODES[level];
    // Apply difficulty settings...
}
```

### 7. ⏱️ טיימר תור
**קל - 30 דקות**

```javascript
let turnTimer = null;
let timeRemaining = 0;

function startTurnTimer(seconds) {
    stopTurnTimer();
    timeRemaining = seconds;
    updateTimerDisplay();
    
    turnTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 10) {
            // Warning - time running out
            document.getElementById('timerDisplay').classList.add('warning');
        }
        
        if (timeRemaining <= 0) {
            stopTurnTimer();
            handleTimeExpired();
        }
    }, 1000);
}

function stopTurnTimer() {
    if (turnTimer) {
        clearInterval(turnTimer);
        turnTimer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timerDisplay').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function handleTimeExpired() {
    showToast('הזמן נגמר!', 'error');
    // Auto-skip turn or apply penalty
    resetTurn();
    nextPlayer();
}
```

## סדר יישום מומלץ

1. **טיימר תור** (30 דקות) - התוספת הקלה ביותר
2. **שמירת שיאים** (20 דקות) - פשוט וחשוב למשחקיות
3. **גרירה ושחרור** (30 דקות) - שיפור UX משמעותי
4. **מצבי קושי** (1 שעה) - מוסיף עומק למשחק
5. **מערכת רמזים AI** (2 שעות) - המורכבת ביותר

**סה"כ זמן יישום משוער: 4-5 שעות**

## קבצים שצריך לערוך

1. `index.html` - הוספת UI למצבי קושי, שיאים, טיימר
2. `app.js` - הוספת כל הלוגיקה
3. `styles.css` - עיצוב לתכונות החדשות
4. `online.js` - סנכרון טיימר במשחק אונליין

## האם להתחיל ביישום?



