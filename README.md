# Porównania modeli JustCode

Publiczny katalog odtwarzalnych porównań modeli programistycznych. Pierwszy benchmark sprawdza, jak osiem modeli poradziło sobie z przygotowaniem kompletnej gry 2048 w przeglądarce.

Strona: [justcodepl.github.io/models-comparision](https://justcodepl.github.io/models-comparision/)

## Najważniejsze zasady

- Każdy model otrzymuje ten sam prompt.
- Nie poprawiamy kodu wygenerowanego przez model. Błędny lub niekompletny artefakt pozostaje częścią wyniku.
- Statusy to `success`, `partial`, `failed` i `not-evaluated`.
- Rozmowy OpenCode zachowują oryginalny język, ale nie zawierają reasoning, komunikatów systemowych, pełnych wyników narzędzi, sekretów ani prywatnych ścieżek.
- Gry otwierają się jako osobne statyczne artefakty; indeks pokazuje tylko zrzuty ekranu.

## Struktura

```text
2048/
  comparison.json
  evaluation.json
  models/<provider>/<model>/
    model.json
    attempts/*.json
app/
scripts/
tests/
```

## Praca lokalna

Wymagany jest Node.js 24 oraz Chromium lub Google Chrome.

```bash
npm ci
npm run transcripts:check
npm test
npm run dev
```

Importer rozmów czyta lokalną bazę SQLite OpenCode bezpośrednio:

```bash
npm run transcripts:import
```

Można wskazać inną kopię bazy przez `OPENCODE_DB`. Importer publikuje wyłącznie wiadomości użytkownika, tekstowe odpowiedzi modelu i krótkie statusy narzędzi, a następnie skaner blokuje podejrzane dane.

## GitHub Pages

Next.js używa eksportu statycznego, końcowych ukośników i prefiksu `/models-comparision`. Workflow dla gałęzi `main` instaluje Chromium, uruchamia redakcję, staging oryginalnych artefaktów, wspólną ewaluację Playwright, testy Kimi, eksport Next.js i wdrożenie GitHub Pages.
