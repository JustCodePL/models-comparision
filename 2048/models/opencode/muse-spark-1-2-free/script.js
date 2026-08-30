(() => {
  const SIZE = 4;
  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreAddEl = document.getElementById('scoreAdd');
  const tileCountEl = document.getElementById('tileCount');
  const winOverlay = document.getElementById('winOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');

  let board = [];
  let score = 0;
  let best = parseInt(localStorage.getItem('2048-best') || '0', 10);
  let won = false;
  let keepPlaying = false;
  let over = false;

  // track which tiles were merged/new for animation
  let lastMerged = new Set();
  let lastNewPos = null;

  bestEl.textContent = best;

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function getEmptyCells(b = board) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (b[r][c] === 0) cells.push([r, c]);
    return cells;
  }

  function addRandomTile() {
    const empty = getEmptyCells();
    if (empty.length === 0) return null;
    const idx = Math.floor(Math.random() * empty.length);
    const [r, c] = empty[idx];
    const val = Math.random() < 0.9 ? 2 : 4;
    board[r][c] = val;
    lastNewPos = `${r}-${c}`;
    return [r, c, val];
  }

  function slideAndMergeRow(row) {
    // row is array length 4
    const filtered = row.filter(v => v !== 0);
    const result = [];
    let gain = 0;
    let mergedIndices = []; // indices in result that were merges
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        result.push(mergedVal);
        gain += mergedVal;
        mergedIndices.push(result.length - 1);
        i += 2;
      } else {
        result.push(filtered[i]);
        i += 1;
      }
    }
    while (result.length < SIZE) result.push(0);
    const moved = !row.every((v, idx) => v === result[idx]);
    return { row: result, gain, moved, mergedIndices };
  }

  function transpose(b) {
    return b[0].map((_, c) => b.map(row => row[c]));
  }

  function move(direction) {
    if (over && !keepPlaying) return false;
    // prevent move during overlay? allow keepPlaying
    let moved = false;
    let totalGain = 0;
    let newMerged = new Set();
    lastNewPos = null;

    const processLeft = (b) => {
      let next = [];
      let gain = 0;
      let anyMoved = false;
      for (let r = 0; r < SIZE; r++) {
        const { row, gain: g, moved: m, mergedIndices } = slideAndMergeRow(b[r]);
        next.push(row);
        gain += g;
        if (m) anyMoved = true;
        mergedIndices.forEach(ci => newMerged.add(`${r}-${ci}`));
      }
      return { board: next, gain, anyMoved };
    };

    let newBoard;
    if (direction === 'left') {
      const res = processLeft(board);
      newBoard = res.board;
      totalGain = res.gain;
      moved = res.anyMoved;
      // merged positions already in newMerged with original coords
    } else if (direction === 'right') {
      const reversed = board.map(r => [...r].reverse());
      const res = processLeft(reversed);
      newBoard = res.board.map(r => [...r].reverse());
      totalGain = res.gain;
      moved = res.anyMoved;
      // translate merged positions
      const translated = new Set();
      newMerged.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        const origC = SIZE - 1 - c;
        translated.add(`${r}-${origC}`);
      });
      newMerged = translated;
    } else if (direction === 'up') {
      const t = transpose(board);
      const res = processLeft(t);
      newBoard = transpose(res.board);
      totalGain = res.gain;
      moved = res.anyMoved;
      const translated = new Set();
      newMerged.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        // in transposed, r is col, c is row
        translated.add(`${c}-${r}`);
      });
      newMerged = translated;
    } else if (direction === 'down') {
      const t = transpose(board);
      const reversed = t.map(r => [...r].reverse());
      const res = processLeft(reversed);
      const unreversed = res.board.map(r => [...r].reverse());
      newBoard = transpose(unreversed);
      totalGain = res.gain;
      moved = res.anyMoved;
      const translated = new Set();
      newMerged.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        const origC = SIZE - 1 - c;
        translated.add(`${origC}-${r}`);
      });
      newMerged = translated;
    }

    if (!moved) {
      return false;
    }

    board = newBoard;
    lastMerged = newMerged;
    if (totalGain > 0) {
      score += totalGain;
      showScoreAdd(totalGain);
      updateScore();
    }

    addRandomTile();

    // victory check
    if (!won && !keepPlaying && board.some(row => row.includes(2048))) {
      won = true;
      // delay to let render finish
      setTimeout(() => showWin(), 300);
    }

    render();

    if (isGameOver()) {
      over = true;
      setTimeout(() => showGameOver(), 400);
    }

    return true;
  }

  function showScoreAdd(gain) {
    scoreAddEl.textContent = `+${gain}`;
    scoreAddEl.classList.remove('show');
    // force reflow
    void scoreAddEl.offsetWidth;
    scoreAddEl.classList.add('show');
    setTimeout(() => scoreAddEl.classList.remove('show'), 700);
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem('2048-best', String(best));
    }
    const count = board.flat().filter(v => v !== 0).length;
    tileCountEl.textContent = `${count} kafelków`;
  }

  function isGameOver() {
    if (getEmptyCells().length > 0) return false;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = board[r][c];
        if (c < SIZE - 1 && board[r][c + 1] === v) return false;
        if (r < SIZE - 1 && board[r + 1][c] === v) return false;
      }
    }
    return true;
  }

  function render() {
    boardEl.innerHTML = '';
    // create 16 cells with tiles
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        const val = board[r][c];
        if (val !== 0) {
          const tile = document.createElement('div');
          const cls = val > 2048 ? 'super' : String(val);
          tile.className = `tile tile-${cls}`;
          tile.textContent = val;
          const key = `${r}-${c}`;
          if (lastMerged.has(key)) tile.classList.add('merged');
          if (lastNewPos === key) tile.classList.add('new');
          cell.appendChild(tile);
        }
        boardEl.appendChild(cell);
      }
    }
    updateScore();
  }

  function showWin() {
    if (keepPlaying) return;
    winOverlay.classList.remove('hidden');
  }
  function hideWin() {
    winOverlay.classList.add('hidden');
  }
  function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
  }
  function hideGameOver() {
    gameOverOverlay.classList.add('hidden');
  }

  function initGame() {
    board = createEmptyBoard();
    score = 0;
    won = false;
    keepPlaying = false;
    over = false;
    lastMerged = new Set();
    lastNewPos = null;
    hideWin();
    hideGameOver();
    addRandomTile();
    addRandomTile();
    // clear merged/new flags for initial tiles? keep new animation for both?
    lastMerged = new Set();
    // mark both initial tiles as new? just last one currently - tweak to show both
    // For simplicity render without merged distinction
    render();
    // after render, clear new pos so next move not mistaken
    setTimeout(() => { lastNewPos = null; }, 300);
    updateScore();
  }

  // Input handling
  const keyMap = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', A: 'left', d: 'right', D: 'right', w: 'up', W: 'up', s: 'down', S: 'down'
  };

  document.addEventListener('keydown', (e) => {
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      if (winOverlay.classList.contains('hidden') || keepPlaying) {
        move(dir);
      } else {
        // if win overlay visible and not keepPlaying, block moves
      }
    }
  });

  // Touch swipe
  let startX = 0, startY = 0;
  let touchActive = false;
  boardEl.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  boardEl.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    touchActive = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 30;
    if (Math.max(absX, absY) < threshold) return;
    if (absX > absY) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, { passive: true });
  boardEl.addEventListener('touchmove', (e) => {
    // prevent scroll while swiping on board
    if (touchActive) e.preventDefault();
  }, { passive: false });

  // Buttons
  document.getElementById('newGameBtn').addEventListener('click', initGame);
  document.getElementById('winNewGameBtn').addEventListener('click', initGame);
  document.getElementById('retryBtn').addEventListener('click', initGame);
  document.getElementById('continueBtn').addEventListener('click', () => {
    keepPlaying = true;
    hideWin();
  });
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dir;
      move(d);
    });
    // also touch
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); move(btn.dataset.dir); }, { passive: false });
  });

  // Expose for testing
  window._2048 = { slideAndMergeRow, move, getBoard: () => board, setBoard: (b) => { board = b.map(r=>[...r]); render(); }, isGameOver, createEmptyBoard };

  initGame();
})();
