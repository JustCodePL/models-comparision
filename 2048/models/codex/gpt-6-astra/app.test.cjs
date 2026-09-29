const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');
// Minimal DOM adapter tests event wiring; it does not replace visual browser QA.
function harness(initial) {
  class Element {
    constructor() { this.children=[]; this.events={}; this.hidden=false; this.dataset={}; this.attributes={}; this.textContent=''; this.classList={add(){},remove(){}}; }
    append(child) { this.children.push(child); }
    replaceChildren(...children) { this.children=children; }
    setAttribute(key,value) { this.attributes[key]=value; }
    addEventListener(key,fn) { this.events[key]=fn; }
    focus() { this.focused=true; }
    setPointerCapture() {}
  }
  const ids=[...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
  nodes.overlay.hidden=true;
  const doc=new Element();
  doc.getElementById=id=>nodes[id];
  doc.createElement=()=>new Element();
  let calls=0;
  const api={...E,move:(s,d)=>E.move(s,d,()=>0),newGame:()=> calls++===0 && initial ? structuredClone(initial) : E.newGame(()=>0)};
  const context={document:doc,window:{Game2048:api},localStorage:{getItem:()=>null,setItem(){} }};
  vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
  return { nodes, key:key=>doc.events.keydown({key,preventDefault(){}}), click:id=>nodes[id].events.click(), values:()=>nodes.board.children.map(c=>Number(c.children[0]?.textContent)||0) };
}
const state=board=>({board,score:0,moves:0,won:false,over:false});
test('DOM starts with 16 cells / 2 tiles, keyboard updates and new-game resets',()=>{
  const h=harness();
  assert.equal(h.nodes.board.children.length,16);
  assert.equal(h.values().filter(Boolean).length,2);
  h.key('ArrowLeft');
  assert.equal(h.nodes.score.textContent,4);
  assert.equal(h.nodes.best.textContent,4);
  for(let i=0;i<100;i++)h.key(['ArrowDown','ArrowRight','ArrowUp','a'][i%4]);
  assert.equal(h.values().length,16);
  h.click('new-game');
  assert.equal(h.nodes.score.textContent,0);
  assert.equal(h.values().filter(Boolean).length,2);
  assert.equal(h.nodes.overlay.hidden,true);
});
test('win dialog supports continue, finish, and restart',()=>{
  const initial=state([1024,1024,...Array(14).fill(0)]);
  const h=harness(initial);
  h.key('ArrowLeft');
  assert.equal(h.nodes.overlay.hidden,false);
  assert.equal(h.nodes.continue.hidden,false);
  assert.equal(h.nodes.score.textContent,2048);
  h.click('continue');
  h.key('ArrowDown');
  assert.equal(h.nodes.overlay.hidden,true);
  assert.ok(h.values().slice(12).includes(2048));
  const end=harness(initial);
  end.key('a'); end.click('finish');
  assert.equal(end.nodes['game-status'].textContent,'Koniec gry');
  const before=end.values(); end.key('s');
  assert.deepEqual(end.values(),before);
  end.click('restart');
  assert.equal(end.nodes.overlay.hidden,true);
  assert.equal(end.values().filter(Boolean).length,2);
});
test('loss dialog and swipe event wiring',()=>{
  const h=harness(state([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]));
  h.key('ArrowLeft');
  assert.equal(h.nodes.overlay.hidden,false);
  assert.equal(h.nodes.continue.hidden,true);
  h.click('restart');
  h.nodes.board.events.pointerdown({isPrimary:true,button:0,clientX:50,clientY:50,pointerId:1});
  h.nodes.board.events.pointerup({clientX:50,clientY:200,pointerId:1});
  assert.ok(h.values()[12]);
  assert.ok(h.values()[13]);
  assert.equal(h.values().filter(Boolean).length,3);
});
