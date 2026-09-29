const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const board = row => [...row, ...Array(12).fill(0)];
const state = values => ({ board: values, score: 0, won: false, over: false, moves: 0 });
const rng = () => 0;
test('new game has exactly two tiles; 2 and 4 probability boundary', () => {
  assert.equal(E.newGame(rng).board.filter(Boolean).length, 2);
  assert.equal(E.spawn(Array(16).fill(0), () => .899).board.filter(Boolean)[0], 2);
  assert.equal(E.spawn(Array(16).fill(0), () => .9).board.filter(Boolean)[0], 4);
});
test('all specified merge cases and their scores', () => {
  const cases = [
    [[2,2,2,0],[4,2,0,0],4], [[2,2,2,2],[4,4,0,0],8],
    [[4,4,8,0],[8,8,0,0],8], [[2,0,2,2],[4,2,0,0],4],
    [[4,0,4,4],[8,4,0,0],8], [[8,8,16,16],[16,32,0,0],48],
    [[2,4,8,16],[2,4,8,16],0], [[2,2,4,4],[4,8,0,0],12]
  ];
  for (const [input, expected, score] of cases) {
    assert.deepEqual(E.collapse(input).line, expected);
    assert.equal(E.collapse(input).score, score);
  }
});
test('all directions slide to edge and preserve directional merge order', () => {
  for (const direction of ['left','right','up','down']) {
    const ids = Array.from({length:4}, (_, n) => {
      const p = direction === 'right' || direction === 'down' ? 3-n : n;
      return ['left','right'].includes(direction) ? p : p*4;
    });
    const input = Array(16).fill(0);
    [2,0,2,2].forEach((v,i) => input[ids[i]] = v);
    const result = E.slide(input, direction);
    assert.deepEqual(ids.map(i => result.board[i]), [4,2,0,0]);
    assert.equal(result.score, 4);
  }
});
test('valid move creates exactly one tile; no-op creates none or calls RNG', () => {
  const s = state(board([2,0,0,0]));
  assert.deepEqual(E.move(s, 'left', () => { throw Error('must not spawn'); }).state, s);
  const result = E.move(s, 'right', rng);
  assert.equal(result.state.board.filter(Boolean).length, 2);
  assert.equal(result.state.board.reduce((a,b)=>a+b), 4);
  assert.equal(result.state.moves, 1);
});
test('merge score sums across rows and input is immutable', () => {
  const s = state([2,2,4,4,8,8,16,16,0,0,0,0,0,0,0,0]);
  const before = structuredClone(s);
  assert.equal(E.move(s,'left',rng).state.score,60);
  assert.deepEqual(s,before);
});
test('win triggers once and play continues beyond 2048', () => {
  const first = E.move(state(board([1024,1024,0,0])), 'left', rng);
  assert.equal(first.justWon,true);
  assert.equal(first.state.won,true);
  assert.equal(first.state.score,2048);
  const second = E.move(first.state,'down',rng);
  assert.equal(second.changed,true);
  assert.equal(second.justWon,false);
  const larger = E.move({...first.state, board:board([2048,2048,0,0])},'left',rng);
  assert.equal(larger.state.board[0],4096);
  assert.equal(larger.justWon,false);
});
test('loss only when full without horizontal or vertical pairs', () => {
  const full = [2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2];
  assert.equal(E.canMove(full),false);
  assert.equal(E.move(state(full),'left',rng).state.over,true);
  for (const [index,value] of [[0,0],[0,4],[4,2]]) {
    const modified=full.slice(); modified[index]=value;
    assert.equal(E.canMove(modified),true);
  }
  const almost=[2,4,8,0,16,32,64,128,2,4,8,16,32,64,128,256];
  assert.equal(E.move(state(almost),'right',()=>.99).state.over,true);
});
test('10,000 rapid moves preserve valid values and tile-sum invariant', () => {
  let s=E.newGame();
  for(let n=0;n<10000;n++) {
    if(s.over) s=E.newGame();
    const before=s.board.reduce((a,b)=>a+b,0);
    const result=E.move(s,['up','left','down','right'][n%4]);
    const sum=result.state.board.reduce((a,b)=>a+b,0);
    assert.equal(result.state.board.length,16);
    assert.ok(result.state.board.every(v => v===0 || Number.isInteger(Math.log2(v))));
    assert.ok(result.changed ? [2,4].includes(sum-before) : sum===before);
    assert.ok(result.state.score>=s.score);
    s=result.state;
  }
});
