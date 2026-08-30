/*
 * 2048 · Neon — warstwa UI (DOM, animacje, sterowanie).
 * Cała logika gry znajduje się w js/logic.js.
 */
/* global SIZE, createGame, move */
(function () {
  'use strict';

  var SLIDE_MS = 120;            // zgodne z transition w CSS
  var BEST_KEY = 'neon-2048-best';
  var SWIPE_MIN_PX = 24;

  var boardEl = document.getElementById('board');
  var cellsEl = document.getElementById('cells');
  var tilesEl = document.getElementById('tiles');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var scoreBoxEl = document.getElementById('score-box');
  var winOverlay = document.getElementById('win-overlay');
  var overOverlay = document.getElementById('over-overlay');
  var finalScoreEl = document.getElementById('final-score');

  var state = null;
  var tileEls = new Map(); // id kafelka -> element DOM
  var best = loadBest();
  var winAcknowledged = false; // true po wybraniu "Graj dalej"

  /* ---------------- rekord ---------------- */

  function loadBest() {
    try {
      return Number(window.localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch (e) { /* np. tryb prywatny — pomijamy */ }
  }

  /* ---------------- geometria planszy ---------------- */

  function metrics() {
    var size = boardEl.clientWidth;
    var gap = Math.max(8, Math.round(size * 0.022));
    var cell = (size - gap * (SIZE + 1)) / SIZE;
    return { size: size, gap: gap, cell: cell };
  }

  function place(el, row, col, m) {
    m = m || metrics();
    el.style.width = m.cell + 'px';
    el.style.height = m.cell + 'px';
    el.style.transform =
      'translate(' + (m.gap + col * (m.cell + m.gap)) + 'px,' +
                      (m.gap + row * (m.cell + m.gap)) + 'px)';
  }

  /** Repozycjonuje wszystkie kafelki (np. po resize) i ustawia zmienne CSS. */
  function layout() {
    if (!state) return;
    var m = metrics();
    boardEl.style.setProperty('--gap', m.gap + 'px');
    boardEl.style.setProperty('--cell', m.cell + 'px');
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var t = state.grid[r][c];
        if (t) {
          var el = tileEls.get(t.id);
          if (el) place(el, r, c, m);
        }
      }
    }
  }

  /* ---------------- kafelki w DOM ---------------- */

  function valueClass(value) {
    return value <= 2048 ? 'tile-v' + value : 'tile-super';
  }

  function digitsClass(value) {
    return 'digits-' + Math.min(String(value).length, 6);
  }

  function innerClass(value) {
    return 'tile-inner ' + valueClass(value) + ' ' + digitsClass(value);
  }

  function createTileEl(tile, withAppearAnim) {
    var el = document.createElement('div');
    el.className = 'tile';
    var inner = document.createElement('div');
    inner.className = innerClass(tile.value);
    inner.textContent = tile.value;
    if (withAppearAnim) inner.classList.add('anim-appear');
    el.appendChild(inner);
    place(el, tile.row, tile.col);
    tileEls.set(tile.id, el);
    tilesEl.appendChild(el);
    return el;
  }

  function refreshTileEl(tile) {
    var el = tileEls.get(tile.id);
    if (!el) return;
    var inner = el.firstChild;
    inner.textContent = tile.value;
    inner.className = innerClass(tile.value);
  }

  function findTile(id) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var t = state.grid[r][c];
        if (t && t.id === id) return t;
      }
    }
    return null;
  }

  /* ---------------- wynik ---------------- */

  function updateScore(gained) {
    scoreEl.textContent = state.score;
    if (state.score > best) {
      best = state.score;
      bestEl.textContent = best;
      saveBest();
    }
    if (gained > 0) {
      var float = document.createElement('span');
      float.className = 'score-float';
      float.textContent = '+' + gained;
      scoreBoxEl.appendChild(float);
      setTimeout(function () { float.remove(); }, 700);
    }
  }

  /* ---------------- nakładki ---------------- */

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  /* ---------------- ruch ---------------- */

  function handleMove(direction) {
    if (!state || state.over) return;
    if (state.won && !winAcknowledged) return; // czekamy na decyzję gracza

    var result = move(state, direction);

    if (!result.moved) {
      // ruch niczego nie zmienił — potrząśnięcie, brak nowego kafelka
      boardEl.classList.remove('shake');
      void boardEl.offsetWidth; // restart animacji
      boardEl.classList.add('shake');
      return;
    }

    // 1) przesunięcia (animuje transition w CSS)
    result.movements.forEach(function (mv) {
      var el = tileEls.get(mv.id);
      if (!el) return;
      if (mv.consumed) el.style.zIndex = '1'; // połknięty kafelek pod spodem
      place(el, mv.to.row, mv.to.col);
    });

    // 2) połączenia — aktualizacja po zakończeniu przesuwu
    result.merges.forEach(function (merge) {
      var removeEl = tileEls.get(merge.removeId);
      var keepEl = tileEls.get(merge.keepId);
      var keepTile = findTile(merge.keepId);
      setTimeout(function () {
        if (removeEl) {
          removeEl.remove();
          tileEls.delete(merge.removeId);
        }
        if (keepEl && keepTile) {
          // czytamy aktualną wartość z modelu — odporne na szybkie ruchy
          refreshTileEl(keepTile);
          var inner = keepEl.firstChild;
          inner.classList.remove('anim-pop');
          void inner.offsetWidth;
          inner.classList.add('anim-pop');
        }
      }, SLIDE_MS);
    });

    // 3) nowy kafelek
    if (result.spawned) createTileEl(result.spawned, true);

    // 4) wynik
    updateScore(result.gained);

    // 5) wygrana / przegrana
    if (state.won && !winAcknowledged) {
      show(winOverlay);
    } else if (state.over) {
      finalScoreEl.textContent = state.score;
      show(overOverlay);
    }
  }

  /* ---------------- nowa gra ---------------- */

  function newGame() {
    tileEls.clear();
    tilesEl.innerHTML = '';
    state = createGame();
    winAcknowledged = false;
    hide(winOverlay);
    hide(overOverlay);
    bestEl.textContent = best;
    updateScore(0);
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var t = state.grid[r][c];
        if (t) createTileEl(t, true);
      }
    }
    layout();
  }

  /* ---------------- klawiatura ---------------- */

  var KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', a: 'left', s: 'down', d: 'right',
    W: 'up', A: 'left', S: 'down', D: 'right'
  };

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var dir = KEYMAP[e.key];
    if (!dir) return;
    e.preventDefault();
    handleMove(dir);
  });

  /* ---------------- dotyk (swipe) ---------------- */

  var touchStart = null;

  boardEl.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  boardEl.addEventListener('touchmove', function (e) {
    e.preventDefault(); // brak scrollowania strony podczas gry
  }, { passive: false });

  boardEl.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;
    var dir = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');
    handleMove(dir);
  });

  /* ---------------- przyciski ---------------- */

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('win-new-game').addEventListener('click', newGame);
  document.getElementById('retry').addEventListener('click', newGame);
  document.getElementById('keep-going').addEventListener('click', function () {
    winAcknowledged = true;
    hide(winOverlay);
  });

  /* ---------------- start ---------------- */

  for (var i = 0; i < SIZE * SIZE; i++) {
    var cellEl = document.createElement('div');
    cellEl.className = 'cell';
    cellsEl.appendChild(cellEl);
  }

  window.addEventListener('resize', layout);

  newGame();
})();
