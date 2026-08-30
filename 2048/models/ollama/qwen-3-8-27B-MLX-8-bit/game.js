"use strict";

(() => {
  const SIZE = 4;
  const POS_PCT = [5, 28.75, 52.5, 76.25];
  const BEST_KEY = "neon2048-best";
  const SLIDE_MS = 110;

  const DIRS = {
    up:    { dr: -1, dc: 0 },
    down:  { dr: 1,  dc: 0 },
    left:  { dr: 0,  dc: -1 },
    right: { dr: 0,  dc: 1 },
  };

  let grid;          // 4x4 -> tile objects | null
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;
  let wonShown = false;
  let over = false;
  let kind = "lose";
  let tileSeq = 0;
  let gen = 0;       // guards stale DOM callbacks after restart

  const boardEl = document.getElementById("board");
  const wrapEl = document.getElementById("board-wrap");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const deltaEl = document.getElementById("score-delta");
  const overlayEl = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const continueBtn = document.getElementById("overlay-continue");
  const restartBtn = document.getElementById("overlay-restart");

  /* ---------------- sound (WebAudio, very quiet) ---------------- */

  let audioCtx = null;
  let soundOn = true;

  function beep(freq, dur = 0.05, gain = 0.03, type = "sine") {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (_) { /* audio unavailable */ }
  }

  /* ---------------- board / rendering ---------------- */

  function makeCellClass(v) {
    return v > 2048 ? "tile-vbig" : "tile-v" + v;
  }

  function createTileEl(tile) {
    const el = document.createElement("div");
    el.className = "tile tile-v" + tile.value;
    el.dataset.v = tile.value;
    el.innerHTML = '<span class="inner"></span>';
    el.querySelector(".inner").textContent = tile.value;
    positionEl(el, tile.row, tile.col);
    boardEl.appendChild(el);
    tile.el = el;
    return el;
  }

  function positionEl(el, row, col) {
    el.style.left = POS_PCT[col] + "%";
    el.style.top = POS_PCT[row] + "%";
  }

  function setTileElValue(tile) {
    const el = tile.el;
    el.dataset.v = tile.value;
    el.className = "tile " + makeCellClass(tile.value);
    el.querySelector(".inner").textContent = tile.value;
  }

  function buildCells() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.left = POS_PCT[c] + "%";
        cell.style.top = POS_PCT[r] + "%";
        boardEl.appendChild(cell);
      }
    }
  }

  function updateScoreDisplay(delta) {
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem(BEST_KEY, String(best));
    }
    if (delta > 0) {
      deltaEl.textContent = "+" + delta;
      deltaEl.classList.remove("animate");
      void deltaEl.offsetWidth;
      deltaEl.classList.add("animate");
    }
  }

  /* ---------------- game logic ---------------- */

  function emptyCells() {
    const out = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (!grid[r][c]) out.push([r, c]);
    return out;
  }

  function spawnTile() {
    const cells = emptyCells();
    if (!cells.length) return null;
    const [r, c] = cells[(Math.random() * cells.length) | 0];
    const value = Math.random() < 0.9 ? 2 : 4;
    const tile = { id: ++tileSeq, value, row: r, col: c, el: null };
    grid[r][c] = tile;
    const el = createTileEl(tile);
    el.classList.add("spawn");
    const g = gen;
    setTimeout(() => { if (g === gen) el.classList.remove("spawn"); }, 180);
    return tile;
  }

  function restartPopAnimation(tile) {
    const el = tile.el;
    el.classList.remove("merged");
    void el.offsetWidth;
    el.classList.add("merged");
    const g = gen;
    setTimeout(() => { if (g === gen) el.classList.remove("merged"); }, 220);
  }

  /**
   * Computes a move in-place on `grid`.
   * Returns { moved, gained, merged, removed, wonNow }
   */
  function computeMove(dir) {
    const { dr, dc } = DIRS[dir];
    let moved = false;
    let gained = 0;
    let wonNow = false;
    const removed = [];
    const merged = [];

    const starts = [];
    for (let i = 0; i < SIZE; i++) {
      starts.push(
        dr === -1 ? [0, i] :
        dr === 1  ? [SIZE - 1, i] :
        dc === -1 ? [i, 0] :
                    [i, SIZE - 1]
      );
    }

    for (const [sr, sc] of starts) {
      let slot = 0;              // next free slot in this line (from the edge)
      let last = null;           // last surviving tile placed in this line
      let lastMerged = false;
      for (let k = 0; k < SIZE; k++) {
        // walk from the target edge inward (opposite of the move direction)
        const r = sr - dr * k;
        const c = sc - dc * k;
        const tile = grid[r][c];
        if (!tile) continue;

        if (last && !lastMerged && last.value === tile.value) {
          // merge into `last` — at most once per line per move
          last.value *= 2;
          last.mergedNow = true;
          merged.push(last);
          tile._target = last._target;
          removed.push(tile);
          gained += last.value;
          if (last.value === 2048) wonNow = true;
          lastMerged = true;
          moved = true;
        } else {
          const tr = sr - dr * slot;
          const tc = sc - dc * slot;
          if (tr !== r || tc !== c) moved = true;
          tile._target = { r: tr, c: tc };
          last = tile;
          lastMerged = false;
          slot++;
        }
      }
    }

    // rebuild grid with new positions
    const ng = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (t && !removed.includes(t)) {
          t.row = t._target.r;
          t.col = t._target.c;
          ng[t.row][t.col] = t;
        }
      }
    }
    grid = ng;

    return { moved, gained, merged, removed, wonNow };
  }

  function renderMove(result) {
    // slide removed tiles on top of their merge target, then remove them
    for (const t of result.removed) {
      positionEl(t.el, t._target.r, t._target.c);
      const el = t.el;
      setTimeout(() => el.remove(), SLIDE_MS + 20);
    }
    // update survivors
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (!t) continue;
        positionEl(t.el, r, c);
        if (t.mergedNow) {
          setTileElValue(t);
          restartPopAnimation(t);
          delete t.mergedNow;
        }
      }
    }
  }

  function hasMoves() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (!t) return true;
        if (c + 1 < SIZE && grid[r][c + 1] && grid[r][c + 1].value === t.value) return true;
        if (r + 1 < SIZE && grid[r + 1][c] && grid[r + 1][c].value === t.value) return true;
      }
    }
    return false;
  }

  function showOverlay(overlayKind, continueVisible) {
    overlayEl.classList.remove("hidden");
    overlayTitle.classList.toggle("win", overlayKind === "win");
    kind = overlayKind;
    if (overlayKind === "win") {
      overlayTitle.textContent = "2048!";
      overlayText.textContent = "Udało Ci się! Możesz dalej grać.";
    } else {
      overlayTitle.textContent = "Koniec gry";
      overlayText.textContent = "Brak możliwych ruchów. Wynik: " + score;
    }
    continueBtn.style.display = continueVisible ? "" : "none";
  }

  function doMove(dir) {
    if (over) return;
    if (!overlayEl.classList.contains("hidden")) {
      if (kind === "win") hideOverlay(); // keep playing
      else return;
    }
    const result = computeMove(dir);
    if (!result.moved) {
      wrapEl.classList.remove("shake");
      void wrapEl.offsetWidth;
      wrapEl.classList.add("shake");
      return;
    }

    score += result.gained;
    renderMove(result);
    updateScoreDisplay(result.gained);
    spawnTile();

    if (result.wonNow && !wonShown) {
      wonShown = true;
      beep(880, 0.18, 0.05);
      setTimeout(() => beep(1320, 0.25, 0.05), 140);
      showOverlay("win", true);
    } else if (!hasMoves()) {
      over = true;
      beep(180, 0.25, 0.05, "triangle");
      setTimeout(() => showOverlay("lose", false), SLIDE_MS + 120);
    }
  }

  function hideOverlay() { overlayEl.classList.add("hidden"); }

  function newGame() {
    gen++;
    over = false;
    wonShown = false;
    score = 0;
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    boardEl.querySelectorAll(".tile").forEach(el => el.remove());
    hideOverlay();
    updateScoreDisplay(0);
    spawnTile();
    spawnTile();
  }

  /* ---------------- input ---------------- */

  const KEYMAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right",
  };

  document.addEventListener("keydown", (e) => {
    const dir = KEYMAP[e.key];
    if (!dir) return;
    e.preventDefault();
    doMove(dir);
  });

  // touch swipe
  let touchStart = null;
  wrapEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  wrapEl.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  }, { passive: true });

  document.getElementById("new-game").addEventListener("click", newGame);
  restartBtn.addEventListener("click", newGame);
  continueBtn.addEventListener("click", () => {
    if (kind === "win") hideOverlay();
  });

  const soundBtn = document.getElementById("sound");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      soundOn = !soundOn;
      soundBtn.textContent = "DŹWIĘK: " + (soundOn ? "WŁ" : "WYŁ");
    });
  }

  /* ---------------- init ---------------- */

  buildCells();
  bestEl.textContent = best;
  newGame();
})();
