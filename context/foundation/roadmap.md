# Hybrid Tutor — Roadmap (P0 + docelowy produkt)

Ten dokument łączy dwa istniejące, osobne źródła prawdy, bez modyfikowania żadnego z nich:

- **P0 (dziś, zaakceptowane):** [`docs/spec/hybrid-okf-tutor-hackathon-spec.md`](../../docs/spec/hybrid-okf-tutor-hackathon-spec.md), [`docs/adr/`](../../docs/adr/), [`docs/plans/2026-08-28-implementation-plan.md`](../../docs/plans/2026-08-28-implementation-plan.md).
- **Produkt docelowy (wizja, nieukończona):** [`shape-notes.md`](./shape-notes.md).

Nie zastępuje żadnego z nich — jest mapą pokazującą, jak P0 i wizja produktowa się do siebie mają, oraz co wymaga jeszcze decyzji, żeby je pogodzić.

## Faza 1 — P0: hackathonowe demo (dziś, 2026-08-28)

Zaakceptowany zakres z `docs/spec/` i ADR-ów 0001–0006:

- Publiczne repo `ZroZoom/hybrid-okf-tutor`, osobny projekt Vercel, bez dostępu do prywatnego monorepo.
- Przepływ: pytanie ucznia (czat, naturalny język) → LLM (`gpt-5.6-luna`) interpretuje intencję → wąski, read-only kontrakt `OkfRepository` (`searchConcepts`, `getConcept`) → warstwa deterministyczna składa odpowiedź lub jawnie zgłasza brak pokrycia.
- Brak logowania — publiczne demo, bez kont uczniów.
- Warstwa bezpieczeństwa/emocjonalna: wykrywanie sygnału (frustracja/zniechęcenie/dystres/kryzys), deterministyczna odpowiedź safety z numerami 116 111 / 112 / 116 123 przy jawnym sygnale kryzysowym; safety ma pierwszeństwo nad przepływem edukacyjnym.
- Wiedza z OKF w stanie draft/pending oznaczona jawnie jako `DEV/UNREVIEWED`.
- Stack zablokowany w planie implementacji: Next.js 16, React 19, TypeScript strict, pnpm, Vitest, Zod, Supabase Edge Functions/Deno, Vercel.
- Poza zakresem P0 (wprost, z sekcji 8 spec): CRM korepetytora, pełny RAG/embeddings, system auth uczniów, pełny workflow review/publish OKF.

## Faza 2 — Produkt docelowy: diagnoza i systematyczna nauka (z shape-notes.md)

Zaakceptowany zakres z `shape-notes.md` (sesja `/10x-shape`, greenfield, MVP 3 tygodnie po godzinach):

- Uczeń klasy 7-8 przygotowujący się do egzaminu ósmoklasisty; ból = brak systematyki, dziś zastępowany pytaniem ogólnego LLM.
- Przepływ: logowanie/profil → diagnoza poziomu i luk (zakres klas 7-8) → mapa luk → uporządkowana lista ćwiczeń (priorytet wg wielkości luki) → ćwiczenie z feedbackiem ugruntowanym w wiedzy → widoczny postęp → dopytywanie w dowolnym momencie.
- Role: uczeń + rodzic (rodzic widzi postępy — odłożone do v2 w ramach samej Fazy 2).
- Reguła domenowa: system diagnozuje luki na podstawie odpowiedzi na pytania diagnostyczne i dobiera ćwiczenia priorytetyzowane wg wielkości luki.
- Non-goals (już zapisane): widok rodzica, agregacja danych między uczniami, zakres poza klasy 7-8/matematykę.

## Jak się łączą

Faza 2 zakłada mechanizm "pytanie → ugruntowana odpowiedź", który Faza 1 właśnie buduje i waliduje jako `OkfRepository` + LLM Intent Interpreter + warstwa deterministyczna. FR-005 i FR-007 z shape-notes.md (feedback ugruntowany w wiedzy; dopytywanie w dowolnym momencie) to bezpośrednie zastosowanie tego samego silnika, który P0 dostarcza jako demo Q&A.

## Otwarte punkty do uzgodnienia (nie rozstrzygnięte tutaj)

Poniższe wymagają jawnej decyzji zespołu — celowo nie zgadujemy odpowiedzi:

1. **Czy warstwa bezpieczeństwa/emocjonalna z P0 (ADR 0002, Task 3 planu) obowiązuje też w Fazie 2?** shape-notes.md jej nie wspomina — czy diagnoza/ćwiczenia dla dziecka z podstawówki dziedziczą tę samą politykę wykrywania kryzysu?
2. **Czy pytania diagnostyczne (FR-002) pochodzą z tego samego OKF, czy to osobny zasób treści?** P0 opisuje `searchConcepts`/`getConcept` jako kontrakt Q&A, nie jako źródło zestawów diagnostycznych.
3. **Czy Faza 2 startuje bez logowania (jak P0), czy logowanie wchodzi od razu?** ADR 0001/0004 zakładają brak kont w P0; shape-notes.md zakłada logowanie jako FR-001 od startu Fazy 2.
4. **Czy zakres `subject` (dziś: `matematyka`, allowlist) i poziomy w OKF faktycznie pokrywają klasy 7-8 / egzamin ósmoklasisty** w stopniu wystarczającym dla diagnozy z FR-002/FR-003.
5. **Stack jest już zablokowany przez ADR-y** (Next.js 16, Supabase, Vercel, `gpt-5.6-luna`) — downstream krok doboru stacku (`10x-tech-stack-selector`) dla Fazy 2 powinien to dziedziczyć, a nie wybierać od nowa.
