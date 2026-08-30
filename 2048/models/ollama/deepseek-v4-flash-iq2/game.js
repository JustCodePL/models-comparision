class Game {
  constructor(size = 4) {
    this.size = size;
    this.board = null;
    this.score = 0;
    this.won = false;
    this.over = false;
    this.newGame();
  }

  newGame() {
    this.board = this.emptyBoard();
    this.score = 0;
    this.won = false;
    this.changed = false;
    this.lastTiles = null;
    this.lastMove = null;
    this.addRandomTile();
    this.addRandomTile();
  }

  emptyBoard() {
    return Array.from({ length: this.size * this.size }, () => 0);
  }

  index(row, col) {
    return row * this.size + col;
  }

  canMove() {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const value = this.board[this.index(row, col)];
        if (value === 0) return true;
        if (col + 1 < this.size && this.board[this.index(row, col + 1)] === value) return true;
        if (row + 1 < this.size && this.board[this.index(row + 1, col)] === value) return true;
      }
    }
    return false;
  }

  isGameOver() {
    return !this.canMove();
  }

  slideLine(line) {
    // Sliding + merge (max jedno łączenie na kafelek). Zwraca { line, gain }
    const values = line.filter(v => v !== 0);
    const result = [];
    let gain = 0;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (i + 1 < values.length && values[i + 1] === value) {
        result.push(value * 2);
        gain += value * 2;
        i++;
      } else {
        result.push(value);
      }
    }
    while (result.length < this.size) result.push(0);
    return { line: result, gain };
  }

  extractLine(direction, lineIndex) {
    const line = [];
    for (let i = 0; i < this.size; i++) {
      let value;
      switch (direction) {
        case 'left':  value = this.board[this.index(lineIndex, i)]; break;
        case 'right': value = this.board[this.index(lineIndex, this.size - 1 - i)]; break;
        case 'up':    value = this.board[this.index(i, lineIndex)]; break;
        case 'down':  value = this.board[this.index(this.size - 1 - i, lineIndex)]; break;
      }
      line.push(value);
    }
    return line;
  }

  writeLine(direction, lineIndex, line) {
    for (let i = 0; i < this.size; i++) {
      const value = line[i];
      switch (direction) {
        case 'left':  this.board[this.index(lineIndex, i)] = value; break;
        case 'right': this.board[this.index(lineIndex, this.size - 1 - i)] = value; break;
        case 'up':    this.board[this.index(i, lineIndex)] = value; break;
        case 'down':  this.board[this.index(this.size - 1 - i, lineIndex)] = value; break;
      }
    }
  }

  move(direction) {
    if (this.over) return null;

    const before = this.board.slice();
    let gained = 0;

    for (let i = 0; i < this.size; i++) {
      const original = this.extractLine(direction, i);
      const { line: slid, gain } = this.slideLine(original);

      // Zysk = suma wartości scalonych kafelków (podwojonych przez połączenie)
      gained += gain;

      this.writeLine(direction, i, slid);
    }

    const changed = !this.board.every((v, i) => v === before[i]);
    if (!changed) return { changed: false, gained: 0, added: null, won: this.won };

    this.score += gained;
    this.changed = true;

    const added = this.addRandomTile();
    this.won = this.hasWon() || this.won;
    this.over = this.isGameOver();

    return { changed: true, gained, added };
  }



  indexDelta(direction) {
    switch (direction) {
      case 'left': return { dr: 0, dc: 1 };
      case 'right': return { dr: 0, dc: -1 };
      case 'up': return { dr: 1, dc: 0 };
      case 'down': return { dr: -1, dc: 0 };
    }
  }

  addRandomTile() {
    const empty = [];
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === 0) empty.push(i);
    }
    if (empty.length === 0) return null;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.board[idx] = value;
    const row = Math.floor(idx / this.size);
    const col = idx % this.size;
    return { value, row, col, index: idx };
  }

  hasWon() {
    return this.board.some(v => v === 2048);
  }
}
