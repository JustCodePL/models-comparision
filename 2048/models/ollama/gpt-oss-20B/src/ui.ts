// src/ui.ts
import { Game } from './game';

const game = new Game();
const boardEl = document.getElementById('board') as HTMLElement;
const scoreEl = document.getElementById('score') as HTMLElement;
const newGameBtn = document.getElementById('new-game') as HTMLButtonElement;
const messageEl = document.getElementById('message') as HTMLElement;

function render() {
  boardEl.innerHTML = '';
  for (const row of game.board) {
    for (const val of row) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (val === 0) tile.classList.add('empty');
      else tile.classList.add(`tile-${val}`);
      tile.textContent = val === 0 ? '' : val.toString();
      boardEl.appendChild(tile);
    }
  }
  scoreEl.textContent = game.score.toString();
  if (game.win) showMessage('YOU WON!');
  else if (game.gameOver) showMessage('GAME OVER');
  else hideMessage();
}

function showMessage(text: string) {
  messageEl.textContent = text;
  messageEl.style.display = 'flex';
}

function hideMessage() {
  messageEl.style.display = 'none';
}

function handleMove(e: KeyboardEvent) {
  let moved = false;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      moved = game.move('up');
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      moved = game.move('down');
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      moved = game.move('left');
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      moved = game.move('right');
      break;
  }
  if (moved) render();
}

newGameBtn.addEventListener('click', () => {
  game.reset();
  render();
});

boardEl.addEventListener('keyup', handleMove);
boardEl.focus();

// Simple swipe handling for touch devices
let touchStart: {x: number; y: number} | null = null;
boardEl.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStart = {x: touch.clientX, y: touch.clientY};
});
boardEl.addEventListener('touchend', e => {
  if (!touchStart) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < 30) {touchStart = null; return;}
  if (absX > absY) {
    if (dx > 0) game.move('right');
    else game.move('left');
  } else {
    if (dy > 0) game.move('down');
    else game.move('up');
  }
  render();
  touchStart = null;
});

render();
