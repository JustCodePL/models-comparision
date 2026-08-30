# 2048 Web Game

A tiny vanilla‑JS/TS implementation of the classic 2048 game that runs entirely in the browser.

## Features
- Randomly spawns `2` or `4` tiles (90 %/10 %) after every successful move.
- Full 4×4 board with keyboard (`Arrow`, `WASD`) and touch swipe controls.
- Score counter and win/lose notifications.
- Ability to keep playing after reaching 2048.
- Minimal CSS with a clean, responsive layout.

## How to run
```
# clone & cd into repo
npm install        # build TS -> compiled/main.js
npm start          # serves the site on http://localhost:5000
```

Alternatively, open `index.html` directly in a browser – the site works without a dev server.

## Build notes
The project uses TypeScript `tsc`. The compiled JavaScript is emitted to the `compiled` directory.
