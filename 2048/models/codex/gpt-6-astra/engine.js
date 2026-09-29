/* Pure game rules. No DOM, timers, or animation state. */
(function (root) {
  'use strict';
  const SIZE = 4;
  function collapse(line) {
    const values = line.filter(Boolean), result = [], merged = [];
    let score = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const value = values[i] * 2;
        merged.push(result.length);
        result.push(value);
        score += value;
        i++;
      } else result.push(values[i]);
    }
    return { line: [...result, ...Array(SIZE - result.length).fill(0)], score, merged };
  }
  function slide(board, direction) {
    if (!['left', 'right', 'up', 'down'].includes(direction)) throw new Error('Unknown direction');
    const next = board.slice(), merged = [];
    let score = 0;
    for (let lane = 0; lane < SIZE; lane++) {
      const indices = Array.from({ length: SIZE }, (_, n) => {
        const position = direction === 'right' || direction === 'down' ? SIZE - 1 - n : n;
        return direction === 'left' || direction === 'right' ? lane * SIZE + position : position * SIZE + lane;
      });
      const result = collapse(indices.map(i => board[i]));
      indices.forEach((index, n) => { next[index] = result.line[n]; });
      merged.push(...result.merged.map(n => indices[n]));
      score += result.score;
    }
    return { board: next, score, merged, changed: next.some((v, i) => v !== board[i]) };
  }
  function spawn(board, random = Math.random) {
    const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
    if (!empty.length) return { board: board.slice(), index: -1 };
    const index = empty[Math.floor(random() * empty.length)];
    const next = board.slice();
    next[index] = random() < 0.9 ? 2 : 4;
    return { board: next, index };
  }
  function canMove(board) {
    return board.some((v, i) => v === 0 || (i % SIZE < SIZE - 1 && v === board[i + 1]) || (i < 12 && v === board[i + SIZE]));
  }
  function newGame(random = Math.random) {
    return { board: spawn(spawn(Array(16).fill(0), random).board, random).board, score: 0, won: false, over: false, moves: 0 };
  }
  function move(state, direction, random = Math.random) {
    if (state.over) return { state, changed: false, merged: [], gained: 0, spawned: -1, justWon: false };
    const result = slide(state.board, direction);
    if (!result.changed) return { state: { ...state, over: !canMove(state.board) }, changed: false, merged: [], gained: 0, spawned: -1, justWon: false };
    const added = spawn(result.board, random);
    const justWon = !state.won && result.board.some(v => v >= 2048);
    return {
      state: { board: added.board, score: state.score + result.score, won: state.won || justWon, over: !canMove(added.board), moves: state.moves + 1 },
      changed: true, merged: result.merged, gained: result.score, spawned: added.index, justWon
    };
  }
  const api = { collapse, slide, spawn, canMove, newGame, move };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Game2048 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
