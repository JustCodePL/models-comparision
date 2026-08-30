// src/game.ts
export interface Board {
  grid: number[][];
}

export class Game {
  static readonly SIZE = 4;
  board: number[][];
  score: number;
  win: boolean;
  gameOver: boolean;

  constructor() {
    this.board = Array.from({ length: Game.SIZE }, () => Array(Game.SIZE).fill(0));
    this.score = 0;
    this.win = false;
    this.gameOver = false;
    this.addRandomTile();
    this.addRandomTile();
  }

  cloneBoard(b: number[][]) {
    return b.map(row => [...row]);
  }

  addRandomTile() {
    const empty: [number, number][] = [];
    for (let i = 0; i < Game.SIZE; i++) {
      for (let j = 0; j < Game.SIZE; j++) {
        if (this.board[i][j] === 0) empty.push([i, j]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.board[r][c] = value;
  }

  reset() {
    this.board = Array.from({ length: Game.SIZE }, () => Array(Game.SIZE).fill(0));
    this.score = 0;
    this.win = false;
    this.gameOver = false;
    this.addRandomTile();
    this.addRandomTile();
  }

  // Move helpers
  slideAndCombine(row: number[]): [number[], number] {
    const newRow = row.filter(v => v !== 0);
    let mergedScore = 0;
    for (let i = 0; i < newRow.length - 1; i++) {
      if (newRow[i] === newRow[i + 1]) {
        newRow[i] *= 2;
        mergedScore += newRow[i];
        newRow.splice(i + 1, 1);
      }
    }
    while (newRow.length < Game.SIZE) newRow.push(0);
    return [newRow, mergedScore];
  }

  move(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (this.gameOver) return false;
    const old = this.cloneBoard(this.board);
    let changed = false;
    let totalScore = 0;

    const iterate = (index: number, step: number) => {
      for (let i = 0; i < Game.SIZE; i++) {
        const rowIndices: number[] = [];
        for (let j = 0; j < Game.SIZE; j++) {
          const r = direction === 'up' ? j : direction === 'down' ? Game.SIZE - 1 - j : i;
          const c = direction === 'left' ? j : direction === 'right' ? Game.SIZE - 1 - j : i;
          if (direction === 'up' || direction === 'down') rowIndices.push(this.board[r][c]);
        }
        const [newRow, scoreAdded] = this.slideAndCombine(rowIndices);
        totalScore += scoreAdded;
        for (let j = 0; j < Game.SIZE; j++) {
          const r = direction === 'up' ? j : direction === 'down' ? Game.SIZE - 1 - j : i;
          const c = direction === 'left' ? j : direction === 'right' ? Game.SIZE - 1 - j : i;
          if (this.board[r][c] !== newRow[j]) changed = true;
          this.board[r][c] = newRow[j];
        }
      }
    };

    iterate(0, 1);
    if (changed) {
      this.score += totalScore;
      if (this.board.flat().includes(2048)) this.win = true;
      this.addRandomTile();
      if (!this.canMove()) this.gameOver = true;
    }
    return changed;
  }

  canMove(): boolean {
    for (let i = 0; i < Game.SIZE; i++) {
      for (let j = 0; j < Game.SIZE; j++) {
        if (this.board[i][j] === 0) return true;
        if (j < Game.SIZE - 1 && this.board[i][j] === this.board[i][j + 1]) return true;
        if (i < Game.SIZE - 1 && this.board[i][j] === this.board[i + 1][j]) return true;
      }
    }
    return false;
  }
}
