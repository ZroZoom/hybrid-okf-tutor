# ADR 0003: Użyć wąskiego, read-only kontraktu OKF

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

Publiczne demo potrzebuje wiedzy z prywatnego OKF, ale nie może otrzymać dowolnego dostępu do bazy ani pozwalać modelowi wybierać tabel i konstruować zapytań SQL. Kontrakt P0 ma minimalizować liczbę round-tripów, powierzchnię API i ryzyko błędnego filtrowania.

## Decyzja

Publiczny kontrakt P0 ma dokładnie dwie operacje:

1. `searchConcepts(query, subject, level)`
2. `getConcept(conceptId, level)`

`getConcept` zwraca concept oraz potrzebne `atoms[]`, `relations[]`, `curriculum[]` i `skills[]`, z atomami przefiltrowanymi po poziomie.

Na P0:

- nie udostępniamy generic SQL;
- nie udostępniamy dodatkowych operacji `getAtoms()` ani `getRelations()`;
- nie pozwalamy LLM wybierać tabel lub zapytań bazodanowych;
- kontrakt jest read-only.

## Konsekwencje

- Repo demo pozostaje klientem małego kontraktu domenowego.
- Cały potrzebny payload konceptu jest pobierany jedną operacją.
- Rozszerzenie kontraktu wymaga decyzji poza P0 i dowodu realnej potrzeby.
- Ewentualny przyszły MCP ma mirrorować te same dwie operacje zamiast otrzymywać szerszy dostęp.
