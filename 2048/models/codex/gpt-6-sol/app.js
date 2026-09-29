(function () {
  "use strict";

  const logic = window.Game2048;
  const boardElement = document.querySelector("#board");
  const scoreElement = document.querySelector("#score");
  const bestElement = document.querySelector("#best");
  const movesElement = document.querySelector("#moves");
  const boardStatus = document.querySelector("#board-status");
  const message = document.querySelector("#message");
  const messageKicker = document.querySelector("#message-kicker");
  const messageTitle = document.querySelector("#message-title");
  const messageText = document.querySelector("#message-text");
  const messageActions = document.querySelector("#message-actions");
  const number = new Intl.NumberFormat("pl-PL");
  const keys = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", d: "right", w: "up", s: "down"
  };

  let game = logic.newGame();
  let best = readBest();
  let won = false;
  let lost = false;
  let finished = false;
  let touchStart = null;

  function readBest() {
    try { return Number(localStorage.getItem("little-moves-2048-best")) || 0; }
    catch { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem("little-moves-2048-best", String(value)); }
    catch { /* Storage may be disabled; the current game still works. */ }
  }

  function showMessage(kicker, title, text, actions) {
    message.hidden = false;
    messageKicker.textContent = kicker;
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageActions.replaceChildren();
    for (const { label, action, secondary } of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.className = secondary ? "message-button secondary" : "message-button";
      button.addEventListener("click", action);
      messageActions.append(button);
    }
  }

  function hideMessage() {
    message.hidden = true;
    messageActions.replaceChildren();
  }

  function render(effect = {}) {
    const merged = new Set((effect.merged || []).map(({ row, col }) => `${row}-${col}`));
    const spawned = effect.spawned && `${effect.spawned.row}-${effect.spawned.col}`;
    const fragment = document.createDocumentFragment();

    game.board.forEach((line, row) => line.forEach((value, col) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Wiersz ${row + 1}, kolumna ${col + 1}: ${value || "puste"}`);
      if (value) {
        const tile = document.createElement("span");
        tile.className = `tile tile-${Math.min(value, 2048)}`;
        if (value > 2048) tile.classList.add("tile-super");
        if (`${row}-${col}` === spawned) tile.classList.add("tile-spawn");
        if (merged.has(`${row}-${col}`)) tile.classList.add("tile-merge");
        tile.textContent = number.format(value);
        cell.append(tile);
      }
      fragment.append(cell);
    }));
    boardElement.replaceChildren(fragment);
    scoreElement.textContent = number.format(game.score);
    bestElement.textContent = number.format(best);
    movesElement.textContent = String(game.moves).padStart(2, "0");
    boardStatus.textContent = lost ? "BRAK RUCHÓW" : finished ? "GRA ZAKOŃCZONA" : won ? "CEL OSIĄGNIĘTY ★" : "TWÓJ RUCH ↘";
  }

  function startNewGame() {
    game = logic.newGame();
    won = false;
    lost = false;
    finished = false;
    hideMessage();
    render();
    boardElement.focus?.();
  }

  function finishGame() {
    finished = true;
    showMessage("WYŚMIENICIE", "Piękna partia.", "Cel 2048 został osiągnięty. Możesz zacząć kolejną rozgrywkę.", [
      { label: "Zagraj ponownie ↗", action: startNewGame }
    ]);
    render();
  }

  function play(direction) {
    if (lost || finished) return;
    const result = logic.move(game, direction);
    if (!result.changed) return;

    game = result.state;
    if (game.score > best) {
      best = game.score;
      saveBest(best);
    }
    if (result.reached2048 && !won) {
      won = true;
      showMessage("CEL OSIĄGNIĘTY", "Jest 2048!", "Brawo! Możesz zakończyć partię albo łączyć kafelki dalej.", [
        { label: "Gram dalej →", action: hideMessage },
        { label: "Zakończ grę", action: finishGame, secondary: true }
      ]);
    }
    if (result.lost) {
      lost = true;
      showMessage("KONIEC PARTII", won ? "2048! I koniec ruchów." : "Brak ruchów.", won
        ? "Cel został osiągnięty, ale na planszy nie ma już możliwych połączeń."
        : "Na planszy nie ma już miejsca ani liczb, które można połączyć.", [
        { label: "Spróbuj ponownie ↗", action: startNewGame }
      ]);
    }
    render(result);
  }

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    play(direction);
  });

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => play(button.dataset.direction));
  });
  document.querySelector("#new-game").addEventListener("click", startNewGame);

  boardElement.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  boardElement.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  }, { passive: true });

  render();
})();
