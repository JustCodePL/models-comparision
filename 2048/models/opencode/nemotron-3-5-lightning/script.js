class Game2048 {
  constructor() {
    this.board = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('2048HighScore') || '0');
    this.isGameOver = false;
    this.hasWon2048 = false;
    
    this.boardElement = document.getElementById('board');
    this.scoreElement = document.getElementById('score');
    this.newGameBtn = document.getElementById('newGame');
    
    this.scoreElement.textContent = this.score;
    
    this.initBoard();
    this.setupEventListeners();
    this.newGame();
  }
  
  initBoard() {
    this.board = Array.from({ length: 4 }, () => Array(4).fill(0));
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.newGameBtn.addEventListener('click', () => this.newGame());
  }
  
  newGame() {
    this.initBoard();
    this.score = 0;
    this.hasWon2048 = false;
    this.isGameOver = false;
    this.scoreElement.textContent = this.score;
    this.boardElement.innerHTML = '';
    this.spawnTile();
    this.spawnTile();
    this.updateVisualBoard();
    this.hideMessages();
  }
  
  handleKeyDown(e) {
    if (this.isGameOver) return;
    
    let moved = false;
    
    e.preventDefault();
    
    switch(e.key) {
      case 'ArrowUp':
      case 'W': case 'w':
        moved = this.moveUp();
        break;
      case 'ArrowDown':
      case 'S': case 's':
        moved = this.moveDown();
        break;
      case 'ArrowLeft':
      case 'A': case 'a':
        moved = this.moveLeft();
        break;
      case 'ArrowRight':
      case 'D': case 'd':
        moved = this.moveRight();
        break;
    }
    
    if (moved) {
      this.spawnTile();
      this.updateVisualBoard();
      this.checkGameState();
    }
  }
  
  moveLeft() {
    let changed = false;
    
    for (let i = 0; i < 4; i++) {
      const row = this.board[i].slice();
      
      let compressed = this.compress(row);
      let merged = this.merge(compressed);
      const final = this.compress(merged);
      
      changed = changed || JSON.stringify(row) !== JSON.stringify(final);
      
      this.board[i] = final;
    }
    
    return changed;
  }
  
  moveRight() {
    let changed = false;
    
    for (let i = 0; i < 4; i++) {
      let row = this.board[i].slice().reverse();
      
      let compressed = this.compress(row);
      let merged = this.merge(compressed);
      const final = this.compress(merged).reverse();
      
      changed = changed || JSON.stringify(this.board[i].reverse()) !== JSON.stringify(final.reverse());
      this.board[i] = final;
    }
    
    return changed;
  }
  
  moveUp() {
    let changed = false;
    
    const transposed = this.transpose();
    
    for (let i = 0; i < 4; i++) {
      let row = transposed[i].slice();
      let compressed = this.compress(row);
      let merged = this.merge(compressed);
      const final = this.compress(merged);
      
      changed = changed || JSON.stringify(transposed[i]) !== JSON.stringify(final);
      transposed[i] = final;
    }
    
    this.board = this.transposeBack(transposed);
    return changed;
  }
  
  moveDown() {
    let changed = false;
    
    const transposed = this.transpose();
    
    for (let i = 0; i < 4; i++) {
      let row = transposed[i].slice().reverse();
      let compressed = this.compress(row);
      let merged = this.merge(compressed);
      const final = this.compress(merged).reverse();
      
      changed = changed || JSON.stringify(transposed[i].reverse()) !== JSON.stringify(final.reverse());
      transposed[i] = final;
    }
    
    this.board = this.transposeBack(transposed);
    return changed;
  }
  
  compress(arr) {
    const result = [0, 0, 0, 0];
    let idx = 0;
    
    for (let i = 0; i < 4; i++) {
      if (arr[i] !== 0) {
        result[idx++] = arr[i];
      }
    }
    
    return result;
  }
  
  merge(arr) {
    let result = [...arr];
    
    for (let i = 0; i < 3; i++) {
      if (result[i] !== 0 && result[i] === result[i + 1]) {
        result[i] = result[i] * 2;
        this.score += result[i];
        result[i + 1] = 0;
        i++;
      }
    }
    
    return this.compress(result);
  }
  
  transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }
  
  transposeBack(matrix) {
    return this.transpose(matrix);
  }
  
  spawnTile() {
    const emptyCells = [];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.board[i][j] === 0) {
          emptyCells.push({ i, j });
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    const randomIdx = Math.floor(Math.random() * emptyCells.length);
    const { i, j } = emptyCells[randomIdx];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.board[i][j] = value;
  }
  
  updateVisualBoard() {
    this.boardElement.innerHTML = '';
    
    const tileColors = {
      2: '#776e65',
      4: '#f2f2f2',
      8: '#f5913d',
      16: '#f67c5f',
      32: '#f65c6c',
      64: '#edcf73',
      128: '#edcc61',
      256: '#edc850',
      512: '#edc53f',
      1024: '#edc22e',
      2048: '#38a3a5',
    };
    
    const tileTextColors = {
      2: '#776e65',
      4: '#776e65',
      8: '#f9f9f9',
      16: '#f9f9f9',
      32: '#f9f9f9',
      64: '#f9f9f9',
      128: '#f9f9f9',
      256: '#f9f9f9',
      512: '#f9f9f9',
      1024: '#f9f9f9',
      2048: '#f9f9f9',
    };
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const value = this.board[i][j];
        const tile = document.createElement('div');
        tile.className = 'tile';
        
        if (value !== 0) {
          tile.textContent = value;
          tile.style.backgroundColor = tileColors[value] || '#3a3a5a';
          tile.style.color = tileTextColors[value] || '#fff';
        }
        
        this.boardElement.appendChild(tile);
      }
    }
  }
  
  checkGameState() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.board[i][j] === 2048 && !this.hasWon2048) {
          this.hasWon2048 = true;
          setTimeout(() => {
            this.showMessage('GRATULACJE!', 'Udało Ci się osiągnąć 2048! Kontynuuj grę?', true);
          }, 300);
          return;
        }
      }
    }
    
    let hasEmpty = false;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.board[i][j] === 0) {
          hasEmpty = true;
        }
        
        if (j < 3 && this.board[i][j] === this.board[i][j + 1]) {
          return;
        }
        
        if (i < 3 && this.board[i][j] === this.board[i + 1][j]) {
          return;
        }
      }
    }
    
    if (!hasEmpty) {
      setTimeout(() => {
        this.showMessage('KONIEC GRY', 'Nie ma więcej możliwych ruchów!', false);
      }, 300);
    }
  }
  
  showMessage(title, text, isWin) {
    const existing = this.boardElement.parentElement.querySelector('.message');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'message';
    modal.innerHTML = `
      <div class="modal">
        <h2>${title}</h2>
        <p>${text}</p>
        <button class="new-game-btn">Nowa gra</button>
      </div>
    `;
    
    modal.querySelector('button').addEventListener('click', () => {
      modal.remove();
      this.newGame();
    });
    
    this.boardElement.parentElement.appendChild(modal);
  }
  
  hideMessages() {
    const existing = this.boardElement.parentElement.querySelector('.message');
    if (existing) existing.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game2048();
});