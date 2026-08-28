# Hybrid OKF Tutor

Publiczne demo Next.js prowadzi ucznia przez obliczenie pola trapezu. Luna interpretuje wypowiedź ucznia, kontrolowany OKF dostarcza fakt edukacyjny, a deterministyczna reguła pilnuje kolejności kroków. Przegląd architektury i granic danych znajduje się w [specyfikacji](docs/spec/hybrid-okf-tutor-hackathon-spec.md).

## Uruchomienie lokalne

Wymagany jest Node.js zgodny z `pnpm@11.17.0` oraz zmienne serwerowe opisane w `.env.example`. Nie dodawaj ich do plików śledzonych przez Git ani nie używaj prefiksu `NEXT_PUBLIC_`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Pełne komendy weryfikacyjne:

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
git grep -nE 'sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.' -- ':!pnpm-lock.yaml'
```

Pierwsza komenda musi zakończyć się kodem `0`; druga nie może wypisać żadnej linii.

## Demo i wydanie

Powtarzalny scenariusz prezentacji oraz warunki dopuszczenia do wydania opisuje [runbook z 28 sierpnia 2026](docs/demo/2026-08-28-runbook.md). Zanim rozpoczniesz smoke na wdrożeniu, potwierdź jako warunek konieczny aktywny endpoint OKF w [issue #3](https://github.com/ZroZoom/hybrid-okf-tutor/issues/3). Bez niego nie wolno uznać demo za gotowe do wydania.
