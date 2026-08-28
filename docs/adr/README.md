# Architecture Decision Records

Ten katalog zawiera zaakceptowane decyzje architektoniczne projektu Hybrid OKF Tutor. ADR-y formalizują decyzje ze [specyfikacji hackathonowej](../spec/hybrid-okf-tutor-hackathon-spec.md) i [planu implementacji](../plans/2026-08-28-implementation-plan.md); nie rozszerzają ich zakresu.

| ADR | Decyzja | Status |
| --- | --- | --- |
| [0001](0001-isolate-public-demo-repository-and-vercel-project.md) | Oddzielić publiczne repo demo i projekt Vercel | Accepted |
| [0002](0002-llm-interprets-okf-is-source-of-educational-facts.md) | Użyć LLM do interpretacji, a OKF jako źródła faktów edukacyjnych | Accepted |
| [0003](0003-use-narrow-read-only-okf-contract.md) | Użyć wąskiego, read-only kontraktu OKF | Accepted |
| [0004](0004-keep-secrets-server-side-behind-vercel-route-handler.md) | Utrzymać sekrety po stronie serwera za Vercel Route Handler | Accepted |
| [0005](0005-mark-draft-and-pending-knowledge-as-unreviewed.md) | Oznaczać draft/pending jako wiedzę niezweryfikowaną | Accepted |
| [0006](0006-defer-mcp-and-model-fallback-until-green-p0.md) | Odłożyć MCP i fallback modelu do czasu zielonego P0 | Accepted |

## Konwencja

Każdy ADR opisuje kontekst, podjętą decyzję i jej konsekwencje. Zaakceptowanej decyzji nie edytujemy w sposób zmieniający jej znaczenie; istotna zmiana wymaga kolejnego ADR-u, który zastępuje poprzedni.
