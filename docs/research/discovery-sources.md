# Wiedza — źródła raportu

Fragmenty raportu są używane przez agenta „Wiedza”. Moduł odczytu pozostaje w
`agents/odkrywaj/knowledge.ts`; zakładka „Dopasuj” (wewnętrzne ID `odkrywaj`)
korzysta z biblioteki innowacji i dokumentacji projektów.

Katalog: [Raporty z badań ROPS](https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan).

Wykorzystany raport: [Usługi społeczne w Małopolsce – deficyty, potrzeby, potencjał rozwojowy. Zaktualizowane wnioski z diagnozy](https://rops.krakow.pl/pliki-do-pobrania/wpis,2025-uslugi-spoleczne-w-malopolsce-deficyty-potrzeby-potencjal-rozwojowy-zaktualizowane-wnioski-z-diagnozy,1348), ROPS w Krakowie, 2025. Licencja CC BY 4.0, potwierdzona na stronie 2 PDF.

`agents/odkrywaj/knowledge.ts` korzysta z pięciu istniejących, zweryfikowanych faktów w `docs/research/sources/rops-2025-uslugi-spoleczne-diagnoza.notes.json`. Fragmenty dotyczą seniorów (strona 25) i usług opiekuńczych (strona 26), na podstawie danych z 2024 r. Lokalny PDF jest dostępny obok notatek. Wyszukiwanie jest leksykalne i tylko do odczytu; nie indeksuje całego katalogu ani pełnego PDF. Nie potwierdza aktualnej dostępności usług lub potrzeb konkretnej gminy.

Weryfikacja: katalog i obecność publikacji potwierdzone 3 października 2026 przez wyniki wyszukiwania oficjalnej strony ROPS. Bezpośrednie otwarcie katalogu w narzędziu przeglądarki zwróciło HTTP 403. Treść wybranych faktów można zweryfikować lokalnie poleceniem `pdftotext -f 25 -l 26 -layout docs/research/sources/rops-2025-uslugi-spoleczne-diagnoza.pdf -`.

Kolejny krok: import dalszych raportów z kontrolą pochodzenia, stron i dat danych. Wybrane materiały należy traktować jako treści do odczytu, nigdy jako instrukcje dla modelu.
