class App {
  constructor() {
    this.game = new Game();
    this.boardEl = document.getElementById('board');
    this.tileView = new Tile(this.boardEl, this.game);
    this.scoreEl = document.getElementById('score');
    this.bestEl = document.getElementById('best');
    this.messageEl = document.getElementById('message');
    this.msgTextEl = document.getElementById('message-text');
    this.newGameBtn = document.getElementById('new-game');

    this.best = Number(localStorage.getItem('best2048') || 0);
    this.lastMoveTime = 0;

    this.tileView.init();
    this.render();
    this.bindEvents();
  }

  render() {
    this.tileView.render();
    this.scoreEl.textContent = this.game.score;
    this.bestEl.textContent = Math.max(this.best, this.game.score);
  }

  bindEvents() {
    this.newGameBtn.addEventListener('click', () => this.newGame());

    document.addEventListener('keydown', (e) => {
      const map = {
        ArrowLeft: 'left', ArrowRight: 'right',
        ArrowUp: 'up', ArrowDown: 'down',
        w: 'up', a: 'left', s: 'down', d: 'right',
        W: 'up', A: 'left', S: 'down', D: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      this.doTimedMove(dir);
    });

    this.setupSwipe();
  }

  doTimedMove(dir) {
    const now = performance.now();
    if (now - this.lastMoveTime < 90) return;
    this.lastMoveTime = now;
    this.doMove(dir);
  }

  doMove(dir) {
    const result = this.game.move(dir);
    if (result === null) return;
    this.render();
    if (this.game.over) this.showEnd(true);
  }

  newGame() {
    this.game.newGame();
    this.messageEl.classList.add('hidden');
    this.render();
  }

  setupSwipe() {
    let startX = 0, startY = 0, tracking = false;
    const el = this.boardEl;
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    el.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 24) return;
      let dir;
      if (ax > ay) dir = dx > 0 ? 'right' : 'left';
      else dir = dy > 0 ? 'down' : 'up';
      this.doTimedMove(dir);
    }, { passive: true });
  }

  showEnd(isOver) {
    this.msgTextEl.textContent = isOver ? 'Game Over' : '';
    this.msgTextEl.classList.toggle('lose', isOver);
    this.messageEl.classList.remove('hidden');
    if (this.game.score > this.best) {
      this.best = this.game.score;
      localStorage.setItem('best2048', String(this.best));
      this.render();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
