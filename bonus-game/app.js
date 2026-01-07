// Game State
let gameState = {
    board: [],
    racks: [], // Array of racks, one per player
    bag: [],
    placedThisTurn: [],
    selectedTileId: null,
    exchangeMode: false,
    exchangeSelected: [],
    players: [],
    currentPlayerIndex: 0,
    missions: {
        LONG_WORD: false,
        USE_DW_TW: false,
        COMBO_2PLUS: false
    },
    isFirstMove: true,
    timerEnabled: false,
    turnTimeLimit: 0, // seconds per turn (0 = no limit)
    turnTimerInterval: null,
    timeRemaining: 0,
    pendingDispute: null, // { word, words, placedThisTurn }
    pendingChallenge: null, // { type, question, answer, points }
    // Online multiplayer
    isOnline: false,
    socket: null,
    roomId: null,
    playerIndex: null,
    isMyTurn: false
};

// Learned words (from disputes) - load from localStorage
let learnedWords = JSON.parse(localStorage.getItem('bonusLearnedWords') || '[]');

// High Scores System
const HIGH_SCORES_KEY = 'bonusGameHighScores';

function saveHighScore(playerName, score, date) {
    const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
    highScores.push({
        name: playerName,
        score: score,
        date: date || new Date().toISOString(),
        timestamp: Date.now()
    });
    
    // Keep top 10
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(10);
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    console.log('✅ High score saved:', playerName, score);
}

function getHighScores() {
    return JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
}

function displayHighScores() {
    const scores = getHighScores();
    const modal = document.getElementById('highScoresModal');
    const list = document.getElementById('highScoresList');
    
    if (!modal || !list) return;
    
    if (scores.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">אין שיאים עדיין. שחקו והיו הראשונים!</p>';
    } else {
        list.innerHTML = scores.map((s, i) => `
            <div class="high-score-item">
                <span class="rank">${i + 1}</span>
                <span class="name">${s.name}</span>
                <span class="score">${s.score} נק'</span>
                <span class="date">${new Date(s.date).toLocaleDateString('he-IL')}</span>
            </div>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

// Turn Timer Functions
function startTurnTimer() {
    if (!gameState.timerEnabled || gameState.turnTimeLimit <= 0) return;
    
    stopTurnTimer();
    gameState.timeRemaining = gameState.turnTimeLimit;
    updateTimerDisplay();
    
    gameState.turnTimerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (gameState.timeRemaining <= 10 && timerDisplay) {
            timerDisplay.classList.add('warning');
        }
        
        if (gameState.timeRemaining <= 0) {
            stopTurnTimer();
            handleTimeExpired();
        }
    }, 1000);
}

function stopTurnTimer() {
    if (gameState.turnTimerInterval) {
        clearInterval(gameState.turnTimerInterval);
        gameState.turnTimerInterval = null;
    }
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.classList.remove('warning');
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay || !gameState.timerEnabled) return;
    
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerDisplay.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.style.display = 'inline-block';
}

function handleTimeExpired() {
    showToast('הזמן נגמר! התור מדולג', 'error');
    resetTurn();
    nextPlayer();
}

// Word Challenges - expanded list
const WORD_CHALLENGES = [
    // Fill in the blank
    { type: 'fill', question: 'מה המילה: ב_ית?', answer: 'בית', hint: 'מקום מגורים' },
    { type: 'fill', question: 'מה המילה: ש_ח?', answer: 'שח', hint: 'צבע כהה' },
    { type: 'fill', question: 'מה המילה: כ_ב?', answer: 'כלב', hint: 'חיה נאמנה' },
    { type: 'fill', question: 'מה המילה: י_ד?', answer: 'ילד', hint: 'בן קטן' },
    { type: 'fill', question: 'מה המילה: א_ב?', answer: 'אהבה', hint: 'רגש חזק' },
    { type: 'fill', question: 'מה המילה: ש_מ_ש?', answer: 'שמש', hint: 'כוכב' },
    { type: 'fill', question: 'מה המילה: י_ר_ק?', answer: 'ירק', hint: 'מזון בריא' },
    { type: 'fill', question: 'מה המילה: פ_ר_ח?', answer: 'פרח', hint: 'צומח יפה' },
    
    // Anagram - unscramble letters
    { type: 'anagram', question: 'ארגן מחדש: ביתא', answer: 'אביב', hint: 'עונה בשנה' },
    { type: 'anagram', question: 'ארגן מחדש: דמאא', answer: 'אדמה', hint: 'מה שצומח עליו' },
    { type: 'anagram', question: 'ארגן מחדש: חבל', answer: 'חלב', hint: 'משקה לבן' },
    { type: 'anagram', question: 'ארגן מחדש: רחב', answer: 'ברח', hint: 'או... רחב' },
    { type: 'anagram', question: 'ארגן מחדש: שמיש', answer: 'שמש', hint: 'כוכב' },
    { type: 'anagram', question: 'ארגן מחדש: דבל', answer: 'בלד', hint: 'או... דבל' },
    
    // Definition
    { type: 'definition', question: 'מה המילה בעברית: מקום מגורים?', answer: 'בית', hint: 'ב' },
    { type: 'definition', question: 'מה המילה בעברית: בעל חיים נאמן?', answer: 'כלב', hint: 'כ' },
    { type: 'definition', question: 'מה המילה בעברית: כוכב השמיים?', answer: 'שמש', hint: 'ש' },
    { type: 'definition', question: 'מה המילה בעברית: פרי אדום מתוק?', answer: 'תפוח', hint: 'ת' },
    { type: 'definition', question: 'מה המילה בעברית: כלי תחבורה?', answer: 'מכונית', hint: 'מ' },
    { type: 'definition', question: 'מה המילה בעברית: בעל חיים קטן?', answer: 'חתול', hint: 'ח' },
    { type: 'definition', question: 'מה המילה בעברית: פרי צהוב?', answer: 'בננה', hint: 'ב' },
    { type: 'definition', question: 'מה המילה בעברית: משקה מתוק?', answer: 'מיץ', hint: 'מ' },
    
    // Complete the word
    { type: 'complete', question: 'השלם: א_ב_', answer: 'אהבה', hint: 'רגש' },
    { type: 'complete', question: 'השלם: ב_י_', answer: 'בית', hint: 'מקום' },
    { type: 'complete', question: 'השלם: כ_ב_', answer: 'כלב', hint: 'חיה' },
    { type: 'complete', question: 'השלם: ש_ח_', answer: 'שחור', hint: 'צבע' },
    { type: 'complete', question: 'השלם: י_ד_', answer: 'ילד', hint: 'בן' },
    { type: 'complete', question: 'השלם: ש_מ_', answer: 'שמש', hint: 'כוכב' },
    { type: 'complete', question: 'השלם: פ_ר_', answer: 'פרח', hint: 'צומח' },
    
    // Find the word from letters
    { type: 'letters', question: 'צור מילה מהאותיות: ב, י, ת', answer: 'בית', hint: 'מקום מגורים' },
    { type: 'letters', question: 'צור מילה מהאותיות: כ, ל, ב', answer: 'כלב', hint: 'חיה' },
    { type: 'letters', question: 'צור מילה מהאותיות: ש, מ, ש', answer: 'שמש', hint: 'כוכב' },
    { type: 'letters', question: 'צור מילה מהאותיות: א, ה, ב, ה', answer: 'אהבה', hint: 'רגש' },
    { type: 'letters', question: 'צור מילה מהאותיות: י, ל, ד', answer: 'ילד', hint: 'בן' },
    { type: 'letters', question: 'צור מילה מהאותיות: פ, ר, ח', answer: 'פרח', hint: 'צומח' },
    { type: 'letters', question: 'צור מילה מהאותיות: י, ר, ק', answer: 'ירק', hint: 'מזון' },
    
    // Reverse/opposite
    { type: 'reverse', question: 'מה ההיפך מ: גדול?', answer: 'קטן', hint: 'ק' },
    { type: 'reverse', question: 'מה ההיפך מ: גבוה?', answer: 'נמוך', hint: 'נ' },
    { type: 'reverse', question: 'מה ההיפך מ: טוב?', answer: 'רע', hint: 'ר' },
    { type: 'reverse', question: 'מה ההיפך מ: חם?', answer: 'קר', hint: 'ק' },
    { type: 'reverse', question: 'מה ההיפך מ: יום?', answer: 'לילה', hint: 'ל' }
];

// Advanced Challenges - Harder difficulty
const ADVANCED_CHALLENGES = {
    // Form words from letters (multiple words challenge)
    'wordFormation': [
        { letters: ['ב', 'י', 'ת', 'ל'], minWords: 2, possibleWords: ['בית', 'ביל', 'תיל', 'לבי', 'תיב'] },
        { letters: ['כ', 'ל', 'ב', 'ח'], minWords: 2, possibleWords: ['כלב', 'חלב', 'בלח', 'לחב'] },
        { letters: ['ש', 'מ', 'ש', 'ח'], minWords: 2, possibleWords: ['שמש', 'שח', 'מש', 'חש'] },
        { letters: ['א', 'ה', 'ב', 'ה'], minWords: 1, possibleWords: ['אהבה', 'הבה', 'אבה'] },
        { letters: ['י', 'ל', 'ד', 'ב'], minWords: 2, possibleWords: ['ילד', 'ביל', 'דיל', 'לבי'] },
        { letters: ['פ', 'ר', 'ח', 'כ'], minWords: 2, possibleWords: ['פרח', 'פר', 'רח', 'כר'] },
        { letters: ['מ', 'י', 'ם', 'ב'], minWords: 2, possibleWords: ['מים', 'בימ', 'מיב'] },
        { letters: ['ש', 'ל', 'ו', 'ם'], minWords: 2, possibleWords: ['שלום', 'של', 'לום', 'מוש'] },
        { letters: ['א', 'ר', 'ב', 'ע'], minWords: 2, possibleWords: ['ארבע', 'ארב', 'רבע', 'ברא'] },
        { letters: ['ח', 'מ', 'ש', 'ה'], minWords: 2, possibleWords: ['חמישה', 'חמש', 'משה', 'שמה'] }
    ],
    
    // Hard definitions
    'hardDefinition': [
        { question: 'מה המילה בעברית: כלי רכב בעל ארבעה גלגלים?', answer: 'מכונית', hint: 'מ' },
        { question: 'מה המילה בעברית: מקום לימודים?', answer: 'בית ספר', hint: 'ב' },
        { question: 'מה המילה בעברית: בעל חיים עם קרניים?', answer: 'פרה', hint: 'פ' },
        { question: 'מה המילה בעברית: פרי כתום מתוק?', answer: 'תפוז', hint: 'ת' },
        { question: 'מה המילה בעברית: כלי תחבורה ציבורי?', answer: 'אוטובוס', hint: 'א' },
        { question: 'מה המילה בעברית: מקום מגורים גדול?', answer: 'בית', hint: 'ב' },
        { question: 'מה המילה בעברית: בעל חיים עם כנפיים?', answer: 'ציפור', hint: 'צ' },
        { question: 'מה המילה בעברית: פרי אדום מתוק?', answer: 'תפוח', hint: 'ת' }
    ],
    
    // Complex anagrams
    'complexAnagram': [
        { question: 'ארגן מחדש: תבוחפ', answer: 'תפוח', hint: 'פרי' },
        { question: 'ארגן מחדש: תינוכב', answer: 'בננה', hint: 'פרי צהוב' },
        { question: 'ארגן מחדש: חתוכל', answer: 'חתול', hint: 'חיה' },
        { question: 'ארגן מחדש: ציפור', answer: 'ציפור', hint: 'עוף' },
        { question: 'ארגן מחדש: מכונית', answer: 'מכונית', hint: 'רכב' },
        { question: 'ארגן מחדש: בית ספר', answer: 'בית ספר', hint: 'מקום לימוד' }
    ],
    
    // Word chain - find connecting words
    'wordChain': [
        { start: 'בית', end: 'חתול', minSteps: 3, hint: 'חבר → חתול' },
        { start: 'ילד', end: 'מורה', minSteps: 2, hint: 'תלמיד → מורה' },
        { start: 'שמש', end: 'ירח', minSteps: 2, hint: 'כוכב → ירח' }
    ],
    
    // Synonyms
    'synonym': [
        { question: 'מה המילה הנרדפת ל: גדול?', answer: 'ענק', hint: 'ע' },
        { question: 'מה המילה הנרדפת ל: יפה?', answer: 'נאה', hint: 'נ' },
        { question: 'מה המילה הנרדפת ל: מהיר?', answer: 'זריז', hint: 'ז' },
        { question: 'מה המילה הנרדפת ל: חכם?', answer: 'נבון', hint: 'נ' }
    ]
};

// Hebrew Letter Values (approximate)
const LETTER_VALUES = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 1, 'ו': 1, 'ז': 2, 'ח': 3, 'ט': 2,
    'י': 1, 'כ': 3, 'ל': 2, 'מ': 2, 'נ': 2, 'ס': 2, 'ע': 1, 'פ': 3, 'צ': 4,
    'ק': 4, 'ר': 2, 'ש': 3, 'ת': 2
};

// Hebrew Letter Frequencies (approximate)
const LETTER_FREQUENCIES = {
    'א': 12, 'ב': 8, 'ג': 4, 'ד': 6, 'ה': 12, 'ו': 10, 'ז': 2, 'ח': 4, 'ט': 3,
    'י': 10, 'כ': 6, 'ל': 10, 'מ': 8, 'נ': 8, 'ס': 4, 'ע': 4, 'פ': 4, 'צ': 3,
    'ק': 4, 'ר': 8, 'ש': 8, 'ת': 9
};

// Initialize game
function initGame(mode, names) {
    gameState.players = [
        { name: names[0], score: 0 },
        ...(mode === '2' ? [{ name: names[1], score: 0 }] : [])
    ];
    gameState.currentPlayerIndex = 0;
    gameState.isFirstMove = true;
    gameState.missions = {
        LONG_WORD: false,
        USE_DW_TW: false,
        COMBO_2PLUS: false
    };
    
    createBoard();
    createBag();
    
    // Initialize racks for all players
    gameState.racks = [];
    for (let i = 0; i < gameState.players.length; i++) {
        gameState.racks[i] = [];
        refillRack(i);
    }
    
    renderAll();
}

// Create 15x15 board with bonus cells (standard Scrabble size)
function createBoard() {
    gameState.board = [];
    const size = 15;
    
    // Bonus cell positions (standard Scrabble layout)
    const bonusCells = {
        // Double Letter (DL) - pink
        'dl': [
            [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
            [6, 2], [6, 6], [6, 8], [6, 12],
            [7, 3], [7, 11],
            [8, 2], [8, 6], [8, 8], [8, 12],
            [11, 0], [11, 7], [11, 14],
            [12, 6], [12, 8],
            [14, 3], [14, 11]
        ],
        // Triple Letter (TL) - dark blue
        'tl': [
            [1, 5], [1, 9],
            [5, 1], [5, 5], [5, 9], [5, 13],
            [9, 1], [9, 5], [9, 9], [9, 13],
            [13, 5], [13, 9]
        ],
        // Double Word (DW) - light red
        'dw': [
            [1, 1], [1, 13],
            [2, 2], [2, 12],
            [3, 3], [3, 11],
            [4, 4], [4, 10],
            [7, 7],
            [10, 4], [10, 10],
            [11, 3], [11, 11],
            [12, 2], [12, 12],
            [13, 1], [13, 13]
        ],
        // Triple Word (TW) - dark red
        'tw': [
            [0, 0], [0, 7], [0, 14],
            [7, 0], [7, 14],
            [14, 0], [14, 7], [14, 14]
        ],
        // Different challenge types - special bonus cells
        'star': [
            [3, 7], [7, 3], [7, 11], [11, 7]
        ],
        'fire': [
            [1, 7], [7, 1], [7, 13], [13, 7]
        ],
        'diamond': [
            [2, 7], [7, 2], [7, 12], [12, 7]
        ],
        'lightning': [
            [4, 7], [7, 4], [7, 10], [10, 7]
        ],
        'target': [
            [5, 7], [7, 5], [7, 9], [9, 7]
        ]
    };
    
    for (let row = 0; row < size; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < size; col++) {
            let bonus = null;
            let reward = null;
            
            if (bonusCells.dl.some(([r, c]) => r === row && c === col)) {
                bonus = 'DL';
            } else if (bonusCells.tl.some(([r, c]) => r === row && c === col)) {
                bonus = 'TL';
            } else if (bonusCells.dw.some(([r, c]) => r === row && c === col)) {
                bonus = 'DW';
            } else if (bonusCells.tw.some(([r, c]) => r === row && c === col)) {
                bonus = 'TW';
            }
            
            if (bonusCells.star.some(([r, c]) => r === row && c === col)) {
                reward = 'STAR';
            } else if (bonusCells.fire.some(([r, c]) => r === row && c === col)) {
                reward = 'FIRE';
            } else if (bonusCells.diamond.some(([r, c]) => r === row && c === col)) {
                reward = 'DIAMOND';
            } else if (bonusCells.lightning.some(([r, c]) => r === row && c === col)) {
                reward = 'LIGHTNING';
            } else if (bonusCells.target.some(([r, c]) => r === row && c === col)) {
                reward = 'TARGET';
            }
            
            gameState.board[row][col] = {
                letter: null,
                bonus: bonus,
                reward: reward,
                blocked: false
            };
        }
    }
}

// Create bag of tiles
function createBag() {
    gameState.bag = [];
    for (const [letter, count] of Object.entries(LETTER_FREQUENCIES)) {
        for (let i = 0; i < count; i++) {
            gameState.bag.push({
                id: Math.random().toString(36).substr(2, 9),
                letter: letter,
                value: LETTER_VALUES[letter] || 1
            });
        }
    }
    shuffleArray(gameState.bag);
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Refill rack to 7 tiles
function refillRack(playerIndex = null) {
    const idx = playerIndex !== null ? playerIndex : gameState.currentPlayerIndex;
    if (!gameState.racks[idx]) {
        gameState.racks[idx] = [];
    }
    while (gameState.racks[idx].length < 7 && gameState.bag.length > 0) {
        gameState.racks[idx].push(gameState.bag.pop());
    }
}

// Get current player's rack
function getCurrentRack() {
    return gameState.racks[gameState.currentPlayerIndex] || [];
}

// Render everything
function renderAll() {
    renderHeader();
    renderBoard();
    renderRack();
    renderSidebar();
}

// Render header
function renderHeader() {
    const player1Score = document.getElementById('player1Score');
    const player2Score = document.getElementById('player2Score');
    const currentPlayerName = document.getElementById('currentPlayerName');
    
    if (gameState.players.length > 0) {
        player1Score.querySelector('.player-name').textContent = gameState.players[0].name;
        player1Score.querySelector('.score-value').textContent = gameState.players[0].score;
        
        if (gameState.currentPlayerIndex === 0) {
            player1Score.classList.add('active');
            player2Score.classList.remove('active');
        } else {
            player1Score.classList.remove('active');
            player2Score.classList.add('active');
        }
    }
    
    if (gameState.players.length > 1) {
        player2Score.querySelector('.player-name').textContent = gameState.players[1].name;
        player2Score.querySelector('.score-value').textContent = gameState.players[1].score;
        
        if (gameState.currentPlayerIndex === 1) {
            player2Score.classList.add('active');
            player1Score.classList.remove('active');
        }
    } else {
        player2Score.style.display = 'none';
    }
    
    // Update current player indicator
    if (gameState.isOnline) {
        // Use online turn indicator
        if (typeof updateTurnIndicator === 'function') {
            updateTurnIndicator();
        } else {
            // Fallback
            if (gameState.isMyTurn) {
                currentPlayerName.textContent = `${gameState.players[gameState.playerIndex].name} - תורך`;
                currentPlayerName.style.color = '#4caf50';
            } else {
                const otherPlayerIndex = 1 - gameState.playerIndex;
                currentPlayerName.textContent = `${gameState.players[otherPlayerIndex].name} - תורו`;
                currentPlayerName.style.color = '#f44336';
            }
        }
    } else {
        // Local game
        currentPlayerName.textContent = `${gameState.players[gameState.currentPlayerIndex].name} - תורך`;
        currentPlayerName.style.color = '';
    }
}

// Render board
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    const size = gameState.board.length;
    const selectedTileId = gameState.selectedTileId;
    
    // Calculate valid placement cells if tile is selected
    let validCells = [];
    if (selectedTileId && gameState.placedThisTurn.length === 0) {
        // First tile - can go anywhere if first move, or next to existing letters
        if (gameState.isFirstMove) {
            // All cells are valid
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (!gameState.board[r][c].letter) {
                        validCells.push(`${r}-${c}`);
                    }
                }
            }
        } else {
            // Find cells adjacent to existing letters
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (!gameState.board[r][c].letter) {
                        const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
                        if (neighbors.some(([nr, nc]) => 
                            nr >= 0 && nr < size && nc >= 0 && nc < size && 
                            gameState.board[nr][nc].letter)) {
                            validCells.push(`${r}-${c}`);
                        }
                    }
                }
            }
        }
    } else if (selectedTileId && gameState.placedThisTurn.length > 0) {
        // Subsequent tiles - must be in same row/column
        const direction = determineDirection();
        if (direction === 'H') {
            const row = gameState.placedThisTurn[0].row;
            const cols = gameState.placedThisTurn.map(p => p.col);
            const minCol = Math.min(...cols);
            const maxCol = Math.max(...cols);
            for (let c = Math.max(0, minCol - 1); c <= Math.min(size - 1, maxCol + 1); c++) {
                if (!gameState.board[row][c].letter) {
                    validCells.push(`${row}-${c}`);
                }
            }
        } else if (direction === 'V') {
            const col = gameState.placedThisTurn[0].col;
            const rows = gameState.placedThisTurn.map(p => p.row);
            const minRow = Math.min(...rows);
            const maxRow = Math.max(...rows);
            for (let r = Math.max(0, minRow - 1); r <= Math.min(size - 1, maxRow + 1); r++) {
                if (!gameState.board[r][col].letter) {
                    validCells.push(`${r}-${col}`);
                }
            }
        }
    }
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = gameState.board[row][col];
            const cellEl = document.createElement('div');
            cellEl.className = 'cell';
            cellEl.dataset.row = row;
            cellEl.dataset.col = col;
            
            // Highlight valid placement cells
            if (validCells.includes(`${row}-${col}`)) {
                cellEl.classList.add('valid-placement');
            }
            
            // Add bonus classes
            if (cell.bonus === 'DL') cellEl.classList.add('bonus-dl');
            if (cell.bonus === 'TL') cellEl.classList.add('bonus-tl');
            if (cell.bonus === 'DW') cellEl.classList.add('bonus-dw');
            if (cell.bonus === 'TW') cellEl.classList.add('bonus-tw');
            if (cell.reward === 'STAR') cellEl.classList.add('star');
            if (cell.reward === 'FIRE') cellEl.classList.add('fire');
            if (cell.reward === 'DIAMOND') cellEl.classList.add('diamond');
            if (cell.reward === 'LIGHTNING') cellEl.classList.add('lightning');
            if (cell.reward === 'TARGET') cellEl.classList.add('target');
            
            // Check if placed this turn
            const placedThisTurn = gameState.placedThisTurn.find(p => p.row === row && p.col === col);
            if (placedThisTurn) {
                cellEl.classList.add('placed-this-turn');
            }
            
            // Add bonus label
            if (cell.bonus) {
                const label = document.createElement('span');
                label.className = 'bonus-label';
                label.textContent = cell.bonus;
                cellEl.appendChild(label);
            }
            
            // Add reward icons
            if (cell.reward === 'STAR') {
                const icon = document.createElement('span');
                icon.className = 'reward-icon';
                icon.textContent = '⭐';
                cellEl.appendChild(icon);
            } else if (cell.reward === 'FIRE') {
                const icon = document.createElement('span');
                icon.className = 'reward-icon';
                icon.textContent = '🔥';
                cellEl.appendChild(icon);
            } else if (cell.reward === 'DIAMOND') {
                const icon = document.createElement('span');
                icon.className = 'reward-icon';
                icon.textContent = '💎';
                cellEl.appendChild(icon);
            } else if (cell.reward === 'LIGHTNING') {
                const icon = document.createElement('span');
                icon.className = 'reward-icon';
                icon.textContent = '⚡';
                cellEl.appendChild(icon);
            } else if (cell.reward === 'TARGET') {
                const icon = document.createElement('span');
                icon.className = 'reward-icon';
                icon.textContent = '🎯';
                cellEl.appendChild(icon);
            }
            
            // Add letter if occupied
            if (cell.letter) {
                cellEl.classList.add('occupied');
                const letter = document.createElement('div');
                letter.className = 'tile-letter';
                letter.textContent = cell.letter.letter;
                cellEl.appendChild(letter);
                
                const value = document.createElement('span');
                value.className = 'tile-value';
                value.textContent = cell.letter.value;
                cellEl.appendChild(value);
            }
            
            cellEl.addEventListener('click', () => handleCellClick(row, col));
            boardEl.appendChild(cellEl);
        }
    }
    
    // Update move preview after rendering
    updateMovePreview();
}

// Render rack
function renderRack() {
    const rackEl = document.getElementById('rack');
    rackEl.innerHTML = '';
    
    const rack = getCurrentRack();
    
    for (let i = 0; i < 7; i++) {
        const tile = rack[i];
        const tileEl = document.createElement('div');
        tileEl.className = 'rack-tile';
        
        if (tile) {
            tileEl.dataset.tileId = tile.id;
            const letter = document.createElement('div');
            letter.className = 'tile-letter';
            letter.textContent = tile.letter;
            tileEl.appendChild(letter);
            
            const value = document.createElement('span');
            value.className = 'tile-value';
            value.textContent = tile.value;
            tileEl.appendChild(value);
            
            if (gameState.selectedTileId === tile.id) {
                tileEl.classList.add('selected');
            }
            
            if (gameState.exchangeMode && gameState.exchangeSelected.includes(tile.id)) {
                tileEl.classList.add('exchange-selected');
            }
            
            tileEl.addEventListener('click', () => handleRackTileClick(tile.id));
        } else {
            tileEl.classList.add('empty');
        }
        
        rackEl.appendChild(tileEl);
    }
    
    // Update move preview after rendering
    updateMovePreview();
}

// Render sidebar
function renderSidebar() {
    const missionsEl = document.getElementById('missions');
    const missionItems = missionsEl.querySelectorAll('.mission-item');
    
    missionItems.forEach(item => {
        const mission = item.dataset.mission;
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.checked = gameState.missions[mission];
        
        if (gameState.missions[mission]) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }
    });
    
    // Update rewards display
    const rewardsEl = document.getElementById('rewards');
    rewardsEl.innerHTML = '<div class="reward-item">אין צ\'ופרים פעילים</div>';
}

// Handle rack tile click
function handleRackTileClick(tileId) {
    if (gameState.exchangeMode) {
        const index = gameState.exchangeSelected.indexOf(tileId);
        if (index > -1) {
            gameState.exchangeSelected.splice(index, 1);
        } else if (gameState.exchangeSelected.length < 3) {
            gameState.exchangeSelected.push(tileId);
        }
        renderRack();
        return;
    }
    
    if (gameState.selectedTileId === tileId) {
        gameState.selectedTileId = null;
    } else {
        gameState.selectedTileId = tileId;
    }
    renderRack();
}

// Handle cell click
function handleCellClick(row, col) {
    if (gameState.exchangeMode) return;
    
    const cell = gameState.board[row][col];
    const placedThisTurn = gameState.placedThisTurn.find(p => p.row === row && p.col === col);
    
    // Remove tile if clicking placed-this-turn tile
    if (placedThisTurn) {
        removePlacedTile(row, col);
        return;
    }
    
    // Place tile if cell is empty and tile is selected
    if (!cell.letter && gameState.selectedTileId) {
        placeTile(row, col);
    }
}

// Place tile on board
function placeTile(row, col) {
    // Check if online and not your turn
    if (gameState.isOnline && !gameState.isMyTurn) {
        showToast('זה לא התור שלך', 'error');
        return;
    }
    
    if (!gameState.selectedTileId) return;
    
    const rack = getCurrentRack();
    const tileIndex = rack.findIndex(t => t.id === gameState.selectedTileId);
    if (tileIndex === -1) return;
    
    // Validate placement (basic check)
    if (gameState.placedThisTurn.length > 0) {
        const direction = determineDirection();
        if (direction === 'H') {
            const firstRow = gameState.placedThisTurn[0].row;
            if (row !== firstRow) {
                showToast('כל האותיות חייבות להיות באותה שורה', 'error');
                return;
            }
        } else if (direction === 'V') {
            const firstCol = gameState.placedThisTurn[0].col;
            if (col !== firstCol) {
                showToast('כל האותיות חייבות להיות באותה עמודה', 'error');
                return;
            }
        }
    }
    
    const tile = rack[tileIndex];
    gameState.board[row][col].letter = tile;
    gameState.placedThisTurn.push({ row, col, tile });
    rack.splice(tileIndex, 1);
    gameState.selectedTileId = null;
    
    renderBoard();
    renderRack();
}

// Remove placed tile
function removePlacedTile(row, col) {
    const index = gameState.placedThisTurn.findIndex(p => p.row === row && p.col === col);
    if (index === -1) return;
    
    const placement = gameState.placedThisTurn[index];
    const rack = getCurrentRack();
    rack.push(placement.tile);
    gameState.board[row][col].letter = null;
    gameState.placedThisTurn.splice(index, 1);
    
    renderBoard();
    renderRack();
}

// Reset turn
function resetTurn() {
    // Return all placed tiles to rack
    const rack = getCurrentRack();
    gameState.placedThisTurn.forEach(placement => {
        rack.push(placement.tile);
        gameState.board[placement.row][placement.col].letter = null;
    });
    gameState.placedThisTurn = [];
    gameState.selectedTileId = null;
    
    renderBoard();
    renderRack();
}

// Determine direction of move
function determineDirection() {
    if (gameState.placedThisTurn.length === 0) return null;
    if (gameState.placedThisTurn.length === 1) return 'H'; // Default horizontal for single tile
    
    const rows = gameState.placedThisTurn.map(p => p.row);
    const cols = gameState.placedThisTurn.map(p => p.col);
    
    const sameRow = rows.every(r => r === rows[0]);
    const sameCol = cols.every(c => c === cols[0]);
    
    if (sameRow) return 'H';
    if (sameCol) return 'V';
    return null; // Invalid
}

// Validate move
function validateMove() {
    if (gameState.placedThisTurn.length === 0) {
        return { valid: false, error: 'לא הוצבו אותיות' };
    }
    
    // Check all on same line
    const direction = determineDirection();
    if (!direction) {
        return { valid: false, error: 'כל האותיות חייבות להיות בשורה או עמודה אחת' };
    }
    
    // Check no gaps
    if (!validateLineAndNoGaps(direction)) {
        return { valid: false, error: 'אין רווחים מותרים בין האותיות' };
    }
    
    // Check first move or touching
    if (!validateFirstOrTouching()) {
        return { valid: false, error: 'המהלך חייב לגעת באותיות קיימות' };
    }
    
    // Get words created
    const words = getWordsCreated(direction);
    if (words.length === 0) {
        return { valid: false, error: 'לא נוצרו מילים' };
    }
    
    // Validate words in dictionary
    const invalidWord = words.find(w => !isWordValid(w.word));
    if (invalidWord) {
        return { 
            valid: false, 
            error: `המילה "${invalidWord.word}" לא קיימת במילון`,
            invalidWord: invalidWord.word,
            words: words
        };
    }
    
    return { valid: true, words: words };
}

// Validate line and no gaps
function validateLineAndNoGaps(direction) {
    const placed = [...gameState.placedThisTurn];
    const existing = [];
    
    if (direction === 'H') {
        const row = placed[0].row;
        // Get all letters in this row (placed + existing)
        const size = gameState.board.length;
        for (let col = 0; col < size; col++) {
            if (gameState.board[row][col].letter) {
                existing.push({ row, col });
            }
        }
        
        // Check for gaps
        const allPositions = [...placed.map(p => p.col), ...existing.map(e => e.col)];
        const minCol = Math.min(...allPositions);
        const maxCol = Math.max(...allPositions);
        
        for (let col = minCol; col <= maxCol; col++) {
            if (!gameState.board[row][col].letter) {
                return false; // Gap found
            }
        }
    } else {
        const col = placed[0].col;
        const size = gameState.board.length;
        for (let row = 0; row < size; row++) {
            if (gameState.board[row][col].letter) {
                existing.push({ row, col });
            }
        }
        
        const allPositions = [...placed.map(p => p.row), ...existing.map(e => e.row)];
        const minRow = Math.min(...allPositions);
        const maxRow = Math.max(...allPositions);
        
        for (let row = minRow; row <= maxRow; row++) {
            if (!gameState.board[row][col].letter) {
                return false;
            }
        }
    }
    
    return true;
}

// Validate first move or touching
function validateFirstOrTouching() {
    if (gameState.isFirstMove) return true;
    
    // Check if any placed tile touches existing letter
    for (const placement of gameState.placedThisTurn) {
        const { row, col } = placement;
        const neighbors = [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1]
        ];
        
        const size = gameState.board.length;
        for (const [r, c] of neighbors) {
            if (r >= 0 && r < size && c >= 0 && c < size) {
                const cell = gameState.board[r][c];
                if (cell.letter && !gameState.placedThisTurn.find(p => p.row === r && p.col === c)) {
                    return true; // Touches existing letter
                }
            }
        }
    }
    
    return false;
}

// Get words created
function getWordsCreated(direction) {
    const words = [];
    
    // Main word along direction
    const mainWord = getWordInDirection(direction, gameState.placedThisTurn[0].row, gameState.placedThisTurn[0].col, direction);
    if (mainWord.word.length >= 2) {
        words.push(mainWord);
    }
    
    // Cross words perpendicular
    for (const placement of gameState.placedThisTurn) {
        const crossDirection = direction === 'H' ? 'V' : 'H';
        const crossWord = getWordInDirection(crossDirection, placement.row, placement.col, crossDirection);
        if (crossWord.word.length >= 2 && crossWord.word !== mainWord.word) {
            // Check if this cross word is different from main word
            const isDuplicate = words.some(w => w.word === crossWord.word && 
                JSON.stringify(w.cells.sort()) === JSON.stringify(crossWord.cells.sort()));
            if (!isDuplicate) {
                words.push(crossWord);
            }
        }
    }
    
    return words;
}

// Get word in direction
function getWordInDirection(direction, startRow, startCol, searchDir) {
    const cells = [];
    let word = '';
    
    if (searchDir === 'H') {
        // Find start
        let col = startCol;
        while (col > 0 && gameState.board[startRow][col - 1].letter && !gameState.board[startRow][col - 1].blocked) {
            col--;
        }
        // Build word
        const size = gameState.board.length;
        while (col < size && gameState.board[startRow][col].letter) {
            cells.push({ row: startRow, col });
            word += gameState.board[startRow][col].letter.letter;
            col++;
        }
    } else {
        let row = startRow;
        const size = gameState.board.length;
        while (row > 0 && gameState.board[row - 1][startCol].letter) {
            row--;
        }
        while (row < size && gameState.board[row][startCol].letter) {
            cells.push({ row, col: startCol });
            word += gameState.board[row][startCol].letter.letter;
            row++;
        }
    }
    
    return { word, cells };
}

// Check if word is valid
function isWordValid(word) {
    return HEBREW_DICTIONARY.includes(word) || learnedWords.includes(word);
}

// Add word to learned words - ensures every accepted word is saved
function addLearnedWord(word) {
    if (!word || word.trim() === '') return;
    
    const trimmedWord = word.trim();
    
    // Check if word already exists in main dictionary
    if (HEBREW_DICTIONARY.includes(trimmedWord)) {
        // Word already in dictionary, no need to add to learned
        return;
    }
    
    // Add to learned words if not already there
    if (!learnedWords.includes(trimmedWord)) {
        learnedWords.push(trimmedWord);
        localStorage.setItem('bonusLearnedWords', JSON.stringify(learnedWords));
        console.log('✅ Learned word added to dictionary:', trimmedWord);
        console.log('📚 Total learned words:', learnedWords.length);
    }
}

// Score move
function scoreMove(words, placedThisTurn) {
    let totalScore = 0;
    
    for (const wordData of words) {
        let wordScore = 0;
        let wordMultiplier = 1;
        
        for (const cell of wordData.cells) {
            const cellData = gameState.board[cell.row][cell.col];
            const letterValue = cellData.letter.value;
            
            // Check if this tile was placed this turn
            const isNewlyPlaced = placedThisTurn.some(p => p.row === cell.row && p.col === cell.col);
            
            if (isNewlyPlaced) {
                // Apply letter multipliers
                if (cellData.bonus === 'DL') {
                    wordScore += letterValue * 2;
                } else if (cellData.bonus === 'TL') {
                    wordScore += letterValue * 3;
                } else {
                    wordScore += letterValue;
                }
                
                // Apply word multipliers
                if (cellData.bonus === 'DW') {
                    wordMultiplier *= 2;
                } else if (cellData.bonus === 'TW') {
                    wordMultiplier *= 3;
                }
            } else {
                wordScore += letterValue;
            }
        }
        
        totalScore += wordScore * wordMultiplier;
    }
    
    return totalScore;
}

// Apply rewards (deprecated - moved to proceedWithMove)
function applyRewards(placedThisTurn, words) {
    // This function is kept for compatibility but rewards are handled in proceedWithMove
    return 0;
}

// Trigger a challenge
// Trigger a challenge based on reward type
function triggerChallenge(rewardType = 'STAR') {
    let challenge;
    let points = 30;
    
    // Different challenge types based on reward icon
    switch(rewardType) {
        case 'STAR':
            // Basic challenges
            challenge = WORD_CHALLENGES[Math.floor(Math.random() * WORD_CHALLENGES.length)];
            points = 30;
            break;
            
        case 'FIRE':
            // Hard definitions
            const hardDefs = ADVANCED_CHALLENGES.hardDefinition;
            challenge = hardDefs[Math.floor(Math.random() * hardDefs.length)];
            challenge.type = 'hardDefinition';
            points = 40;
            break;
            
        case 'DIAMOND':
            // Complex anagrams
            const complexAnagrams = ADVANCED_CHALLENGES.complexAnagram;
            challenge = complexAnagrams[Math.floor(Math.random() * complexAnagrams.length)];
            challenge.type = 'complexAnagram';
            points = 40;
            break;
            
        case 'LIGHTNING':
            // Word formation - multiple words from letters
            const wordFormations = ADVANCED_CHALLENGES.wordFormation;
            challenge = wordFormations[Math.floor(Math.random() * wordFormations.length)];
            challenge.type = 'wordFormation';
            challenge.question = `צור כמה שיותר מילים מהאותיות: ${challenge.letters.join(', ')}`;
            challenge.minWords = challenge.minWords;
            challenge.possibleWords = challenge.possibleWords;
            points = 50; // Higher reward for harder challenge
            break;
            
        case 'TARGET':
            // Synonyms
            const synonyms = ADVANCED_CHALLENGES.synonym;
            challenge = synonyms[Math.floor(Math.random() * synonyms.length)];
            challenge.type = 'synonym';
            points = 35;
            break;
            
        default:
            challenge = WORD_CHALLENGES[Math.floor(Math.random() * WORD_CHALLENGES.length)];
            points = 30;
    }
    
    gameState.pendingChallenge = {
        ...challenge,
        points: points,
        rewardType: rewardType
    };
    
    showChallengeModal();
}

// Show challenge modal
function showChallengeModal() {
    if (!gameState.pendingChallenge) return;
    
    const modal = document.getElementById('challengeModal');
    const questionEl = document.getElementById('challengeQuestion');
    const answerEl = document.getElementById('challengeAnswer');
    const hintEl = document.getElementById('challengeHint');
    const resultEl = document.getElementById('challengeResult');
    const modalTitle = document.getElementById('challengeTitle') || modal.querySelector('h2');
    
    const challenge = gameState.pendingChallenge;
    const rewardIcons = {
        'STAR': '⭐',
        'FIRE': '🔥',
        'DIAMOND': '💎',
        'LIGHTNING': '⚡',
        'TARGET': '🎯'
    };
    
    modalTitle.textContent = `${rewardIcons[challenge.rewardType] || '⭐'} אתגר ${challenge.rewardType || 'כוכב'} ${rewardIcons[challenge.rewardType] || '⭐'}`;
    
    questionEl.textContent = challenge.question;
    
    // Special handling for word formation
    if (challenge.type === 'wordFormation') {
        answerEl.placeholder = 'הכנס מילים מופרדות בפסיקים (לדוגמה: בית, כלב, שמש)';
    } else {
        answerEl.placeholder = 'הכנס תשובה...';
    }
    
    answerEl.value = '';
    hintEl.style.display = 'none';
    resultEl.style.display = 'none';
    answerEl.focus();
    
    modal.style.display = 'flex';
}

// Submit challenge answer
function submitChallenge() {
    if (!gameState.pendingChallenge) return;
    
    const answerEl = document.getElementById('challengeAnswer');
    const userAnswer = answerEl.value.trim();
    const challenge = gameState.pendingChallenge;
    const resultEl = document.getElementById('challengeResult');
    const submitBtn = document.getElementById('challengeSubmitBtn');
    
    // Disable submit button to prevent double submission
    submitBtn.disabled = true;
    
    // Handle word formation challenge differently
    if (challenge.type === 'wordFormation') {
        const userWords = userAnswer.split(',').map(w => w.trim()).filter(w => w);
        const validWords = [];
        
        // Check each word
        for (const word of userWords) {
            // Check if word uses only the given letters
            const wordLetters = word.split('');
            const availableLetters = [...challenge.letters];
            let isValid = true;
            
            for (const letter of wordLetters) {
                const index = availableLetters.indexOf(letter);
                if (index === -1) {
                    isValid = false;
                    break;
                }
                availableLetters.splice(index, 1);
            }
            
            // Check if word is in dictionary
            if (isValid && isWordValid(word) && word.length >= 2) {
                validWords.push(word);
            }
        }
        
        if (validWords.length >= challenge.minWords) {
            // Success!
            resultEl.style.display = 'block';
            resultEl.style.background = '#4caf50';
            resultEl.style.color = 'white';
            resultEl.textContent = `✅ מצוין! מצאת ${validWords.length} מילים תקניות: ${validWords.join(', ')}. קיבלת ${challenge.points} נקודות!`;
            
            gameState.players[gameState.currentPlayerIndex].score += challenge.points;
            renderHeader();
            
            setTimeout(() => {
                document.getElementById('challengeModal').style.display = 'none';
                showToast(`+${challenge.points} נקודות בונוס!`, 'reward');
                gameState.pendingChallenge = null;
                submitBtn.disabled = false;
                
                if (gameState.players.length === 2) {
                    nextPlayer();
                }
                renderAll();
            }, 3000);
        } else {
            // Not enough words
            resultEl.style.display = 'block';
            resultEl.style.background = '#f44336';
            resultEl.style.color = 'white';
            resultEl.textContent = `❌ לא מספיק מילים. מצאת ${validWords.length} מילים תקניות (נדרשות ${challenge.minWords}). המילים התקניות: ${validWords.length > 0 ? validWords.join(', ') : 'אין'}`;
            
            const hintEl = document.getElementById('challengeHint');
            hintEl.style.display = 'block';
            hintEl.textContent = `💡 רמז: נסה: ${challenge.possibleWords.slice(0, 3).join(', ')}`;
            
            submitBtn.disabled = false;
            
            // Still give base reward
            gameState.players[gameState.currentPlayerIndex].score += 20;
            renderHeader();
            showToast('קיבלת +20 נקודות (בונוס בסיסי)', 'reward');
            
            setTimeout(() => {
                document.getElementById('challengeModal').style.display = 'none';
                gameState.pendingChallenge = null;
                submitBtn.disabled = false;
                
                if (gameState.players.length === 2) {
                    nextPlayer();
                }
                renderAll();
            }, 4000);
        }
        return;
    }
    
    // Regular challenge validation
    const correctAnswer = challenge.answer;
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() || 
        userAnswer === correctAnswer) {
        // Correct!
        resultEl.style.display = 'block';
        resultEl.style.background = '#4caf50';
        resultEl.style.color = 'white';
        resultEl.textContent = `✅ נכון! קיבלת ${gameState.pendingChallenge.points} נקודות בונוס!`;
        
        // Add points
        gameState.players[gameState.currentPlayerIndex].score += gameState.pendingChallenge.points;
        renderHeader();
        
        // Close modal after delay and proceed to next player
        setTimeout(() => {
            document.getElementById('challengeModal').style.display = 'none';
            showToast(`+${gameState.pendingChallenge.points} נקודות בונוס!`, 'reward');
            gameState.pendingChallenge = null;
            submitBtn.disabled = false;
            
            // Next player after challenge completes
            if (gameState.players.length === 2) {
                nextPlayer();
            }
            renderAll();
        }, 2000);
    } else {
        // Wrong
        resultEl.style.display = 'block';
        resultEl.style.background = '#f44336';
        resultEl.style.color = 'white';
        resultEl.textContent = `❌ לא נכון. התשובה הנכונה: ${correctAnswer}`;
        
        // Show hint
        const hintEl = document.getElementById('challengeHint');
        hintEl.style.display = 'block';
        hintEl.textContent = `💡 רמז: ${gameState.pendingChallenge.hint}`;
        
        // Re-enable submit button to allow retry
        submitBtn.disabled = false;
        
        // Still give base reward (20 points) even if challenge failed
        gameState.players[gameState.currentPlayerIndex].score += 20;
        renderHeader();
        showToast('קיבלת +20 נקודות (בונוס בסיסי)', 'reward');
        
        // Close modal after delay and proceed to next player
        setTimeout(() => {
            document.getElementById('challengeModal').style.display = 'none';
            gameState.pendingChallenge = null;
            submitBtn.disabled = false;
            
            // Next player after challenge completes (even if failed)
            if (gameState.players.length === 2) {
                nextPlayer();
            }
            renderAll();
        }, 3000);
    }
}

// Skip challenge
function skipChallenge() {
    if (!gameState.pendingChallenge) return;
    
    document.getElementById('challengeModal').style.display = 'none';
    
    // Still give base reward (20 points) when skipping
    gameState.players[gameState.currentPlayerIndex].score += 20;
    renderHeader();
    showToast('דילגת על האתגר, קיבלת +20 נקודות בסיסיות', 'reward');
    
    gameState.pendingChallenge = null;
    
    // Next player after skipping
    if (gameState.players.length === 2) {
        nextPlayer();
    }
    renderAll();
}

// Apply missions
function applyMissions(placedThisTurn, words, usedBonuses) {
    let extraPoints = 0;
    
    // LONG_WORD mission
    if (!gameState.missions.LONG_WORD) {
        const longWord = words.find(w => w.word.length >= 6);
        if (longWord) {
            gameState.missions.LONG_WORD = true;
            extraPoints += 15;
            showToast('משימה הושלמה: מילה ארוכה (+15)', 'reward');
        }
    }
    
    // USE_DW_TW mission
    if (!gameState.missions.USE_DW_TW) {
        if (usedBonuses.includes('DW') || usedBonuses.includes('TW')) {
            gameState.missions.USE_DW_TW = true;
            extraPoints += 10;
            showToast('משימה הושלמה: שימוש ב-DW/TW (+10)', 'reward');
        }
    }
    
    // COMBO_2PLUS mission
    if (!gameState.missions.COMBO_2PLUS) {
        if (words.length >= 2) {
            gameState.missions.COMBO_2PLUS = true;
            extraPoints += 10;
            showToast('משימה הושלמה: קומבו (+10)', 'reward');
        }
    }
    
    return extraPoints;
}

// Commit move
function commitMove() {
    // Check if it's online and not your turn
    if (gameState.isOnline && !gameState.isMyTurn) {
        showToast('זה לא התור שלך', 'error');
        return;
    }
    
    const validation = validateMove();
    if (!validation.valid) {
        // Check if it's a dictionary issue - offer dispute
        if (validation.invalidWord) {
            showDisputeModal(validation.invalidWord, validation.words);
            return;
        }
        showToast(validation.error, 'error');
        return;
    }
    
    proceedWithMove(validation.words);
}

// Next player
function nextPlayer() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.selectedTileId = null;
    gameState.exchangeMode = false;
    gameState.exchangeSelected = [];
    gameState.placedThisTurn = [];
    
    // Update turn indicator
    if (typeof updateTurnIndicator === 'function') {
        updateTurnIndicator();
    }
}

// Check if game has ended
function checkGameEnd() {
    // Game ends when bag is empty AND at least one player's rack is empty
    const bagEmpty = gameState.bag.length === 0;
    const anyRackEmpty = gameState.racks.some(rack => rack.length === 0);
    
    if (bagEmpty && anyRackEmpty) {
        // Calculate final scores (subtract remaining tiles)
        gameState.players.forEach((player, index) => {
            const remainingTiles = gameState.racks[index].reduce((sum, tile) => sum + tile.value, 0);
            player.score = Math.max(0, player.score - remainingTiles);
        });
        
        // Determine winner
        const winner = gameState.players.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        showGameEndModal(winner);
    }
}

// Show game end modal
function showGameEndModal(winner) {
    const modal = document.getElementById('gameEndModal');
    const winnerInfo = document.getElementById('winnerInfo');
    
    if (!modal || !winnerInfo) return;
    
    let html = '<div style="text-align: center; padding: 20px;">';
    html += `<h3 style="color: #667eea; margin-bottom: 20px;">🏆 המנצח: ${winner.name} 🏆</h3>`;
    html += '<div style="margin: 15px 0;">';
    
    gameState.players.forEach((player, index) => {
        const isWinner = player.name === winner.name;
        html += `<p style="font-size: 18px; ${isWinner ? 'color: #4caf50; font-weight: bold;' : ''}">`;
        html += `${player.name}: ${player.score} נקודות`;
        if (isWinner) html += ' 👑';
        html += '</p>';
    });
    
    html += '</div></div>';
    winnerInfo.innerHTML = html;
    
    modal.style.display = 'flex';
}

// Animate score update
function animateScoreUpdate(playerIndex, points) {
    const scoreEl = document.querySelector(`#player${playerIndex === 0 ? '1' : '2'}Score .score-value`);
    if (!scoreEl) return;
    
    // Flash animation
    scoreEl.style.transition = 'all 0.3s';
    scoreEl.style.transform = 'scale(1.3)';
    scoreEl.style.color = '#4caf50';
    
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
        scoreEl.style.color = '';
    }, 300);
}

// Update move preview (show potential score)
function updateMovePreview() {
    const previewEl = document.getElementById('movePreview');
    const previewScoreEl = document.getElementById('previewScore');
    
    if (!previewEl || !previewScoreEl) return;
    
    if (gameState.placedThisTurn.length === 0) {
        previewEl.style.display = 'none';
        return;
    }
    
    // Quick validation and score calculation
    const direction = determineDirection();
    if (!direction) {
        previewEl.style.display = 'none';
        return;
    }
    
    // Get words that would be created
    const words = getWordsCreated(gameState.placedThisTurn, direction);
    
    if (words.length === 0) {
        previewEl.style.display = 'none';
        return;
    }
    
    // Calculate preview score (simplified)
    let previewScore = 0;
    for (const wordData of words) {
        let wordScore = 0;
        for (const cell of wordData.cells) {
            const cellData = gameState.board[cell.row][cell.col];
            if (cellData.letter) {
                const isNewlyPlaced = gameState.placedThisTurn.some(p => p.row === cell.row && p.col === cell.col);
                if (isNewlyPlaced) {
                    const bonus = cellData.bonus;
                    if (bonus === 'DL') {
                        wordScore += cellData.letter.value * 2;
                    } else if (bonus === 'TL') {
                        wordScore += cellData.letter.value * 3;
                    } else {
                        wordScore += cellData.letter.value;
                    }
                } else {
                    wordScore += cellData.letter.value;
                }
            }
        }
        
        // Apply word multipliers
        let wordMultiplier = 1;
        for (const placement of gameState.placedThisTurn) {
            const bonus = gameState.board[placement.row][placement.col].bonus;
            if (bonus === 'DW') wordMultiplier *= 2;
            if (bonus === 'TW') wordMultiplier *= 3;
        }
        
        previewScore += wordScore * wordMultiplier;
    }
    
    // Add combo bonus
    if (words.length >= 2) {
        previewScore += 10;
    }
    
    // Add star bonuses
    for (const placement of gameState.placedThisTurn) {
        if (gameState.board[placement.row][placement.col].reward) {
            previewScore += 20;
        }
    }
    
    previewScoreEl.textContent = `ניקוד משוער: ${previewScore}`;
    previewEl.style.display = 'block';
}

// Exchange tiles
function exchangeTiles() {
    if (gameState.exchangeSelected.length === 0) {
        showToast('בחר אותיות להחלפה', 'error');
        return;
    }
    
    if (gameState.exchangeSelected.length > 3) {
        showToast('ניתן להחליף עד 3 אותיות', 'error');
        return;
    }
    
    // Remove selected tiles from rack
    const rack = getCurrentRack();
    const tilesToExchange = [];
    for (const tileId of gameState.exchangeSelected) {
        const index = rack.findIndex(t => t.id === tileId);
        if (index > -1) {
            tilesToExchange.push(rack.splice(index, 1)[0]);
        }
    }
    
    // Return to bag and shuffle
    gameState.bag.push(...tilesToExchange);
    shuffleArray(gameState.bag);
    
    // Draw new tiles
    refillRack();
    
    // Reset exchange mode
    gameState.exchangeMode = false;
    gameState.exchangeSelected = [];
    
    // End turn
    if (gameState.players.length === 2) {
        nextPlayer();
    }
    
    renderAll();
    showToast('אותיות הוחלפו', 'reward');
}

// Shuffle rack (UI only)
function shuffleRack() {
    const rack = getCurrentRack();
    shuffleArray(rack);
    renderRack();
}

// Show toast
function showToast(message, type = 'reward') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Show dispute modal
function showDisputeModal(word, allWords) {
    gameState.pendingDispute = { word, allWords, placedThisTurn: [...gameState.placedThisTurn] };
    const modal = document.getElementById('disputeModal');
    const disputedWordEl = document.getElementById('disputedWord');
    const playerSection = document.getElementById('disputePlayerSection');
    const askerNameEl = document.getElementById('disputeAskerName');
    
    disputedWordEl.textContent = word;
    
    // In 2-player mode, show who is asking
    if (gameState.players.length === 2) {
        playerSection.style.display = 'block';
        askerNameEl.textContent = gameState.players[gameState.currentPlayerIndex].name;
    } else {
        playerSection.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

// Accept dispute - word is valid
function acceptDispute() {
    if (!gameState.pendingDispute) return;
    
    const { word, allWords } = gameState.pendingDispute;
    
    // Add word to learned words
    addLearnedWord(word);
    showToast(`המילה "${word}" נוספה למילון`, 'reward');
    
    // Close modal
    document.getElementById('disputeModal').style.display = 'none';
    
    // Proceed with move using the words we already validated
    proceedWithMove(allWords);
    
    gameState.pendingDispute = null;
}

// Reject dispute - word is invalid
function rejectDispute() {
    if (!gameState.pendingDispute) return;
    
    const { word } = gameState.pendingDispute;
    
    // Close modal
    document.getElementById('disputeModal').style.display = 'none';
    
    showToast(`המילה "${word}" נדחתה`, 'error');
    
    gameState.pendingDispute = null;
}

// Proceed with move (after dispute resolved)
function proceedWithMove(words) {
    // Get used bonuses
    const usedBonuses = [];
    for (const placement of gameState.placedThisTurn) {
        const bonus = gameState.board[placement.row][placement.col].bonus;
        if (bonus) usedBonuses.push(bonus);
    }
    
    // Score move
    let moveScore = scoreMove(words, gameState.placedThisTurn);
    
    // Check for any reward cells - if found, we'll trigger challenge
    let rewardType = null;
    for (const placement of gameState.placedThisTurn) {
        const cell = gameState.board[placement.row][placement.col];
        if (cell.reward) {
            rewardType = cell.reward;
            break; // Only one challenge per move
        }
    }
    
    // Apply rewards (combo, but not reward cells - they trigger challenges)
    let rewardPoints = 0;
    if (words.length >= 2) {
        rewardPoints += 10;
        showToast('קומבו! +10', 'reward');
    }
    moveScore += rewardPoints;
    
    // Apply missions
    const missionPoints = applyMissions(gameState.placedThisTurn, words, usedBonuses);
    moveScore += missionPoints;
    
    // Update player score (before challenge)
    gameState.players[gameState.currentPlayerIndex].score += moveScore;
    
    // Clear placed this turn
    gameState.placedThisTurn = [];
    gameState.isFirstMove = false;
    
    // Refill rack
    refillRack();
    
    // Render to show the move on board
    renderAll();
    
    // Animate score update
    animateScoreUpdate(gameState.currentPlayerIndex, moveScore);
    showToast(`+${moveScore} נקודות!`, 'reward');
    
    // Check for game end (bag empty and one player's rack empty)
    checkGameEnd();
    
    // Send game state update if online
    if (gameState.isOnline) {
        sendGameStateUpdate();
        // Send move data
        if (gameState.socket && gameState.roomId) {
            gameState.socket.emit('submitMove', {
                roomId: gameState.roomId,
                moveData: {
                    valid: true,
                    score: moveScore,
                    playerIndex: gameState.currentPlayerIndex
                }
            });
        }
        // Switch turns
        gameState.isMyTurn = false;
        updateTurnIndicator();
    }
    
    // If reward cell was used, trigger challenge (this will add bonus points if correct)
    if (rewardType) {
        // Small delay to let player see their move
        setTimeout(() => {
            triggerChallenge(rewardType);
        }, 500);
    } else {
        // No challenge, just proceed to next player (only for local games)
        if (!gameState.isOnline && gameState.players.length === 2) {
            nextPlayer();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start modal
    const startModal = document.getElementById('startModal');
    const startGameBtn = document.getElementById('startGameBtn');
    const playerMode = document.getElementById('playerMode');
    const player1NameInput = document.getElementById('player1Name');
    const player2Section = document.getElementById('player2Section');
    const player2NameInput = document.getElementById('player2Name');
    
    // Initialize: hide player 2 section by default (1 player mode)
    player2Section.style.display = 'none';
    player2NameInput.disabled = true;
    
    // Auto-select default text when clicking/focusing on name inputs
    function setupNameInput(input) {
        input.addEventListener('focus', function() {
            if (this.value === 'שחקן 1' || this.value === 'שחקן 2') {
                this.select();
            }
        });
        
        input.addEventListener('click', function() {
            if (this.value === 'שחקן 1' || this.value === 'שחקן 2') {
                this.select();
            }
        });
    }

    setupNameInput(player1NameInput);
    setupNameInput(player2NameInput);
    
    playerMode.addEventListener('change', (e) => {
        const isTwoPlayers = e.target.value === '2';
        player2Section.style.display = isTwoPlayers ? 'block' : 'none';
        player2NameInput.disabled = !isTwoPlayers;
        
        // Clear player 2 name when switching to 1 player mode
        if (!isTwoPlayers) {
            player2NameInput.value = 'שחקן 2';
        }
    });
    
    // Game mode selector
    const gameMode = document.getElementById('gameMode');
    const localGameOptions = document.getElementById('localGameOptions');
    const onlineGameOptions = document.getElementById('onlineGameOptions');
    const startGameBtn = document.getElementById('startGameBtn');
    
    // Make sure start button is visible for local games by default
    if (startGameBtn && gameMode && gameMode.value === 'local') {
        startGameBtn.style.display = 'block';
    }
    
    if (gameMode) {
        gameMode.addEventListener('change', (e) => {
            if (e.target.value === 'online') {
                if (localGameOptions) localGameOptions.style.display = 'none';
                if (onlineGameOptions) onlineGameOptions.style.display = 'block';
                if (startGameBtn) startGameBtn.style.display = 'none';
                // Initialize socket connection - wait a bit for online.js to load
                setTimeout(() => {
                    if (typeof io !== 'undefined' && typeof initSocket === 'function' && !gameState.socket) {
                        initSocket();
                    } else if (typeof io === 'undefined') {
                        showToast('טוען חיבור...', 'error');
                    }
                }, 100);
            } else {
                if (localGameOptions) localGameOptions.style.display = 'block';
                if (onlineGameOptions) onlineGameOptions.style.display = 'none';
                if (startGameBtn) startGameBtn.style.display = 'block'; // Show start button for local games
            }
        });
    }
    
    // Online game buttons - wait for online.js to load
    setTimeout(() => {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const startOnlineGameBtn = document.getElementById('startOnlineGameBtn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                if (typeof createRoom === 'function') {
                    createRoom();
                } else {
                    showToast('טוען...', 'error');
                }
            });
        }
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => {
                if (typeof joinRoom === 'function') {
                    joinRoom();
                } else {
                    showToast('טוען...', 'error');
                }
            });
        }
        if (startOnlineGameBtn) {
            startOnlineGameBtn.addEventListener('click', () => {
                if (typeof setPlayerReady === 'function') {
                    setPlayerReady();
                } else {
                    showToast('טוען...', 'error');
                }
            });
        }
    }, 200);
    
    // Local game start
    startGameBtn.addEventListener('click', () => {
        const mode = playerMode.value;
        const difficulty = document.getElementById('difficultyMode').value;
        const names = [
            document.getElementById('player1Name').value || 'שחקן 1',
            document.getElementById('player2Name').value || 'שחקן 2'
        ];
        
        // Set difficulty settings
        const difficultySettings = {
            easy: { turnTime: 0, aiHints: true, rackSize: 7 },
            normal: { turnTime: 0, aiHints: false, rackSize: 7 },
            hard: { turnTime: 45, aiHints: false, rackSize: 7 }, // 45 seconds (less than 1 minute)
            expert: { turnTime: 60, aiHints: false, rackSize: 6 }
        };
        
        const settings = difficultySettings[difficulty];
        gameState.turnTimeLimit = settings.turnTime;
        gameState.timerEnabled = settings.turnTime > 0;
        
        // Show/hide hints button based on difficulty
        const hintsBtn = document.getElementById('hintsBtn');
        if (hintsBtn) {
            hintsBtn.style.display = settings.aiHints ? 'inline-block' : 'none';
        }
        
        startModal.style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        gameState.isOnline = false;
        initGame(mode, names);
        
        // Start turn timer if enabled
        if (gameState.timerEnabled) {
            startTurnTimer();
        }
    });
    
    // Controls
    document.getElementById('submitBtn').addEventListener('click', commitMove);
    document.getElementById('resetBtn').addEventListener('click', resetTurn);
    document.getElementById('exchangeBtn').addEventListener('click', () => {
        if (gameState.exchangeMode) {
            exchangeTiles();
        } else {
            gameState.exchangeMode = true;
            gameState.selectedTileId = null;
            renderRack();
        }
    });
    document.getElementById('shuffleBtn').addEventListener('click', shuffleRack);
    
    // Dispute modal
    document.getElementById('disputeAcceptBtn').addEventListener('click', acceptDispute);
    document.getElementById('disputeRejectBtn').addEventListener('click', rejectDispute);
    
    // Challenge modal
    document.getElementById('challengeSubmitBtn').addEventListener('click', submitChallenge);
    document.getElementById('challengeSkipBtn').addEventListener('click', skipChallenge);
    
    // Challenge answer input - allow Enter key
    document.getElementById('challengeAnswer').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitChallenge();
        }
    });
    
    // Timer toggle
    document.getElementById('timerToggle').addEventListener('change', (e) => {
        gameState.timerEnabled = e.target.checked;
        // Timer implementation would go here
    });
    
    // New game button
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    // Copy room code button (fallback if online.js not loaded)
    const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
    if (copyRoomCodeBtn && typeof copyRoomCode !== 'function') {
        copyRoomCodeBtn.addEventListener('click', () => {
            const roomCode = document.getElementById('roomCode');
            if (roomCode && roomCode.textContent) {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(roomCode.textContent).then(() => {
                        showToast('קוד החדר הועתק!', 'reward');
                        copyRoomCodeBtn.textContent = '✓ הועתק';
                        setTimeout(() => {
                            copyRoomCodeBtn.textContent = 'העתק';
                        }, 2000);
                    });
                }
            }
        });
    }
});

