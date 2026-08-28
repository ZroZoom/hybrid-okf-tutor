# ADR 0001: Oddzielić publiczne repo demo i projekt Vercel

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

Hackathonowe demo musi być publicznie dostępne, ale nie może ujawniać prywatnego monorepo, dumpów OKF, danych uczniów ani sekretów. Zespół hackathonowy ma pracować bez dostępu do `ZroZoom/Szkola_Przyszlosci_AI`.

## Decyzja

- Używamy osobnego publicznego repozytorium `ZroZoom/hybrid-okf-tutor`.
- Nie podłączamy prywatnego monorepo przez submodule, subtree ani sparse checkout.
- Nie kopiujemy do repo dumpów OKF, danych uczniów, sekretów ani prywatnego kodu.
- Używamy osobnego projektu Vercel `hybrid-okf-tutor`, połączonego wyłącznie z tym repozytorium i posiadającego własne zmienne środowiskowe oraz pipeline wdrożeniowy.

## Konsekwencje

- Publiczna historia Git pozostaje odseparowana od prywatnego monorepo i danych.
- Dostęp zespołu hackathonowego można ograniczyć do tego repozytorium.
- Konfiguracja i sekrety projektu Vercel nie są współdzielone z innymi aplikacjami.
- Potrzebne elementy prywatnej infrastruktury są udostępniane wyłącznie przez kontrolowany kontrakt API, a nie przez kopiowanie ich implementacji.
