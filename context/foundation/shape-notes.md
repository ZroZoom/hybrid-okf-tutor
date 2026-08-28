---
project: "Hybrid Tutor"
context_type: greenfield
created: 2026-08-28
updated: 2026-08-28
product_type: web-app
target_scale:
  users: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "moment bólu (MVP)"
      decision: "systematyczna nauka do egzaminu ósmoklasisty (nie pojedyncze zadanie domowe)"
    - topic: "zakres klas"
      decision: "klasy 7-8, przygotowanie do egzaminu ósmoklasisty"
    - topic: "konkurent status quo"
      decision: "ogólny LLM (ChatGPT) — brak ugruntowania, ryzyko halucynacji"
    - topic: "typ bólu"
      decision: "tarcie w przepływie pracy + brak diagnozy braków w bezpiecznym, rzetelnym środowisku"
    - topic: "insight"
      decision: "ugruntowana wiedza eliminuje halucynacje ogólnych LLM-ów w matematyce"
    - topic: "sposób dostępu"
      decision: "logowanie (email+hasło / OAuth / bez hasła — mechanizm doprecyzowany downstream)"
    - topic: "model ról"
      decision: "uczeń + rodzic (rodzic widzi postępy dziecka)"
    - topic: "zakres MVP"
      decision: "uproszczony plan ćwiczeń (statyczna lista, bez re-planowania), rola rodzica odłożona do v2; mvp_weeks: 3"
    - topic: "informacja zwrotna na ćwiczeniach"
      decision: "poprawność + wyjaśnienie ugruntowane w repozytorium wiedzy"
    - topic: "dopytywanie w trakcie ćwiczenia"
      decision: "tak — uczeń może dopytać w dowolnym momencie (odpowiedź ugruntowana w wiedzy)"
    - topic: "reguła domenowa"
      decision: "system diagnozuje luki (na podstawie odpowiedzi na pytania diagnostyczne) i dobiera ćwiczenia priorytetyzowane wg wielkości luki"
    - topic: "NFR — czas odpowiedzi"
      decision: "< 3 sekundy na feedback / dopytanie"
    - topic: "typ produktu"
      decision: "web-app"
    - topic: "skala"
      decision: "mała (garstka użytkowników na start); reguła domenowa niezależna od skali"
    - topic: "termin"
      decision: "brak sztywnego terminu; praca po godzinach; mvp_weeks: 3"
    - topic: "non-goals"
      decision: "widok rodzica, agregacja danych między uczniami, zakres poza klasy 7-8/matematykę — wszystkie poza MVP"
  frs_drafted: 7
  quality_check_status: accepted
---

# Shape Notes

## Vision & Problem Statement

Uczeń klasy 7-8, przygotowujący się do egzaminu ósmoklasisty z matematyki, nie ma systematyki w nauce — nie wie, jakich dokładnie braków potrzebuje nadrobić ani w jakiej kolejności się uczyć. Dziś zamiast tego pyta ogólny LLM (np. ChatGPT), co niesie ryzyko halucynacji (błędne kroki, złe wyniki) i nie daje żadnej struktury ani śledzenia postępów — narzędzia do nauki (podręcznik, YouTube, LLM, zeszyt ćwiczeń) są rozproszone, a złożenie ich w spójny plan obciąża samego ucznia.

Ugruntowana wiedza (repozytorium + silnik RAG) eliminuje halucynacje, które są głównym ryzykiem ogólnych LLM-ów w matematyce — to przewaga, na której konkurenci (ogólne LLM-y, rozproszone narzędzia) nie budują. W połączeniu z izolowanym, bezpiecznym środowiskiem i historią dotychczasowej nauki ucznia, produkt może diagnozować faktyczne braki i budować dla niego systematykę — czego sam ogólny LLM z siebie nie robi.

## User & Persona

**Uczeń klasy 7-8**, przygotowujący się do egzaminu ósmoklasisty z matematyki. Sięga po produkt, gdy buduje wiedzę długoterminowo i brakuje mu planu — potrzebuje diagnozy, czego dokładnie nie opanował, i kolejności, w jakiej powinien się uczyć, w bezpiecznym środowisku opartym o rzetelne, ugruntowane dane (bez ryzyka halucynacji ogólnych LLM-ów).

## Access Control

Logowanie (email+hasło / OAuth / bez hasła — konkretny mechanizm do doprecyzowania downstream). Dwie role:

- **Uczeń** — główny użytkownik; korzysta z pełnego przepływu nauki (diagnoza, plan, historia własnej nauki).
- **Rodzic** — widzi postępy swojego dziecka (zakres uprawnień rodzica poza samym podglądem postępów — do doprecyzowania).

Zachowanie niezalogowanego użytkownika trafiającego na chronioną trasę: nie sprecyzowano.

## Success Criteria

### Primary
- Uczeń loguje się / zakłada profil, przechodzi diagnozę poziomu umiejętności i obszarów z lukami (zakres klas 7-8), otrzymuje mapę luk, dostaje statyczną uporządkowaną listę ćwiczeń w zdiagnozowanych obszarach, ćwiczy zadania z listy, i widzi swój postęp (ukończone/pozostałe).

### Secondary
- Uczeń wraca do aplikacji więcej niż raz.

### Guardrails
- Zero halucynacji — każda odpowiedź ugruntowana w repozytorium wiedzy.

## Functional Requirements

### Dostęp
- FR-001: Uczeń może się zalogować / założyć profil. Priority: must-have
  > Socrates: Brak kontrargumentu; zostaje jak jest.

### Diagnoza
- FR-002: Uczeń może przejść diagnozę poziomu umiejętności i obszarów z lukami (zakres klas 7-8). Priority: must-have
  > Socrates: Kontrargument rozważony: "uczeń często już wie, w czym ma problem — wymuszanie pełnej diagnozy to ignoruje". Rozstrzygnięcie: diagnoza zostaje obowiązkowa dla wszystkich — subiektywne poczucie ucznia bywa mylące, diagnoza weryfikuje realny stan.
- FR-003: Uczeń może zobaczyć wynik diagnozy — mapę swoich luk. Priority: must-have
  > Socrates: Kontrargument rozważony: "mapa luk jest bardziej wartościowa dla rodzica niż dla ucznia". Rozstrzygnięcie: uczeń widzi pełną mapę luk w MVP; osobny, szczegółowy widok dla rodzica to praca na v2, gdy rola rodzica wraca do zakresu.

### Ćwiczenia i informacja zwrotna
- FR-004: Uczeń może zobaczyć uporządkowaną listę ćwiczeń dopasowaną do zdiagnozowanych luk. Priority: must-have
  > Socrates: Kontrargument rozważony: "statyczna lista nie dostosowuje się, gdy uczeń szybko nadrobi jedną lukę". Rozstrzygnięcie: lista zostaje statyczna w kolejności — ukończone pozycje znikają z listy, co pokrywa się z FR-006 (widoczny postęp); dynamiczne re-planowanie to praca na v2.
- FR-005: Uczeń otrzymuje informację zwrotną o poprawności odpowiedzi wraz z wyjaśnieniem ugruntowanym w repozytorium wiedzy. Priority: must-have
  > Socrates: Brak kontrargumentu; zostaje jak jest.
- FR-007: Uczeń może zadać dodatkowe pytanie / dopytać o wyjaśnienie w dowolnym momencie, otrzymując odpowiedź ugruntowaną w repozytorium wiedzy. Priority: must-have
  > Socrates: Brak kontrargumentu; zostaje jak jest.

### Postęp
- FR-006: Uczeń może zobaczyć swój postęp (ukończone / pozostałe ćwiczenia). Priority: must-have
  > Socrates: Brak kontrargumentu; zostaje jak jest.

## User Stories

### US-01: Uczeń diagnozuje i nadrabia luki przed egzaminem ósmoklasisty

- **Given** zalogowany uczeń bez wcześniejszej diagnozy
- **When** przechodzi diagnozę poziomu umiejętności
- **Then** otrzymuje mapę swoich luk i uporządkowaną listę ćwiczeń dopasowaną do tych luk, a każde ćwiczenie daje odpowiedź ugruntowaną w repozytorium wiedzy (bez halucynacji)

#### Acceptance Criteria
- Diagnoza obejmuje zakres klas 7-8 (egzamin ósmoklasisty)
- Lista ćwiczeń jest widocznie powiązana ze zdiagnozowanymi lukami (uczeń widzi dlaczego dane ćwiczenie mu wskazano)
- Każda odpowiedź systemu (feedback, dopytanie) jest ugruntowana w repozytorium wiedzy — zero halucynacji
- Uczeń widzi swój postęp w trakcie i po sesji

## Business Logic

**System diagnozuje luki ucznia i dobiera ćwiczenia dopasowane do jego indywidualnego poziomu.**

Regułę zasilają odpowiedzi ucznia na zestaw pytań diagnostycznych obejmujący zakres klas 7-8 — poprawność i błędy tych odpowiedzi wskazują konkretne obszary, w których uczeń ma luki.

Wyjściem reguły jest uporządkowana lista ćwiczeń, w której obszary o największej luce idą jako pierwsze — priorytetyzacja według wielkości/wagi zdiagnozowanej luki, a nie według z góry ustalonej kolejności programu.

Uczeń spotyka tę regułę jako ciągłość doświadczenia: kończy diagnozę i od razu dostaje gotową, uporządkowaną listę ćwiczeń do wykonania — bez potrzeby samodzielnego decydowania, od czego zacząć.

## Non-Functional Requirements

- Uczeń otrzymuje odpowiedź (feedback po ćwiczeniu / odpowiedź na dopytanie) w czasie < 3 sekund od wysłania zapytania.

## Non-Goals

- **Widok rodzica (podgląd postępów dziecka)** — odłożony do v2; MVP skupia się wyłącznie na uczniu.
- **Agregacja danych między uczniami** (uczenie się reguły doboru ćwiczeń z danych wielu osób) — możliwe ulepszenie reguły domenowej przy większej skali, ale poza zakresem MVP.
- **Wykraczanie poza zakres klas 7-8 / matematykę** — MVP obejmuje wyłącznie matematykę na poziomie klas 7-8 (przygotowanie do egzaminu ósmoklasisty), żadnych innych przedmiotów ani poziomów.
