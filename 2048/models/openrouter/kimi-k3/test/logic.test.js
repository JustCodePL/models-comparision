/*
 * Testy logiki gry 2048 — uruchomienie: node test/logic.test.js
 */
'use strict';

const assert = require('assert');
const logic = require('../js/logic.js');

/* ---------- pomocnicze ---------- */

// Deterministyczny RNG z podanej sekwencji (po wyczerpaniu powtarza ostatnią).
function seqRng(values) {
  let i = 0;
  return function () {
    return values[Math.min(i++, values.length - 1)];
  };
}

// Liniowy generator kongruencyjny — powtarzalne "losowe" symulacje.
function lcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Buduje stan gry z macierzy liczb (0 = puste pole).
function stateFromRows(rows, rng) {
  const state = logic.createEmptyState(rng || seqRng([0.0]));
  for (let r = 0; r < logic.SIZE; r++) {
    for (let c = 0; c < logic.SIZE; c++) {
      const v = rows[r][c];
      if (v !== 0) {
        state.grid[r][c] = { id: state.nextTileId++, value: v, row: r, col: c };
      }
    }
  }
  return state;
}

function toMatrix(state) {
  return state.grid.map((row) => row.map((t) => (t ? t.value : 0)));
}

function countTiles(state) {
  let n = 0;
  for (const row of state.grid) for (const t of row) if (t) n++;
  return n;
}

// Spójność: pozycje kafelków zgadzają się z siatką, wartości to potęgi 2, brak duplikatów.
function assertConsistent(state) {
  const ids = new Set();
  for (let r = 0; r < logic.SIZE; r++) {
    for (let c = 0; c < logic.SIZE; c++) {
      const t = state.grid[r][c];
      if (!t) continue;
      assert.ok(!ids.has(t.id), 'zdublowane id kafelka');
      ids.add(t.id);
      assert.strictEqual(t.row, r);
      assert.strictEqual(t.col, c);
      assert.ok(t.value >= 2 && (t.value & (t.value - 1)) === 0, 'wartość nie jest potęgą 2');
    }
  }
}

// Usuwa świeżo dodany kafelek — przy porównaniach układu nie interesuje nas spawn.
function stripSpawn(state, res) {
  if (res && res.spawned) state.grid[res.spawned.row][res.spawned.col] = null;
}

// Wykonuje ruch w lewo na planszy z jednym wierszem; zwraca pełny wynik.
function moveRowLeft(row) {
  const state = stateFromRows([row, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const res = logic.move(state, 'left');
  stripSpawn(state, res);
  return { res, state, row: toMatrix(state)[0] };
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('  ok -', name);
}

/* ---------- przypadki z treści zadania (ruch w lewo) ---------- */

test('[2,2,2,0] w lewo -> [4,2,0,0]', () => {
  assert.deepStrictEqual(moveRowLeft([2, 2, 2, 0]).row, [4, 2, 0, 0]);
});

test('[2,2,2,2] w lewo -> [4,4,0,0] (brak łańcuchowego łączenia)', () => {
  assert.deepStrictEqual(moveRowLeft([2, 2, 2, 2]).row, [4, 4, 0, 0]);
});

test('[4,4,8,0] w lewo -> [8,8,0,0] (nowe 8 nie łączy się ponownie)', () => {
  assert.deepStrictEqual(moveRowLeft([4, 4, 8, 0]).row, [8, 8, 0, 0]);
});

test('[2,0,2,2] w lewo -> [4,2,0,0]', () => {
  assert.deepStrictEqual(moveRowLeft([2, 0, 2, 2]).row, [4, 2, 0, 0]);
});

test('[4,0,4,4] w lewo -> [8,4,0,0]', () => {
  assert.deepStrictEqual(moveRowLeft([4, 0, 4, 4]).row, [8, 4, 0, 0]);
});

test('[8,8,16,16] w lewo -> [16,32,0,0]', () => {
  assert.deepStrictEqual(moveRowLeft([8, 8, 16, 16]).row, [16, 32, 0, 0]);
});

test('[2,4,8,16] w lewo -> bez zmian, moved=false, brak nowego kafelka', () => {
  const { res, state, row } = moveRowLeft([2, 4, 8, 16]);
  assert.deepStrictEqual(row, [2, 4, 8, 16]);
  assert.strictEqual(res.moved, false);
  assert.strictEqual(res.spawned, undefined);
  assert.strictEqual(countTiles(state), 4);
});

/* ---------- pozostałe kierunki ---------- */

test('[2,2,2,2] w prawo -> [0,0,4,4]', () => {
  const state = stateFromRows([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const res = logic.move(state, 'right');
  stripSpawn(state, res);
  assert.deepStrictEqual(toMatrix(state)[0], [0, 0, 4, 4]);
});

test('kolumna [2,0,2,2] w górę -> [4,2,0,0]', () => {
  const state = stateFromRows([[2, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0]]);
  const res = logic.move(state, 'up');
  stripSpawn(state, res);
  assert.deepStrictEqual(toMatrix(state).map((r) => r[0]), [4, 2, 0, 0]);
});

test('kolumna [2,2,2,0] w dół -> [0,0,2,4] (łączą się dolne, bliższe kierunku)', () => {
  const state = stateFromRows([[2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0]]);
  const res = logic.move(state, 'down');
  stripSpawn(state, res);
  assert.deepStrictEqual(toMatrix(state).map((r) => r[0]), [0, 0, 2, 4]);
});

/* ---------- stan początkowy ---------- */

test('nowa gra: dokładnie 2 kafelki o wartości 2 lub 4 na różnych polach', () => {
  const state = logic.createGame(lcg(42));
  assert.strictEqual(countTiles(state), 2);
  assertConsistent(state);
  const values = toMatrix(state).flat().filter((v) => v !== 0);
  assert.ok(values.every((v) => v === 2 || v === 4));
  assert.strictEqual(state.score, 0);
  assert.strictEqual(state.won, false);
  assert.strictEqual(state.over, false);
});

test('spawn: 10% czwórek przy wielu losowaniach (granicznie, seedowany RNG)', () => {
  const rng = lcg(7);
  const state = logic.createEmptyState(rng);
  let fours = 0;
  const N = 5000;
  for (let i = 0; i < N; i++) {
    // czyścimy jedno pole, żeby było gdzie dostawić kafelek
    state.grid[0][0] = null;
    const t = logic.addRandomTile(state);
    if (t.value === 4) fours++;
  }
  const ratio = fours / N;
  assert.ok(ratio > 0.07 && ratio < 0.13, 'proporcja 4-ek poza zakresem: ' + ratio);
});

/* ---------- nowe kafelki po ruchu ---------- */

test('po poprawnym ruchu pojawia się dokładnie 1 nowy kafelek', () => {
  const state = stateFromRows([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const res = logic.move(state, 'left');
  assert.strictEqual(res.moved, true);
  assert.ok(res.spawned);
  // 4 kafelki - 2 połączone + 1 nowy = 3
  assert.strictEqual(countTiles(state), 3);
  assertConsistent(state);
});

/* ---------- punktacja ---------- */

test('[2,2,4,4] w lewo daje 4 + 8 = 12 punktów', () => {
  const state = stateFromRows([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const res = logic.move(state, 'left');
  assert.strictEqual(res.gained, 12);
  assert.strictEqual(state.score, 12);
});

test('punkty sumują się między ruchami', () => {
  // rng: pierwszy spawn trafia w środek planszy (indeks 6 -> (1,2)), wartość 2
  const state = stateFromRows([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    seqRng([0.5, 0.0, 0.0, 0.0]));
  logic.move(state, 'left'); // +4
  assert.strictEqual(state.score, 4);
  state.grid[0][3] = { id: state.nextTileId++, value: 4, row: 0, col: 3 };
  logic.move(state, 'right'); // 4 + 4 -> 8, czyli +8
  assert.strictEqual(state.score, 12);
});

/* ---------- wygrana ---------- */

test('1024 + 1024 -> won=true, kafelek 2048 na planszy', () => {
  const state = stateFromRows([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  logic.move(state, 'left');
  assert.strictEqual(state.won, true);
  assert.ok(toMatrix(state).flat().includes(2048));
});

test('po wygranej można grać dalej (logika nie blokuje ruchów)', () => {
  const state = stateFromRows([[1024, 1024, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  logic.move(state, 'left');
  assert.strictEqual(state.won, true);
  const res = logic.move(state, 'right');
  assert.strictEqual(res.moved, true);
  assert.strictEqual(state.over, false);
});

/* ---------- przegrana ---------- */

test('pełna plansza bez par sąsiadów -> brak ruchów', () => {
  const state = stateFromRows([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2]
  ]);
  assert.strictEqual(logic.movesAvailable(state), false);
});

test('pełna plansza z parą sąsiadów -> ruchy nadal możliwe', () => {
  const state = stateFromRows([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 4]
  ]);
  assert.strictEqual(logic.movesAvailable(state), true);
});

test('gra ustawia over=true, gdy po ruchu i spawnie nie ma ruchów', () => {
  // Jedno puste pole (3,0). Ruch w dół przesuwa kolumnę 0 bez łączeń,
  // a spawn (rng: pierwsza wolna komórka = (0,0), wartość 2) zapełnia planszę
  // układem bez żadnej pary sąsiadów.
  const state = stateFromRows([
    [16, 4, 8, 16],
    [2, 2, 4, 8],
    [4, 16, 2, 4],
    [0, 8, 16, 2]
  ], seqRng([0.0, 0.0]));
  const res = logic.move(state, 'down');
  assert.strictEqual(res.moved, true);
  assert.strictEqual(res.gained, 0);
  assert.deepStrictEqual(toMatrix(state), [
    [2, 4, 8, 16],
    [16, 2, 4, 8],
    [2, 16, 2, 4],
    [4, 8, 16, 2]
  ]);
  assert.strictEqual(countTiles(state), 16);
  assert.strictEqual(logic.movesAvailable(state), false);
  assert.strictEqual(state.over, true);
});

test('po przegranej move() niczego nie zmienia', () => {
  const state = stateFromRows([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2]
  ]);
  state.over = true;
  const before = JSON.stringify(toMatrix(state));
  const res = logic.move(state, 'left');
  assert.strictEqual(res.moved, false);
  assert.strictEqual(JSON.stringify(toMatrix(state)), before);
});

/* ---------- symulacje pełnych gier (odporność na szybkie ruchy) ---------- */

test('30 losowych gier: spójność stanu, poprawna liczba kafelków, koniec gry', () => {
  for (let g = 0; g < 30; g++) {
    const state = logic.createGame(lcg(g + 1));
    let steps = 0;
    while (!state.over && steps < 100000) {
      const dir = logic.DIRECTIONS[Math.floor(state.rng() * 4)];
      const before = countTiles(state);
      const res = logic.move(state, dir);
      if (res.moved) {
        assert.strictEqual(
          countTiles(state),
          before - res.merges.length + 1,
          'nieprawidłowa liczba kafelków po ruchu'
        );
        assert.strictEqual(
          res.gained,
          res.merges.reduce((s, m) => s + m.value, 0),
          'gained != suma połączeń'
        );
        assert.ok(res.spawned && (res.spawned.value === 2 || res.spawned.value === 4));
        assertConsistent(state);
      }
      steps++;
    }
    assert.ok(state.over, 'gra powinna się zakończyć');
    assert.strictEqual(countTiles(state), 16);
    assert.strictEqual(logic.movesAvailable(state), false);
    assertConsistent(state);
  }
});

console.log('\nWszystkie testy przeszły:', passed);
