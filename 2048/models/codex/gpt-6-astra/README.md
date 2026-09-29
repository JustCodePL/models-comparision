# 2048 — Jeszcze jeden ruch

Autorska, responsywna gra 2048 w czystym HTML, CSS i JavaScript. Bez bibliotek, instalacji i zewnętrznych zasobów.

## Uruchomienie

Otwórz `index.html` w przeglądarce (dwuklik). Gra działa również offline.

Opcjonalnie, z katalogu projektu:

```sh
python3 -m http.server 4173
```

Następnie otwórz http://localhost:4173.

## Sterowanie i zasady

- Strzałki, WASD lub przeciągnięcie palcem/myszą po planszy.
- Jednakowe kafelki łączą się tylko raz podczas ruchu. Wynik rośnie o wartość połączenia.
- Po ruchu zmieniającym planszę pojawia się jeden kafelek: 2 (90%) lub 4 (10%).
- Po osiągnięciu 2048 wybierz dalszą grę, nową grę albo zakończenie.
- Nowa gra zeruje wynik i tworzy dwa kafelki. Rekord zostaje w lokalnej pamięci przeglądarki, jeśli jest dostępna.
- Bieżąca rozgrywka nie jest zapisywana po odświeżeniu strony.

## Pliki

- `engine.js` — czysta logika, niezależna od renderowania i animacji.
- `app.js` — interfejs, klawiatura, gesty, rekord i komunikaty.
- `style.css` — responsywny wygląd, animacje tworzenia i łączenia oraz ograniczenie ruchu zgodne z ustawieniami systemu.
- `index.html` — struktura strony, przyciski i komunikaty dostępności.

## Testy

Wymagany tylko Node.js 18 lub nowszy:

```sh
node --test *.test.cjs
```

11 testów obejmuje podane przykłady, cztery kierunki, punktację, losowanie, ruchy bez zmiany, wygraną i kontynuację, przegraną, reset, zdarzenia klawiatury i gestów oraz 10 000 szybkich ruchów. Testy interfejsu korzystają z minimalnego adaptera DOM; nie są testami prawdziwej przeglądarki.

W środowisku przygotowania projektu uruchomienie serwera zostało zablokowane przez sandbox (`EPERM`), a narzędzie automatyzacji przeglądarki nie dopuszcza adresów `file://`. Z tego powodu nie wykonano wizualnej weryfikacji w przeglądarce. Otwieranie pliku przez użytkownika nie wymaga serwera.
