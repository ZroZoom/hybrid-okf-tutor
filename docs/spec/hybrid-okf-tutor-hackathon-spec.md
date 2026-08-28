# Hybrid OKF Tutor — specyfikacja hackathonowa

- **Zespół:** BRAVE UnAIted
- **Data:** 28 sierpnia 2026
- **Status:** uzgodniona specyfikacja P0
- **Dokument źródłowy:** [Hybrid OKF Tutor — plan hackathonu 28.08.2026](https://docs.google.com/document/d/1ft1we50KYNkUO33iRD5RYzSiF9Xq1CLi225NaHGQmMQ/edit)

## Cel

W ciągu dnia zbudować działające, publicznie dostępne demo Hybrid OKF Tutor, które pokazuje przewagę architektury: LLM rozumie naturalne pytanie ucznia, ale wiedza i odpowiedź są ugruntowane w kontrolowanym OKF.

Główna zasada:

> LLM interpretuje pytanie → OKF dostarcza wiedzę → warstwa deterministyczna składa odpowiedź.

## 1. Granice projektu

### Repozytorium

- Nowe, osobne repo: `ZroZoom/hybrid-okf-tutor`.
- Repo jest publiczne.
- Członkowie zespołu hackathonowego dostają write access wyłącznie do tego repo.
- Brak dostępu do `ZroZoom/Szkola_Przyszlosci_AI`.
- Nie używamy submodule, subtree ani sparse checkout prywatnego monorepo.
- Nie kopiujemy do repo kodu, którego nie chcemy upublicznić.
- Nie umieszczamy dumpów OKF, danych uczniów ani sekretów.
- Licencja: source-available/proprietary, nie MIT/Apache, jeśli nie podejmiemy innej decyzji.

### Vercel

- Nowy, niezależny projekt Vercel: `hybrid-okf-tutor`.
- Projekt jest połączony wyłącznie z nowym repo.
- Własne zmienne środowiskowe i własny pipeline deployu.
- Preferowany adres demo: `tutor.szkolaprzyszlosciai.pl`.
- Fallback, który nie może blokować pracy: `hybrid-okf-tutor.vercel.app`.
- Nie kupujemy osobnej domeny przed walidacją projektu.

## 2. Architektura demo P0

Przepływ:

```text
Pytanie ucznia
→ LLM Intent Interpreter
→ StructuredIntent
→ OkfRepository
→ kontrolowane OKF API/RPC
→ Supabase OKF
→ wybór konceptu/atomów/relacji
→ deterministyczna odpowiedź
```

Kluczowa zasada bezpieczeństwa: publiczne repo i frontend nie dostają Supabase `service_role` ani szerokiego dostępu do bazy.

## 3. Supabase OKF API/RPC w P0

Stan live zweryfikowany 27 sierpnia 2026:

- `okf_concepts`: 2164 (1988 draft, 176 pending, 0 approved, 0 published),
- `okf_atoms`: 7365 (6542 draft, 823 pending, 0 approved, 0 published),
- `okf_concept_relations`: 2239,
- `okf_concept_curriculum`: 652,
- `okf_concept_skills`: 10,
- `okf_audit_log`: 9529 wpisów.

Na hackathonie wolno korzystać z draft/pending w kontrolowanym trybie developerskim/testowym. Nie udostępniamy ich jako publicznej, zatwierdzonej wiedzy produkcyjnej.

Docelowa granica:

- aplikacja nie wykonuje dowolnego SQL;
- LLM nie wybiera tabel ani zapytań bazodanowych;
- dostęp odbywa się przez wąskie operacje domenowe;
- publiczny runtime produkcyjny ma docelowo korzystać wyłącznie z published;
- hackathon/dev może mieć autoryzowany read-only dostęp do draft/pending.

Minimalny kontrakt `OkfRepository`:

- `searchConcepts(query, subject, level)`;
- `getConcept(conceptId, level)` — zwraca concept + `atoms[]` + `relations[]` + `curriculum[]` + `skills[]`, z atomami przefiltrowanymi po poziomie.

Na P0 nie wystawiamy osobnych `getAtoms()` ani `getRelations()`. Jedno `getConcept()` ma dostarczyć cały potrzebny payload i ograniczyć round-trip, powierzchnię API oraz ryzyko błędnego filtrowania.

Preferowany P0: kontrolowane API/RPC lub Supabase Edge Function pod naszą kontrolą. Repo hackathonowe jest tylko klientem tego kontraktu.

## 4. LLM Intent Interpreter

Model P0: OpenAI GPT-5.6 Luna (`gpt-5.6-luna`) przez Responses API, ze strict Structured Outputs. Powód: wystarczająca jakość do klasyfikacji/intencji przy bardzo niskim koszcie; model nie jest źródłem wiedzy.

P1 benchmark/fallback: MiniMax M2.7 Free przez Vercel AI Gateway, za wspólnym `ModelAdapter`. Zmiana dostawcy nie może wymagać zmian w logice domenowej.

LLM nie jest źródłem wiedzy matematycznej. Ma zwracać mały, walidowany structured output, na przykład:

```text
{
  subject,
  level,
  intent,
  concepts,
  requestedAnswerType,
  ambiguity,
  missingEntity,
  rewrittenQuery
}
```

Przykład:

```text
„Jaki jest wzór na obwód?”
→ intent=formula
→ concept=obwód
→ ambiguity=true
→ missingEntity=figura
```

System zamiast zgadywać pyta: „Obwód jakiej figury?”.

Przykład kontekstowy:

```text
„Co to jest trapez?” → „A wzór na pole?”
→ contextConcept=trapez
→ requestedAnswerType=formula
→ OKF zwraca odpowiedni atom formula.
```

## 5. Must-have demo

Do końca P0 musi działać pełny pionowy slice:

```text
pytanie
→ interpretacja LLM
→ rozpoznanie konceptu/intencji
→ pobranie wiedzy z OKF
→ odpowiedź
```

Minimalny zestaw przypadków demonstracyjnych:

1. „Jaki jest wzór na obwód?” — brak zgadywania figury.
2. „Co to jest trapez?” → „A wzór na pole?” — poprawne użycie kontekstu.
3. Potoczne pytanie: „ej a jak się liczy to pole w trapezie?”.
4. Literówka/parafraza.
5. Pytanie niejednoznaczne.
6. Pytanie spoza pokrycia OKF — jawny brak odpowiedzi zamiast halucynacji.

Demo powinno pokazywać, jeśli to czytelne:

- parsed intent;
- wybrany concept/atom OKF;
- finalną odpowiedź;
- status wiedzy `DEV/UNREVIEWED` dla draft/pending.

## 6. OLD vs NEW

Jeśli koszt jest mały, przygotować porównanie:

**OLD**

```text
naturalne pytanie → heurystyczny/deterministyczny matching → ryzyko złej interpretacji
```

**NEW**

```text
naturalne pytanie → LLM semantic interpretation → kontrolowany OKF lookup → odpowiedź
```

Narracja:

> Deterministyczny bot nie halucynuje, ale może pewnie odpowiedzieć na inne pytanie niż uczeń zadał. LLM rozwiązujemy problem rozumienia języka, a nie problem wiedzy.

## 7. P1 — MCP tylko po działającym P0

Nie używamy generic Supabase MCP jako runtime tutora.

Jeśli P0 jest stabilne, możemy wystawić cienki OKF MCP korzystający z tej samej domenowej warstwy/API:

- `search_concepts`;
- `get_concept`.

Na pierwszy slice MCP mirroruje minimalny kontrakt P0: `search_concepts` + `get_concept`. Osobne `get_atoms`/`get_relations` dodajemy tylko, jeśli benchmark pokaże realną potrzebę.

MCP nie dostaje dowolnego SQL ani `service_role`. Jest alternatywnym interfejsem do tego samego `OkfRepository`.

Architektura docelowa:

```text
Hybrid Tutor ─┐
              ├→ OKF domain/API → Supabase OKF
OKF MCP ──────┘
```

## 8. Poza zakresem P0

- CRM korepetytora;
- pełny RAG/embeddings/pgvector;
- migracja całej Szkoły Przyszłości;
- przebudowa produkcyjnego `DeterministicChatWidget`;
- publikacja wszystkich danych OKF;
- system auth uczniów;
- pełny workflow review/publish OKF;
- zakup nowej domeny;
- kopiowanie prywatnego silnika z monorepo do publicznego repo.

## 9. Checkpointy z mentorami

- **09:30 — Marcin Czarkowski:** Czy granica LLM Intent Interpreter → OkfRepository/API → deterministic answer jest właściwa? Co uprościć, aby demo było stabilne?
- **11:30 — Przemek Smyrdek:** Jaki najmniejszy/szybki model wystarczy do reliable structured intent i jak walidować wynik?
- **13:30 — Piotr Kacała:** Czy demo pokazuje realną różnicę dla ucznia, czy tylko ciekawą architekturę? Co wyciąć z prezentacji?
- **15:30 — Piotr Brzyski:** Jak najlepiej komunikować granicę odpowiedzialności: LLM interpretuje, ale wiedza pochodzi z kontrolowanego OKF? Jakie ryzyka uwzględnić?
- **16:30 — Rafał Garbacz:** Czy po hackathonie ta architektura jest sensowną podstawą produkcyjną? Czego brakuje, aby ją wdrażać dalej?

## 10. Definition of Done

P0 jest ukończone, gdy:

- publiczne repo zespołu istnieje i nie ujawnia monorepo ani sekretów;
- osobny projekt Vercel deployuje się automatycznie;
- istnieje działający URL demo;
- użytkownik może zadać naturalne pytanie po polsku;
- LLM zwraca walidowany structured intent;
- aplikacja pobiera wiedzę przez kontrolowany OKF API/RPC;
- odpowiedź nie jest generowana z wiedzy własnej LLM poza dozwoloną warstwą językową;
- niejednoznaczność prowadzi do doprecyzowania zamiast zgadywania;
- brak pokrycia OKF prowadzi do bezpiecznego „nie wiem/brak danych”;
- przynajmniej pięć przygotowanych przypadków demonstracyjnych działa powtarzalnie;
- żadnego `service_role` ani prywatnego kodu w publicznym repo.

P1 jest ukończone tylko opcjonalnie, jeśli powyższe jest stabilne:

- cienki OKF MCP korzysta z tej samej warstwy domenowej/API;
- MCP nie ma szerszych uprawnień niż potrzebne do read-only demo.

## 11. Pitch w jednym zdaniu

> LLM nie ma wiedzieć matematyki — ma rozumieć, o co uczeń pyta. Wiedza pochodzi z kontrolowanego, wersjonowanego OKF.

## 12. Priorytet dnia

Najpierw pełny pionowy slice i działające demo. Nie rozszerzamy zakresu, dopóki nie przechodzi ono end-to-end. MCP, dodatkowe UI i inne pomysły są P1/P2.
