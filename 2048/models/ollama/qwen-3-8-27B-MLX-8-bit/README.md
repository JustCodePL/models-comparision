# 2048 — Neon Grid

Kompletna gra 2048 w czystym HTML/CSS/JS. Zero zależności, zero buildu.

## Uruchomienie

Wystarczy otworzyć w przeglądarce:

```
open index.html
```

albo opcjonalnie przez statyczny serwer:

```
python3 -m http.server 8000
# → http://localhost:8000
```

## Sterowanie

- Strzałki ← ↑ → ↓
- WASD
- Gesty swipe (urządzenia dotykowe)
- `DŹWIĘK` — włączyć/wyłączyć efekty dźwiękowe
- `Nowa gra` — reset planszy i wyniku

## Struktura

| Plik | Rola |
| --- | --- |
| `index.html` | struktura strony (HUD, plansza, overlayy) |
| `style.css` | styl neonowy, animacje, responsywność |
| `game.js` | cała logika gry + renderowanie + input |

Logika ruchu (`computeMove` w `game.js`) jest czysta od DOM, dzięki czemu
łatwo ją testować; poprawność mechaniki (przesuwanie, łączenie maksymalnie
raz na ruch, punkty, ruch niemożliwy) była weryfikowana testami Node
włącznie ze stres-testem 20 000 losowych ruchów.
