# ADR 0002: LLM interpretuje, OKF jest źródłem faktów edukacyjnych

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

Demo ma rozumieć naturalne, potoczne i kontekstowe pytania ucznia, jednocześnie ograniczając ryzyko halucynacji i odpowiedzi nieopartych na kontrolowanej wiedzy.

## Decyzja

Obowiązuje główna zasada architektury:

> LLM interpretuje pytanie → OKF dostarcza wiedzę → warstwa deterministyczna składa odpowiedź.

LLM zwraca mały, walidowany structured intent. Nie jest źródłem faktów edukacyjnych. Koncepty, atomy, relacje, powiązania z programem i umiejętności pochodzą z kontrolowanego OKF. Warstwa deterministyczna wybiera właściwe dane i składa odpowiedź albo jawnie informuje o braku pokrycia.

Primary model to `gpt-5.6-luna`, używany przez OpenAI Responses API ze strict Structured Outputs. Ta decyzja nie oznacza jeszcze implementacji modelu.

## Konsekwencje

- Nie używamy wiedzy własnej modelu do uzupełniania brakujących faktów edukacyjnych.
- Niejednoznaczność prowadzi do pytania doprecyzowującego zamiast zgadywania.
- Brak odpowiednich danych OKF prowadzi do jawnego braku odpowiedzi, nie do halucynacji.
- Zmiana modelu interpretującego nie może zmieniać logiki domenowej ani źródła wiedzy.
