# Porównania modeli JustCode

Publiczny katalog odtwarzalnych porównań modeli. Pierwszy benchmark sprawdza, jak modele programistyczne poradziły sobie z przygotowaniem kompletnej gry 2048 w przeglądarce. Drugi rodzaj stron to eksperymenty z modelami generatywnymi (obraz, wideo, dźwięk), np. z produkcji kanału Arek Igiełka.

Strona: [models-comparision.justcode.ac](https://models-comparision.justcode.ac/), wersja testowa: `models-comparision.justcode.ovh` (basic auth).

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

## Wdrożenie

Strona działa na naszym serwerze (Docker Swarm za Traefikiem), tak jak `mr-slipshod` i `arek-igielka-web`. Repozytorium jest prywatne, bo wspólne workflow z prywatnego `JustCodePL/Actions` nie dają się wywołać z publicznego repo.

| Gałąź | Adres | Workflow i stos |
|---|---|---|
| `develop` | `models-comparision.justcode.ovh`, basic auth, `noindex` | `.github/workflows/dev.yml`, `deploy/dev.yml` |
| `main` | `models-comparision.justcode.ac`, TLS, indeksowanie | `.github/workflows/prod.yml`, `deploy/prod.yml` |

Obraz buduje `NextJSStatic` z `JustCodePL/Actions`. Nie ma w nim przeglądarki, więc `npm run build` używa zapisanej ewaluacji `2048/evaluation.json` i zrzutów `2048/previews/`. Pełne testy z Playwrightem uruchamia `.github/workflows/test.yml` przy każdym pushu na `develop` i `main`. Zmianę sprawdzamy na adresie testowym i dopiero potem scalamy `develop` do `main`.

Ustawienia środowisk są w Infisicalu (projekt „Porównania modeli”, `dev` i `prod`) i trafiają do `.env` podczas budowania:

| Zmienna | Znaczenie |
|---|---|
| `PAGE_URL` | adres strony |
| `ENABLE_ROBOTS` | `1` tylko na produkcji, w przeciwnym razie `noindex` |
| `TRACKING_SCRIPT_URL`, `TRACKING_ID` | Umami: `statystyki.justcode.ovh` dla dev, `statystyki.justcode.ac` dla prod, witryna „Porównania modeli” |
| `MEDIA_BASE_URL` | bucket R2 środowiska z wideo i audio |
| `BASIC_AUTH_USERS` | tylko dev; login w Bitwardenie: `[DEV] Porównania modeli basicauth` |

## Wideo i audio (R2)

Każda domena ma własny bucket Cloudflare R2: `models-comparision-justcode-ovh` (`https://models-comparision-media.justcode.ovh`) i `models-comparision-justcode-ac` (`https://models-comparision-media.justcode.ac`). Pliki leżą pod `<slug>/<plik>`. W `experiment.json` wideo i audio mają `src` w postaci `media/<plik>`, a strona składa z tego `MEDIA_BASE_URL/<slug>/<plik>`. Obrazy WebP zostają w repozytorium.
