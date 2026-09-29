const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createElement(dataset = {}) {
  const listeners = {};
  return {
    dataset,
    children: [],
    attributes: {},
    className: '',
    classList: { add() {} },
    textContent: '',
    hidden: false,
    addEventListener(type, handler) { listeners[type] = handler; },
    dispatch(type, event = {}) { listeners[type]?.(event); },
    append(child) { this.children.push(child); },
    replaceChildren(...children) {
      this.children = children.length === 1 && children[0].isFragment ? children[0].children : children;
    },
    setAttribute(key, value) { this.attributes[key] = value; }
  };
}

function loadApp() {
  const selectors = ['#board', '#score', '#best', '#moves', '#board-status', '#message', '#message-kicker', '#message-title', '#message-text', '#message-actions', '#new-game'];
  const elements = Object.fromEntries(selectors.map((selector) => [selector, createElement()]));
  const buttons = ['up', 'left', 'down', 'right'].map((direction) => createElement({ direction }));
  const document = {
    handlers: {},
    querySelector(selector) { return elements[selector]; },
    querySelectorAll() { return buttons; },
    createElement() { return createElement(); },
    createDocumentFragment() { return { isFragment: true, children: [], append(child) { this.children.push(child); } }; },
    addEventListener(type, handler) { this.handlers[type] = handler; }
  };
  const math = Object.create(Math);
  math.random = () => 0;
  const storage = new Map();
  const context = vm.createContext({
    window: {}, document, Math: math, Intl,
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) }
  });
  for (const file of ['game-logic.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, { filename: file });
  }
  return { elements, buttons, document, storage };
}

test('interface starts with two tiles and reacts to keyboard and new game', () => {
  const { elements, document } = loadApp();
  const tiles = () => elements['#board'].children.filter((cell) => cell.children.length > 0);
  assert.equal(elements['#board'].children.length, 16);
  assert.equal(tiles().length, 2);
  assert.equal(elements['#score'].textContent, '0');

  document.handlers.keydown({ key: 'ArrowUp', preventDefault() {} });
  assert.equal(elements['#moves'].textContent, '00', 'an unchanged board does not count as a move');
  assert.equal(tiles().length, 2);

  document.handlers.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(elements['#score'].textContent, '4');
  assert.equal(elements['#moves'].textContent, '01');
  assert.equal(tiles().length, 2, 'one merge followed by exactly one spawn');
  assert.equal(elements['#best'].textContent, '4');

  elements['#new-game'].dispatch('click');
  assert.equal(elements['#score'].textContent, '0');
  assert.equal(elements['#moves'].textContent, '00');
  assert.equal(tiles().length, 2);
  assert.equal(elements['#best'].textContent, '4');
});

test('direction buttons and rapid input keep the rendered board consistent', () => {
  const { elements, buttons, document } = loadApp();
  for (let i = 0; i < 100; i += 1) {
    buttons[i % 4].dispatch('click');
    document.handlers.keydown({ key: ['a', 'w', 'd', 's'][i % 4], preventDefault() {} });
    assert.equal(elements['#board'].children.length, 16);
    assert.ok(elements['#board'].children.every((cell) => cell.children.length <= 1));
  }
});
