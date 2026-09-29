(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const engine = window.Game2048;
  let state = engine.newGame(), ended = false, best = 0, pointer = null;
  try { best = Math.max(0, Number(localStorage.getItem('male-gry-2048-best')) || 0); } catch { /* Private mode: game still works. */ }
  const cells = Array.from({ length: 16 }, (_, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'img');
    $('board').append(cell);
    return cell;
  });
  function render(result = {}) {
    cells.forEach((cell, i) => {
      const value = state.board[i];
      cell.replaceChildren();
      cell.setAttribute('aria-label', `Wiersz ${Math.floor(i / 4) + 1}, kolumna ${i % 4 + 1}: ${value || 'puste'}`);
      if (!value) return;
      const tile = document.createElement('span');
      tile.className = 'tile';
      tile.dataset.value = value;
      tile.textContent = value;
      tile.setAttribute('aria-hidden', 'true');
      if (value >= 128) tile.classList.add('medium');
      if (value >= 1024) tile.classList.add('long');
      if (value >= 16384) tile.classList.add('extra-long');
      if (value > 2048) tile.classList.add('high');
      if (result.spawned === i) tile.classList.add('spawn');
      else if (result.merged?.includes(i)) tile.classList.add('merge');
      cell.append(tile);
    });
    $('score').textContent = state.score;
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem('male-gry-2048-best', String(best)); } catch { /* Storage is optional. */ }
    }
    $('best').textContent = best;
    const highest = Math.max(...state.board);
    $('milestone').textContent = `${highest} / 2048`;
    $('progress').replaceChildren(...Array.from({ length: 11 }, (_, i) => {
      const segment = document.createElement('span');
      if (2 ** (i + 1) <= highest) segment.className = i === 10 ? 'goal' : 'active';
      return segment;
    }));
    $('progress').setAttribute('aria-label', `Najwyższy kafelek: ${highest}. Cel: 2048.`);
    $('game-status').textContent = state.over || ended ? 'Koniec gry' : state.won ? 'Gramy dalej · cel osiągnięty' : 'Twój ruch';
    if (result.gained) {
      $('gain').textContent = `+${result.gained}`;
      $('gain').classList.remove('animate');
      void $('gain').offsetWidth;
      $('gain').classList.add('animate');
    }
  }
  function showEnd(type) {
    const win = type === 'win';
    $('end-label').textContent = win ? 'CEL OSIĄGNIĘTY' : 'KONIEC ROZGRYWKI';
    $('end-title').textContent = win ? 'Piękny ruch!' : ended ? 'Dobrze zagrane.' : 'To był dobry początek.';
    $('end-description').textContent = win ? `Masz 2048 i ${state.score} punktów. To może być dopiero początek — kolejny cel to 4096!` : `${ended ? 'Rozgrywka zakończona.' : 'Nie ma już możliwych ruchów.'} Twój wynik: ${state.score}. Nowa plansza, nowe możliwości.`;
    $('continue').hidden = !win;
    $('finish').hidden = !win;
    $('overlay').hidden = false;
    (win ? $('continue') : $('restart')).focus({ preventScroll: true });
    $('announcement').textContent = $('end-description').textContent;
  }
  function play(direction) {
    if (ended || !$('overlay').hidden) return;
    const result = engine.move(state, direction);
    state = result.state;
    if (result.changed) {
      render(result);
      $('announcement').textContent = `Wynik ${state.score}. Najwyższy kafelek ${Math.max(...state.board)}.`;
    }
    if (result.justWon) showEnd('win');
    else if (state.over) { render(); showEnd('over'); }
  }
  function restart() {
    state = engine.newGame();
    ended = false;
    $('overlay').hidden = true;
    $('gain').textContent = '';
    render();
    $('announcement').textContent = 'Nowa gra. Dwa kafelki na planszy. Powodzenia!';
    $('board').focus({ preventScroll: true });
  }
  $('new-game').addEventListener('click', restart);
  $('restart').addEventListener('click', restart);
  $('continue').addEventListener('click', () => {
    $('overlay').hidden = true;
    $('board').focus({ preventScroll: true });
    if (state.over) showEnd('over');
  });
  $('finish').addEventListener('click', () => { ended = true; render(); showEnd('over'); });
  const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = directions[event.key] || directions[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    play(direction);
  });
  $('board').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    $('board').setPointerCapture(event.pointerId);
  });
  $('board').addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  $('board').addEventListener('pointercancel', () => { pointer = null; });
  render();
})();
