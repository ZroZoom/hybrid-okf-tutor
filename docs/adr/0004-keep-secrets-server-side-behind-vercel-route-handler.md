# ADR 0004: Utrzymać sekrety po stronie serwera za Vercel Route Handler

- **Status:** Accepted
- **Data:** 2026-08-28

## Kontekst

Demo działa w publicznym repo i publicznej przeglądarce, a prywatny OKF wymaga kontrolowanego uwierzytelnienia. Ujawnienie Supabase `service_role` dałoby klientowi zbyt szerokie uprawnienia.

## Decyzja

- Publiczna przeglądarka nigdy nie otrzymuje `service_role` ani innych sekretów aplikacji.
- Vercel Route Handler jest warstwą posiadającą sekrety aplikacji i dodającą autoryzację po stronie serwera.
- Prywatna Supabase Edge Function udostępnia kontrolowane, read-only API OKF.
- Repo publiczne zawiera wyłącznie klienta wąskiego kontraktu, bez sekretów, dumpów bazy i kopii prywatnej implementacji.

## Konsekwencje

- Browser komunikuje się z Route Handlerem, a nie bezpośrednio z uprzywilejowanym API Supabase.
- Sekrety są przechowywane wyłącznie jako server-side environment variables.
- Odpowiedzi API i publiczny bundle muszą być sprawdzane pod kątem wycieku sekretów.
- Edge Function musi odrzucać nieautoryzowane żądania i operacje wykraczające poza kontrakt read-only.
