# Streaming odpowiedzi

`POST /api/chat` oraz `/api/agents` zwracają NDJSON bez buforowania całej odpowiedzi. Adapter OpenRouter używa `streamText` i `partialOutputStream`: wysyła czytelne fragmenty pola `message`, a na końcu waliduje cały wynik. Surowy JSON i argumenty narzędzi nie trafiają do tekstu czatu.

Zdarzenia to `start`, `text` (rosnący pełny tekst), `complete` i `error`. Brak zdarzenia końcowego jest błędem połączenia, a nie powodem pozostawienia kropek. Parser obsługuje podzielone znaki UTF-8 i wiele zdarzeń w jednym pakiecie. Każdy opublikowany fragment jest najpierw zapisywany do jednej aktualizowanej wiadomości asystenta w D1. Końcowy wynik i status są zapisywane przed `complete`.

Przeglądarka rozdziela tekst otrzymany od tekstu wyświetlonego, zgodnie z podejściem Aiwise. Jeden zegar `requestAnimationFrame` działa niezależnie od tempa pakietów. Większy bufor przyspiesza wyświetlanie; animacja kończy ujawnianie także po zakończeniu sieci. Granice grafemów chronią polskie znaki i emoji. Ustawienie ograniczonego ruchu wyświetla tekst od razu, również po zmianie w trakcie animacji. Źródła pojawiają się po ujawnieniu całego tekstu.

Przycisk zatrzymania przerywa żądanie; częściowy tekst pozostaje widoczny i zapisany. Limit generowania wynosi 30 sekund, a klienta 45 sekund. Przewijanie śledzi faktyczny wzrost tekstu i przestaje podążać za odpowiedzią, gdy użytkownik przewinie w górę.

## Weryfikacja

- `bun run test:pure`: adapter OpenRouter ze strumieniowaną odpowiedzią fixture, parser, anulowanie, walidacja, grafemy i adaptacyjne tempo.
- `bun run test:integration`: rzeczywisty adapter SDK → lokalne D1 → odpowiedź HTTP → parser klienta. Test zatrzymuje zakończenie modelu, aż pierwszy fragment będzie odczytany i znaleziony w bazie.
- `bun run test:e2e`: przeglądarka, odpowiedzi w paczkach, bardzo częste aktualizacje, ograniczony ruch, zatrzymanie, reset i przewijanie.

Te testy nie potrzebują tokenu ani płatnych wywołań modeli. CI uruchamia testy pure; testy z rzeczywistym modelem pozostają osobnym, ręcznym poleceniem `eval:openrouter`.
