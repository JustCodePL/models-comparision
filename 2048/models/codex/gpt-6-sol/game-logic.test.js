const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, move, canMove, emptyCells } = require('./game-logic.js');

const stateWith = (firstRow, otherRows = []) => ({
  board: [firstRow, ...Array.from({ length: 3 }, (_, index) => otherRows[index] || [0, 0, 0, 0])],
  score: 0,
  moves: 0
});

test('a new game has two tiles worth 2 or 4 and a zero score', () => {
  const game = newGame(() => 0);
  assert.equal(game.board.flat().filter(Boolean).length, 2);
  assert.ok(game.board.flat().filter(Boolean).every((value) => value === 2 || value === 4));
  assert.equal(game.score, 0);
  assert.equal(game.moves, 0);
  assert.equal(newGame(() => 0.99).board.flat().filter(Boolean).every((value) => value === 4), true);
});

test('left movement compresses, merges once, and sums all merge points', () => {
  const cases = [
    [[2, 2, 2, 0], [4, 2, 0, 0], 4],
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[4, 4, 8, 0], [8, 8, 0, 0], 8],
    [[2, 0, 2, 2], [4, 2, 0, 0], 4],
    [[4, 0, 4, 4], [8, 4, 0, 0], 8],
    [[8, 8, 16, 16], [16, 32, 0, 0], 48],
    [[2, 2, 4, 4], [4, 8, 0, 0], 12]
  ];
  for (const [input, expected, points] of cases) {
    const result = move(stateWith(input), 'left', () => 0.99);
    assert.deepEqual(result.state.board[0], expected);
    assert.equal(result.gained, points);
    assert.equal(result.state.score, points);
    assert.equal(result.state.moves, 1);
    assert.equal(result.changed, true);
    assert.ok(result.spawned);
  }
});

test('all four directions move as far as possible', () => {
  const board = [
    [0, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  for (const [direction, row, col] of [
    ['left', 1, 0], ['right', 1, 3], ['up', 0, 1], ['down', 3, 1]
  ]) {
    const result = move({ board, score: 0, moves: 0 }, direction, () => 0.99);
    assert.equal(result.state.board[row][col], 2, direction);
    assert.equal(result.changed, true, direction);
    assert.equal(result.state.board.flat().filter(Boolean).length, 2, direction);
    assert.equal(board[1][1], 2, 'the previous state stays intact');
  }
});

test('right, up, and down merge from their respective leading edges', () => {
  const right = move(stateWith([2, 2, 2, 0]), 'right', () => 0.99);
  assert.deepEqual(right.state.board[0], [0, 0, 2, 4]);
  assert.equal(right.gained, 4);

  const vertical = {
    board: [[2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0]],
    score: 0, moves: 0
  };
  const up = move(vertical, 'up', () => 0.99);
  const down = move(vertical, 'down', () => 0.99);
  assert.deepEqual(up.state.board.map((row) => row[0]), [4, 4, 0, 0]);
  assert.deepEqual(down.state.board.map((row) => row[0]), [0, 0, 4, 4]);
  assert.equal(up.gained, 8);
  assert.equal(down.gained, 8);
});

test('a move that changes nothing does not spawn, score, or count as a turn', () => {
  const state = stateWith([2, 4, 8, 16]);
  const result = move(state, 'left', () => { throw new Error('random must not be called'); });
  assert.equal(result.changed, false);
  assert.equal(result.spawned, null);
  assert.strictEqual(result.state, state);
  assert.deepEqual(result.state.board[0], [2, 4, 8, 16]);
});

test('a valid move produces exactly one tile on an empty cell', () => {
  const initial = stateWith([2, 0, 0, 0]);
  const result = move(initial, 'right', () => 0);
  assert.equal(result.state.board.flat().filter(Boolean).length, 2);
  assert.equal(result.spawned.value, 2);
  assert.deepEqual([result.spawned.row, result.spawned.col], [0, 0]);
  assert.equal(result.state.board[0][3], 2);
  assert.equal(result.state.board[result.spawned.row][result.spawned.col], 2);
});

test('2048 is reported on creation and later moves remain available', () => {
  const result = move(stateWith([1024, 1024, 0, 0]), 'left', () => 0.99);
  assert.equal(result.reached2048, true);
  assert.equal(result.state.board[0][0], 2048);
  assert.equal(result.state.score, 2048);
  assert.equal(result.lost, false);
  assert.equal(move(result.state, 'right', () => 0.99).changed, true);
});

test('game over requires a full board without an adjacent equal pair', () => {
  const blocked = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2]
  ];
  assert.equal(canMove(blocked), false);
  const result = move({ board: blocked, score: 10, moves: 5 }, 'left');
  assert.equal(result.changed, false);
  assert.equal(result.lost, true);
  const withPair = blocked.map((row) => row.slice());
  withPair[0][1] = 2;
  assert.equal(canMove(withPair), true);
  const withSpace = blocked.map((row) => row.slice());
  withSpace[0][1] = 0;
  assert.equal(canMove(withSpace), true);
});

test('many rapid moves preserve 16 cells, powers of two, and tile sum', () => {
  let state = newGame(() => 0);
  const directions = ['left', 'up', 'right', 'down'];
  for (let i = 0; i < 500; i += 1) {
    const previousSum = state.board.flat().reduce((sum, value) => sum + value, 0);
    const result = move(state, directions[i % 4], () => 0.2);
    state = result.state;
    assert.equal(state.board.flat().length, 16);
    assert.ok(state.board.flat().every((value) => value === 0 || Number.isInteger(Math.log2(value))));
    assert.equal(state.board.flat().reduce((sum, value) => sum + value, 0), previousSum + (result.changed ? result.spawned.value : 0));
    assert.equal(emptyCells(state.board).length + state.board.flat().filter(Boolean).length, 16);
  }
});
