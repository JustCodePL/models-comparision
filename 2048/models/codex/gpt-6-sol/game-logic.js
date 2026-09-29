(function (root) {
  "use strict";

  const SIZE = 4;
  const DIRECTIONS = new Set(["left", "right", "up", "down"]);

  function emptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function copyBoard(board) {
    return board.map((row) => row.slice());
  }

  function emptyCells(board) {
    const cells = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row][col] === 0) cells.push({ row, col });
      }
    }
    return cells;
  }

  function spawnTile(board, random = Math.random) {
    const cells = emptyCells(board);
    if (cells.length === 0) return null;
    const index = Math.min(cells.length - 1, Math.floor(random() * cells.length));
    const cell = cells[index];
    board[cell.row][cell.col] = random() < 0.9 ? 2 : 4;
    return { ...cell, value: board[cell.row][cell.col] };
  }

  function newGame(random = Math.random) {
    const board = emptyBoard();
    spawnTile(board, random);
    spawnTile(board, random);
    return { board, score: 0, moves: 0 };
  }

  function canMove(board) {
    if (emptyCells(board).length > 0) return true;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const value = board[row][col];
        if (col + 1 < SIZE && value === board[row][col + 1]) return true;
        if (row + 1 < SIZE && value === board[row + 1][col]) return true;
      }
    }
    return false;
  }

  function lineCoordinates(direction, line) {
    return Array.from({ length: SIZE }, (_, index) => {
      if (direction === "left") return { row: line, col: index };
      if (direction === "right") return { row: line, col: SIZE - 1 - index };
      if (direction === "up") return { row: index, col: line };
      return { row: SIZE - 1 - index, col: line };
    });
  }

  function move(state, direction, random = Math.random) {
    if (!DIRECTIONS.has(direction)) throw new Error(`Unknown direction: ${direction}`);

    const board = emptyBoard();
    const merged = [];
    let gained = 0;
    let reached2048 = false;

    for (let line = 0; line < SIZE; line += 1) {
      const coordinates = lineCoordinates(direction, line);
      const values = coordinates.map(({ row, col }) => state.board[row][col]).filter(Boolean);
      let target = 0;

      for (let source = 0; source < values.length; source += 1) {
        let value = values[source];
        if (source + 1 < values.length && value === values[source + 1]) {
          value *= 2;
          gained += value;
          if (value === 2048) reached2048 = true;
          merged.push(coordinates[target]);
          source += 1;
        }
        const { row, col } = coordinates[target];
        board[row][col] = value;
        target += 1;
      }
    }

    const changed = board.some((row, r) => row.some((value, c) => value !== state.board[r][c]));
    if (!changed) {
      return { state, changed: false, gained: 0, merged: [], spawned: null, reached2048: false, lost: !canMove(state.board) };
    }

    const spawned = spawnTile(board, random);
    const nextState = { board, score: state.score + gained, moves: state.moves + 1 };
    return { state: nextState, changed: true, gained, merged, spawned, reached2048, lost: !canMove(board) };
  }

  const api = { SIZE, emptyBoard, copyBoard, emptyCells, spawnTile, newGame, canMove, move };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Game2048 = api;
})(typeof window !== "undefined" ? window : globalThis);
