class Tile {
  constructor(boardEl, game) {
    this.boardEl = boardEl;
    this.game = game;
    this.container = boardEl.querySelector('.tiles');
    this.bg = boardEl.querySelector('.grid-background');
  }

  init() {
    this.container.innerHTML = '';
    this.drawBackground();
    const size = this.bgRect();
    this.boardEl.style.setProperty('--cell', `${size}px`);
  }

  bgRect() {
    const rect = this.bg.getBoundingClientRect();
    return rect.width / this.game.size;
  }

  drawBackground() {
    this.bg.innerHTML = '';
    const n = this.game.size;
    for (let i = 0; i < n * n; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.bg.appendChild(cell);
    }
  }

  render() {
    this.container.innerHTML = '';
    const n = this.game.size;
    const cell = this.cellSize();

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const value = this.game.board[this.game.index(row, col)];
        if (value === 0) continue;
        const el = this.createTileEl(value);
        el.style.width = `${cell}px`;
        el.style.height = `${cell}px`;
        el.style.transform = `translate(${col * cell}px, ${row * cell}px)`;
        this.container.appendChild(el);
      }
    }
  }

  cellSize() {
    return this.bgRect();
  }

  createTileEl(value) {
    const el = document.createElement('div');
    el.className = `tile tile-${value}`;
    if (value > 2048) el.classList.add('tile-super');
    el.textContent = value;
    this.applyFontSize(el);
    return el;
  }

  applyFontSize(el) {
    const cell = this.cellSize();
    let fontSize = Math.floor(cell * 0.5);
    if (String(el.textContent).length >= 4) fontSize = Math.floor(cell * 0.35);
    el.style.setProperty('--font-size', `${fontSize}px`);
  }
}
