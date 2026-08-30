/*
 * 2048 — czysta logika gry (bez zależności od DOM).
 * Plansza 4x4, kafelki jako obiekty { id, value, row, col }.
 * Plik działa zarówno w przeglądarce (globalne funkcje),
 * jak i w Node.js (module.exports) na potrzeby testów.
 */
'use strict';

var SIZE = 4;
var WIN_VALUE = 2048;

var DIRECTIONS = ['up', 'down', 'left', 'right'];

function createEmptyGrid() {
  var grid = [];
  for (var r = 0; r < SIZE; r++) {
    grid.push(new Array(SIZE).fill(null));
  }
  return grid;
}

/** Pusty stan gry (bez kafelków) — przydatny też w testach. */
function createEmptyState(rng) {
  return {
    grid: createEmptyGrid(),
    score: 0,
    won: false,
    over: false,
    nextTileId: 1,
    rng: typeof rng === 'function' ? rng : Math.random
  };
}

/** Nowa gra: pusta plansza + dwa losowe kafelki. */
function createGame(rng) {
  var state = createEmptyState(rng);
  addRandomTile(state);
  addRandomTile(state);
  return state;
}

function emptyCells(state) {
  var cells = [];
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (!state.grid[r][c]) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/** Dodaje kafelek (90% -> 2, 10% -> 4) na losowym pustym polu. */
function addRandomTile(state) {
  var cells = emptyCells(state);
  if (cells.length === 0) return null;
  var cell = cells[Math.floor(state.rng() * cells.length)];
  var value = state.rng() < 0.9 ? 2 : 4;
  var tile = { id: state.nextTileId++, value: value, row: cell.row, col: cell.col };
  state.grid[cell.row][cell.col] = tile;
  return tile;
}

/**
 * Zwraca 4 linie (po 4 pola) uporządkowane od krawędzi,
 * w którą stronę przesuwane są kafelki.
 */
function lineCells(direction) {
  var lines = [];
  for (var i = 0; i < SIZE; i++) {
    var line = [];
    for (var j = 0; j < SIZE; j++) {
      switch (direction) {
        case 'left':  line.push({ row: i, col: j }); break;
        case 'right': line.push({ row: i, col: SIZE - 1 - j }); break;
        case 'up':    line.push({ row: j, col: i }); break;
        case 'down':  line.push({ row: SIZE - 1 - j, col: i }); break;
        default: throw new Error('Nieznany kierunek: ' + direction);
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Wykonuje ruch. Mutuje stan tylko gdy ruch cokolwiek zmienia.
 * Zwraca:
 * {
 *   moved: boolean,
 *   gained: number,                 // punkty zdobyte w tym ruchu
 *   movements: [{ id, from, to, consumed }],
 *   merges: [{ keepId, removeId, row, col, value }],
 *   spawned: tile | undefined       // nowy kafelek (tylko gdy moved)
 * }
 */
function move(state, direction) {
  var result = { moved: false, gained: 0, movements: [], merges: [] };
  if (state.over) return result;

  var newGrid = createEmptyGrid();

  var lines = lineCells(direction);
  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];

    // kafelki w linii, w kolejności od krawędzi docelowej
    var tiles = [];
    for (var k = 0; k < line.length; k++) {
      var t = state.grid[line[k].row][line[k].col];
      if (t) tiles.push(t);
    }

    var target = 0;      // indeks następnego wolnego pola w linii
    var last = null;     // ostatni położony kafelek

    for (var ti = 0; ti < tiles.length; ti++) {
      var tile = tiles[ti];

      if (last && !last.mergedThisMove && last.value === tile.value) {
        // Łączenie: kafelek wchodzi w skład "last".
        // "last" w tym ruchu już nie może łączyć się ponownie.
        var dest = line[target - 1];
        last.value *= 2;
        last.mergedThisMove = true;
        result.gained += last.value;
        result.moved = true;
        result.movements.push({
          id: tile.id,
          from: { row: tile.row, col: tile.col },
          to: { row: dest.row, col: dest.col },
          consumed: true
        });
        result.merges.push({
          keepId: last.id,
          removeId: tile.id,
          row: dest.row,
          col: dest.col,
          value: last.value
        });
      } else {
        var cell = line[target];
        if (cell.row !== tile.row || cell.col !== tile.col) {
          result.moved = true;
          result.movements.push({
            id: tile.id,
            from: { row: tile.row, col: tile.col },
            to: { row: cell.row, col: cell.col },
            consumed: false
          });
        }
        tile.row = cell.row;
        tile.col = cell.col;
        newGrid[cell.row][cell.col] = tile;
        last = tile;
        target++;
      }
    }
  }

  if (!result.moved) return result; // stan planszy bez zmian

  state.grid = newGrid;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var tl = state.grid[r][c];
      if (tl) delete tl.mergedThisMove;
    }
  }

  state.score += result.gained;

  if (!state.won && hasValue(state, WIN_VALUE)) {
    state.won = true;
  }

  result.spawned = addRandomTile(state) || undefined;

  if (!movesAvailable(state)) {
    state.over = true;
  }

  return result;
}

function hasValue(state, value) {
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var t = state.grid[r][c];
      if (t && t.value >= value) return true;
    }
  }
  return false;
}

/** Czy istnieje jakikolwiek legalny ruch (puste pole albo para sąsiadów)? */
function movesAvailable(state) {
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var t = state.grid[r][c];
      if (!t) return true;
      if (c + 1 < SIZE) {
        var right = state.grid[r][c + 1];
        if (right && right.value === t.value) return true;
      }
      if (r + 1 < SIZE) {
        var down = state.grid[r + 1][c];
        if (down && down.value === t.value) return true;
      }
    }
  }
  return false;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SIZE: SIZE,
    WIN_VALUE: WIN_VALUE,
    DIRECTIONS: DIRECTIONS,
    createEmptyState: createEmptyState,
    createGame: createGame,
    addRandomTile: addRandomTile,
    move: move,
    movesAvailable: movesAvailable,
    emptyCells: emptyCells
  };
}
