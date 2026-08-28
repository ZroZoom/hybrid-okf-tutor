# Hybrid OKF Tutor — projekt MVP na 4 godziny

- **Data:** 28 sierpnia 2026
- **Status:** zatwierdzony kierunek demo
- **Zespół:** 2 osoby
- **Limit czasu:** 4 godziny

## Cel

Zbudować publiczne, maksymalnie 60-sekundowe demo, w którym tutor pomaga uczniowi samodzielnie rozwiązać jedno zadanie o polu trapezu. Tutor nie podaje rozwiązania z góry: zadaje krótkie pytania, sprawdza kolejne kroki i udziela stopniowanych podpowiedzi.

Demo ma pokazać zasadę z zaakceptowanej specyfikacji P0:

> LLM interpretuje pytanie → OKF dostarcza wiedzę → warstwa deterministyczna składa odpowiedź.

Ten dokument zawęża prezentację P0 do jednego stabilnego walkthrough. Nie zastępuje specyfikacji, planu implementacji ani ADR-ów 0001–0006.

Jest to jawny time-box override dla tej czterogodzinnej sesji: pięć przypadków wymaganych przez pierwotną specyfikację pozostaje backlogiem pełnego P0, natomiast bramką demo na dziś jest jeden przechodzący end-to-end walkthrough.

## Scenariusz demonstracyjny

Jedyny przygotowany przykład:

> Trapez ma podstawy długości 6 cm i 10 cm oraz wysokość 4 cm. Oblicz jego pole.

Przepływ:

1. Juror wybiera „Rozpocznij demo”.
2. Tutor pokazuje zadanie i pyta: „Jaki jest wzór na pole trapezu?”.
3. Uczeń podaje wzór. Tutor sprawdza go względem wiedzy pobranej z OKF.
4. Tutor pyta, jakie wartości należy podstawić za podstawy i wysokość.
5. Uczeń zapisuje podstawienie. Tutor sprawdza krok deterministycznie.
6. Tutor prosi ucznia o samodzielne wykonanie obliczenia.
7. Uczeń podaje wynik. Tutor zatwierdza go dopiero po próbie ucznia.

Przy błędzie tutor nie ujawnia od razu rozwiązania. Najpierw wskazuje etap wymagający poprawy i zadaje jedno pomocnicze pytanie. Podpowiedź może ujawnić wzór z OKF, ale nie finalny wynik liczbowy.

## UI walkthrough

Jedna responsywna strona, bez logowania:

- nagłówek z jednym CTA „Rozpocznij demo”;
- karta z treścią zadania i prostym rysunkiem trapezu;
- rozmowa prowadzona po jednym kroku;
- pole odpowiedzi ucznia oraz gotowe przykładowe odpowiedzi do szybkiego przejścia prezentacji;
- kompaktowy panel „Jak powstała pomoc”: interpretacja Luna → koncept/atom OKF → reguła deterministyczna;
- badge `DEV/UNREVIEWED`, gdy użyty koncept lub atom ma status draft/pending.

Walkthrough jest rzeczywistym przepływem aplikacji, a nie serią statycznych tooltipów. Gotowe odpowiedzi tylko wypełniają pole i zapewniają powtarzalność prezentacji.

## Architektura

```text
Odpowiedź ucznia
→ Vercel Route Handler
→ gpt-5.6-luna / strict Structured Outputs
→ prywatne read-only OKF API
→ searchConcepts(query, subject, level)
→ getConcept(conceptId, level)
→ deterministyczna maszyna kroków
→ pytanie, podpowiedź albo potwierdzenie
```

Luna rozpoznaje cel wypowiedzi, pojęcie i rodzaj odpowiedzi. Nie dostarcza wzoru ani żadnych faktów matematycznych. Wzór pochodzi z OKF. Lokalna warstwa deterministyczna kontroluje kolejność pytań i sprawdza odpowiedzi ucznia.

Maszyna walkthrough ma cztery stany:

1. `recall_formula` — przypomnienie wzoru;
2. `substitute_values` — przypisanie i podstawienie danych;
3. `calculate` — samodzielne obliczenie;
4. `complete` — potwierdzenie rozwiązania.

Stan nie jest zapisywany w bazie. Demo nie tworzy profilu ani historii ucznia.

## Sprawdzanie odpowiedzi

Zakres walidatora jest celowo ograniczony do przygotowanego przykładu:

- normalizacja popularnych zapisów wzoru na pole trapezu;
- sprawdzenie użycia danych `6`, `10` i `4` w prawidłowych rolach;
- deterministyczne sprawdzenie wyniku i jednostki;
- jawne „spróbuj jeszcze raz” dla odpowiedzi, której walidator nie rozumie.

Walidator nie jest ogólnym CAS-em ani generatorem rozwiązań. Parametry zadania i oczekiwane checkpointy są fixture'em demonstracyjnym; fakt edukacyjny — wzór na pole trapezu — musi pochodzić z OKF.

Oczekiwana postać wzoru jest budowana z wybranego atomu OKF, a nie wpisana drugi raz w kodzie aplikacji. Fixture może zawierać wyłącznie dane liczbowe zadania i oczekiwany wynik obliczony deterministycznie.

## Minimalne bezpieczeństwo

Istniejąca zasada safety nadal ma pierwszeństwo. P0 obsługuje minimalny deterministyczny short-circuit dla jawnego sygnału kryzysowego zgodnie z planem implementacji. Rozbudowane rozpoznawanie emocji i dodatkowe scenariusze wspierające nie wchodzą do walkthrough.

## Podział pracy

### Osoba A — OKF

- prywatna Supabase Edge Function z dokładnie dwiema operacjami;
- weryfikacja pokrycia konceptu „trapez” i atomu ze wzorem;
- filtrowanie poziomu, statusy review i negatywny smoke autoryzacji;
- przekazanie stabilnego kontraktu oraz przykładowych odpowiedzi osobie B.

### Osoba B — aplikacja

- bootstrap Next.js i jedna strona walkthrough;
- adapter Luna ze strict Structured Outputs;
- deterministyczna maszyna kroków i walidator przygotowanego zadania;
- Vercel Route Handler, panel trace i deploy.

Osoba B zaczyna z fake `OkfRepository` zgodnym z finalnym kontraktem. Po smoke API podmienia go na implementację HTTP bez zmiany logiki domenowej.

## Harmonogram

- **0:00–0:30:** bootstrap, kontrakty, fixture zadania i podział odpowiedzialności;
- **0:30–1:30:** równolegle Edge Function oraz UI/maszyna kroków na fake repository;
- **1:30–2:30:** Luna, Route Handler i integracja z live OKF;
- **2:30–3:15:** dopracowanie walkthrough, trace i minimalnego safety;
- **3:15–3:45:** testy, build, deploy, secret scan i production smoke;
- **3:45–4:00:** próba prezentacji oraz bufor naprawczy.

Jeśli live OKF nie przejdzie smoke do końca 1:30, zespół nie dodaje nowych funkcji. Diagnozuje wyłącznie kontrakt i autoryzację, ponieważ działające połączenie z OKF jest warunkiem wartości demo.

## Poza zakresem

- logowanie, profile i zapisywanie postępu;
- diagnoza luk oraz plan ćwiczeń;
- generator zadań i dowolne zadania wpisywane przez użytkownika;
- ogólny parser matematyczny lub CAS;
- panel rodzica;
- MCP, fallback modelu i dodatkowi dostawcy;
- rozbudowany design system;
- pełny zakres przypadków demonstracyjnych z pierwotnej specyfikacji.

## Definition of Done

MVP jest gotowe, gdy:

- publiczny URL prowadzi przez cały walkthrough bez ręcznej ingerencji technicznej;
- Luna zwraca walidowany structured output i nie jest źródłem faktów edukacyjnych;
- wzór pochodzi z live OKF przez `searchConcepts` i `getConcept`;
- tutor nie pokazuje finalnego wyniku przed próbą ucznia;
- poprawna oraz błędna odpowiedź na każdym z trzech kroków mają deterministyczne zachowanie;
- trace pokazuje podział odpowiedzialności bez ujawniania promptów, sekretów ani surowych danych DB;
- draft/pending jest oznaczone `DEV/UNREVIEWED`;
- browser nie otrzymuje `service_role`;
- testy, lint i build są zielone, a produkcyjny smoke przechodzi.

## Jednozdaniowy pitch

> Hybrid OKF Tutor nie rozwiązuje zadania za ucznia — rozumie jego odpowiedź, prowadzi pytaniami i opiera każdą matematyczną podpowiedź na kontrolowanej wiedzy OKF.
