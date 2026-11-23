# Porównania modeli JustCode

Publiczny katalog odtwarzalnych porównań modeli. Pierwszy benchmark sprawdza, jak modele programistyczne poradziły sobie z przygotowaniem kompletnej gry 2048 w przeglądarce. Drugi rodzaj stron to eksperymenty z modelami generatywnymi (obraz, wideo, dźwięk), np. z produkcji kanału Arek Igiełka.

Strona: [justcodepl.github.io/models-comparision](https://justcodepl.github.io/models-comparision/)

## Najważniejsze zasady

- Każdy model otrzymuje ten sam prompt.
- Nie poprawiamy kodu wygenerowanego przez model. Błędny lub niekompletny artefakt pozostaje częścią wyniku.
- GPT-6 Luna, Sol i Astra uruchomiono osobno przez Codex CLI 0.157.1. Każdy otrzymał jeden raz dokładny prompt z `2048/comparison.json` w pustym katalogu. Po zakończeniu sesji pliki skopiowano bez zmian; nie było kolejnych poleceń ani poprawek redakcyjnych.
- Statusy to `success`, `partial`, `failed` i `not-evaluated`.
- Publiczne zapisy prób zachowują oryginalny język odpowiedzi, ale nie zawierają wewnętrznych treści modelu, komunikatów systemowych, pełnych wyników narzędzi, sekretów ani prywatnych ścieżek.
- Gry otwierają się jako osobne statyczne artefakty; indeks pokazuje tylko zrzuty ekranu.

## Struktura

```text
2048/
  comparison.json
  evaluation.json
  models/<provider>/<model>/
    model.json
    attempts/*.json
experiments/<slug>/
  experiment.json
  media/            obrazy WebP; wideo i audio leżą w Cloudflare R2 pod pełnym adresem
app/
scripts/
tests/
```

## Eksperymenty z modelami generatywnymi

Każdy eksperyment to podstrona `/eksperymenty/<slug>/`: pytanie, metoda (sprzęt, ustawienia, czasy, licencje), wyniki obok siebie dla każdego ujęcia i ziarna oraz werdykt. `experiment.json` i `media/` powstają narzędziem `tools/eksport_porownania.py` w repozytorium `arek-igielka` z opisu w `docs/porownania/<slug>.json`; plików w `experiments/` nie edytujemy ręcznie.

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

Można wskazać inną kopię bazy przez `OPENCODE_DB`. Importer publikuje wyłącznie wiadomości użytkownika, tekstowe odpowiedzi modelu i krótkie statusy narzędzi. Operacje plikowe pokazują ścieżki względne wobec katalogu danego modelu, a skaner blokuje podejrzane dane.

## Adres testowy

Push na `develop` buduje obraz Dockera (`NextJSStatic` z `JustCodePL/Actions`) i wdraża `models-comparision.justcode.ovh` za basic auth, tak jak w `mr-slipshod` (`.github/workflows/dev.yml`, `deploy/dev.yml`). Sekrety są w Infisicalu, projekt „Porównania modeli”, a login do basic auth w Bitwardenie: `[DEV] Porównania modeli basicauth`. Obraz Dockera nie ma przeglądarki, więc `npm run build` używa wtedy zapisanej ewaluacji `2048/evaluation.json` i zrzutów `2048/previews/`. Po sprawdzeniu zmiany na adresie testowym scalamy `develop` do `main`, co publikuje GitHub Pages.

## GitHub Pages

Next.js używa eksportu statycznego, końcowych ukośników i prefiksu `/models-comparision`. Workflow dla gałęzi `main` instaluje Chromium, uruchamia redakcję, staging oryginalnych artefaktów, wspólną ewaluację Playwright, testy Kimi, eksport Next.js i wdrożenie GitHub Pages.
