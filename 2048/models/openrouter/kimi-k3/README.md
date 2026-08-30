# 2048 · Neon

Kompletna, grywalna wersja gry **2048** w przeglądarce — czysty HTML/CSS/JavaScript,
bez żadnych zależności i bez kroku budowania. Autorska oprawa: ciemny, neonowy klimat,
animacje przesuwu/łączenia/pojawiania się kafelków.

## Uruchomienie

Wystarczy otworzyć plik `index.html` w przeglądarce.

Opcjonalnie przez lokalny serwer (np. żeby mieć "ładny" adres):

```bash
python3 -m http.server 8000
# albo
npx serve .
```

a następnie wejść na `http://localhost:8000`.

## Sterowanie

- **Strzałki** lub **WASD** — ruchy,
- **swipe** — na urządzeniach dotykowych,
- przycisk **Nowa gra** — restart rozgrywki.

Po zdobyciu kafelka 2048 można **grać dalej** albo zacząć **nową grę**.
Rekord zapisywany jest w `localStorage`.

## Struktura projektu

```
index.html        — szkielet strony
css/style.css     — wygląd (neon, glassmorphism), animacje, responsywność
js/logic.js       — czysta logika gry (bez DOM); działa też w Node.js
js/main.js        — warstwa UI: renderowanie, animacje, klawiatura, dotyk
test/logic.test.js— testy logiki (Node.js)
```

## Testy

```bash
node test/logic.test.js
```

Testy pokrywają m.in.: wszystkie przykładowe ruchy z treści zadania, cztery kierunki,
zakaz podwójnego łączenia w jednym ruchu, dokładnie jeden nowy kafelek po poprawnym
ruchu, brak spawnu po ruchu bez zmian, punktację, wykrywanie wygranej i przegranej
oraz pełne losowe symulacje gier ze sprawdzaniem spójności stanu.
