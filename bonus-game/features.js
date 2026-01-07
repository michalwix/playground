// Additional Game Features - Drag & Drop and AI Hints

// ====== DRAG AND DROP ======

// Enable drag on tile element
function enableTileDrag(tileEl, tileId) {
    tileEl.draggable = true;
    tileEl.style.cursor = 'grab';
    
    tileEl.addEventListener('dragstart', (e) => {
        if (gameState.exchangeMode) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tileId);
        tileEl.classList.add('dragging');
        tileEl.style.opacity = '0.5';
        gameState.selectedTileId = tileId;
    });
    
    tileEl.addEventListener('dragend', (e) => {
        tileEl.classList.remove('dragging');
        tileEl.style.opacity = '1';
    });
}

// Enable drop on board cells
function enableCellDrop() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!cell.querySelector('.tile-letter')) { // Only if cell is empty
                cell.classList.add('drag-over');
            }
        });
        
        cell.addEventListener('dragleave', (e) => {
            cell.classList.remove('drag-over');
        });
        
        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            
            const tileId = e.dataTransfer.getData('text/plain');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (tileId && !isNaN(row) && !isNaN(col)) {
                gameState.selectedTileId = tileId;
                placeTile(row, col);
            }
        });
    });
}

// Call this after rendering the board
function initDragAndDrop() {
    enableCellDrop();
}

// ====== AI HINTS SYSTEM ======

// Generate hints based on current rack and board state
function generateHints() {
    const rack = getCurrentRack();
    const letters = rack.map(t => t.letter);
    const hints = [];
    
    // Check all combinations of letters (2-7 letters)
    for (let len = 2; len <= Math.min(letters.length, 7); len++) {
        const combinations = getCombinations(letters, len);
        
        for (const combo of combinations) {
            const word = combo.join('');
            
            // Check if word is valid
            if (isWordValid(word)) {
                // Find possible placements on board
                const placements = findValidPlacementsForWord(word);
                
                if (placements.length > 0) {
                    // Calculate best placement
                    const bestPlacement = placements.reduce((best, current) => {
                        return current.score > best.score ? current : best;
                    });
                    
                    hints.push({
                        word: word,
                        placement: bestPlacement,
                        score: bestPlacement.score
                    });
                }
            }
        }
    }
    
    // Sort by score and return top 3
    return hints.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Get all combinations of length k from array
function getCombinations(arr, k) {
    const results = [];
    
    function combine(start, combo) {
        if (combo.length === k) {
            results.push([...combo]);
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return results;
}

// Find all valid placements for a word on the current board
function findValidPlacementsForWord(word) {
    const placements = [];
    const boardSize = gameState.board.length;
    
    // Try horizontal placements
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col <= boardSize - word.length; col++) {
            const placement = tryPlaceWord(word, row, col, 'H');
            if (placement) {
                placements.push(placement);
            }
        }
    }
    
    // Try vertical placements
    for (let row = 0; row <= boardSize - word.length; row++) {
        for (let col = 0; col < boardSize; col++) {
            const placement = tryPlaceWord(word, row, col, 'V');
            if (placement) {
                placements.push(placement);
            }
        }
    }
    
    return placements;
}

// Try to place a word at a specific position and direction
function tryPlaceWord(word, startRow, startCol, direction) {
    const positions = [];
    let score = 0;
    
    for (let i = 0; i < word.length; i++) {
        const row = direction === 'H' ? startRow : startRow + i;
        const col = direction === 'H' ? startCol + i : startCol;
        
        const cell = gameState.board[row][col];
        
        // If cell is occupied by a different letter, placement invalid
        if (cell.letter && cell.letter !== word[i]) {
            return null;
        }
        
        // If cell is empty, we need this letter from rack
        if (!cell.letter) {
            positions.push({ row, col, letter: word[i] });
        }
    }
    
    // Check if placement touches existing letters or is first move
    if (!gameState.isFirstMove) {
        let touchesExisting = false;
        
        for (const pos of positions) {
            const neighbors = [
                [pos.row - 1, pos.col],
                [pos.row + 1, pos.col],
                [pos.row, pos.col - 1],
                [pos.row, pos.col + 1]
            ];
            
            for (const [r, c] of neighbors) {
                if (r >= 0 && r < gameState.board.length && 
                    c >= 0 && c < gameState.board[0].length) {
                    if (gameState.board[r][c].letter) {
                        touchesExisting = true;
                        break;
                    }
                }
            }
            if (touchesExisting) break;
        }
        
        if (!touchesExisting && positions.length > 0) {
            return null;
        }
    }
    
    // Estimate score (simplified - doesn't account for cross words)
    for (const pos of positions) {
        const cell = gameState.board[pos.row][pos.col];
        let letterScore = LETTER_VALUES[pos.letter] || 1;
        
        if (cell.bonus === 'DL') letterScore *= 2;
        if (cell.bonus === 'TL') letterScore *= 3;
        
        score += letterScore;
    }
    
    // Apply word multipliers
    for (const pos of positions) {
        const cell = gameState.board[pos.row][pos.col];
        if (cell.bonus === 'DW') score *= 2;
        if (cell.bonus === 'TW') score *= 3;
    }
    
    return {
        word,
        positions,
        direction,
        startRow,
        startCol,
        score
    };
}

// Display hints to user
function displayHints() {
    const hints = generateHints();
    const modal = document.getElementById('hintsModal');
    const list = document.getElementById('hintsList');
    
    if (!modal || !list) return;
    
    if (hints.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">לא נמצאו רמזים זמינים.<br>נסה להחליף אותיות או להמשיך לשחק.</p>';
    } else {
        list.innerHTML = hints.map((hint, i) => `
            <div class="hint-item">
                <div class="hint-rank">${i + 1}</div>
                <div class="hint-details">
                    <div class="hint-word">${hint.word}</div>
                    <div class="hint-info">
                        <span>📍 שורה ${hint.placement.startRow + 1}, עמודה ${hint.placement.startCol + 1}</span>
                        <span>⭐ ${hint.placement.score} נקודות</span>
                        <span>${hint.placement.direction === 'H' ? '➡️ אופקי' : '⬇️ אנכי'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

// Close hints modal
function closeHints() {
    const modal = document.getElementById('hintsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize hints button
function initHintsButton() {
    const hintsBtn = document.getElementById('hintsBtn');
    const closeHintsBtn = document.getElementById('closeHintsBtn');
    
    if (hintsBtn) {
        hintsBtn.addEventListener('click', displayHints);
    }
    
    if (closeHintsBtn) {
        closeHintsBtn.addEventListener('click', closeHints);
    }
}

// Initialize high scores button
function initHighScoresButton() {
    const highScoresBtn = document.getElementById('highScoresBtn');
    const closeHighScoresBtn = document.getElementById('closeHighScoresBtn');
    
    if (highScoresBtn) {
        highScoresBtn.addEventListener('click', displayHighScores);
    }
    
    if (closeHighScoresBtn) {
        closeHighScoresBtn.addEventListener('click', () => {
            document.getElementById('highScoresModal').style.display = 'none';
        });
    }
}

// Call these in your main initialization
// Add to DOMContentLoaded:
// initDragAndDrop();
// initHintsButton();
// initHighScoresButton();



