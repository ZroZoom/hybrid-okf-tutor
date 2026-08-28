# ADR 0006: Odłożyć MCP i fallback modelu do czasu zielonego P0

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

Najważniejszym wynikiem hackathonu jest stabilny pionowy slice: naturalne pytanie → interpretacja LLM → kontrolowany lookup OKF → deterministyczna odpowiedź. MCP, dodatkowe modele i inne rozszerzenia zwiększają zakres oraz ryzyko przed osiągnięciem tego wyniku.

## Decyzja

Nie rozpoczynamy:

- OKF MCP;
- fallbacku ani benchmarku dodatkowych modeli;
- innych rozszerzeń P1/P2;

dopóki pełny P0 vertical slice nie działa end-to-end i nie przechodzi uzgodnionych bramek demo.

Primary model P0 pozostaje `gpt-5.6-luna` przez OpenAI Responses API ze strict Structured Outputs. MiniMax M2.7 Free pozostaje wyłącznie kandydatem P1 do benchmarku/fallbacku za wspólnym `ModelAdapter`.

Jeżeli P0 jest zielone, cienki OKF MCP może mirrorować tylko `search_concepts` i `get_concept` oraz korzystać z tej samej warstwy domenowej/API bez SQL i nowych uprawnień.

## Konsekwencje

- Cały wysiłek przed zielonym P0 jest skierowany na działający przepływ end-to-end.
- MCP i fallback modelu nie mogą blokować ani opóźniać demo P0.
- Rozszerzenia P1 są oceniane dopiero na tych samych fixture’ach i granicach bezpieczeństwa co P0.
