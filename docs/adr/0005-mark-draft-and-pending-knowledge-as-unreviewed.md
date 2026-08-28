# ADR 0005: Oznaczać draft i pending jako wiedzę niezweryfikowaną

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

W stanie OKF zweryfikowanym przed hackathonem koncepty i atomy są oznaczone jako draft lub pending; nie ma jeszcze rekordów published. Demo potrzebuje tych danych do walidacji pionowego slice’a, ale nie może przedstawiać ich jako zatwierdzonej wiedzy produkcyjnej.

## Decyzja

- Tryb hackathon/dev może korzystać z autoryzowanego, read-only dostępu do draft/pending.
- Status takiej wiedzy musi być jawnie prezentowany jako `DEV/UNREVIEWED` lub równoważne oznaczenie „Demo / wiedza niezweryfikowana”.
- Status review jest przenoszony w odpowiedzi API razem z danymi.
- Docelowy publiczny runtime produkcyjny korzysta wyłącznie z danych published.

## Konsekwencje

- Demo nie sugeruje, że draft/pending są zatwierdzoną wiedzą produkcyjną.
- UI i kontrakt domenowy muszą zachować status review aż do finalnej odpowiedzi.
- Przejście do produkcji wymaga dostępności oraz egzekwowania danych published-only.
