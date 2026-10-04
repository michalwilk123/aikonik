import type { AgentArtifact } from "@/agents/types";
import type { GrantCall } from "@/domain/grants";

type DemoCase = {
  source: "contact" | "dodaj-pomysl" | "testuj-innowacje" | "grant-application";
  name: string;
  title: string;
  status: "new" | "in-progress" | "waiting" | "completed" | "rejected";
  message: string;
  notes: string;
  fields?: Record<string, string>;
  replies?: [string, string];
};

const cases: DemoCase[] = [
  {
    source: "contact",
    name: "Agnieszka Wójcik",
    title: "Tarnów — konsultacja pomysłu na klub opiekunów",
    status: "new",
    message:
      "Dzień dobry, prowadzę nieformalną grupę opiekunów osób starszych w Tarnowie. Spotykamy się raz w miesiącu, ale chcielibyśmy uruchomić regularne dyżury wzajemnej pomocy. Czy możemy skonsultować pomysł przed przygotowaniem zgłoszenia? Najłatwiej znaleźć mi czas we wtorki po 16.00. Zależy nam także na udziale osób, które nie korzystają z internetu.",
    notes:
      "Zaproponować konsultację i zapytać o liczbę opiekunów oraz sposób organizacji zastępstw.",
  },
  {
    source: "contact",
    name: "Michał Zając",
    title: "Nowy Sącz — dostępny formularz dla uczestników warsztatów",
    status: "in-progress",
    message:
      "Przygotowujemy warsztaty w stowarzyszeniu Sądecka Przestrzeń. Część uczestników korzysta z czytnika ekranu, a inni wolą zgłosić się telefonicznie. Szukamy wskazówek, jak opisać wydarzenie prostym językiem i zebrać potrzeby związane z dostępnością bez proszenia o diagnozę. Czy mają Państwo przykładową listę pytań?",
    notes:
      "Omówić dostępność miejsca, transport i alternatywę dla formularza internetowego. Organizacja fikcyjna.",
    replies: [
      "Dzień dobry, proponuję pytać o potrzebne wsparcie, np. tłumaczenie, spokojne miejsce lub pomoc w dotarciu, zamiast o diagnozę. Czy warsztaty odbędą się w jednym miejscu i czy przewidują Państwo zapisy telefoniczne?",
      "Tak, mamy jedną salę na parterze i osobę do zapisów telefonicznych. Potrzebujemy jeszcze krótkiego tekstu zaproszenia; warsztaty planujemy dla 18 osób.",
    ],
  },
  {
    source: "contact",
    name: "Joanna Król",
    title: "Olkusz — partnerzy do pilotażu wolontariatu",
    status: "waiting",
    message:
      "Chcemy połączyć młodzież i seniorów w lokalnym programie wolontariatu. Na początek planujemy sześć spotkań, podczas których seniorzy uczyliby młodszych drobnych napraw, a młodzież pomagałaby w obsłudze telefonu. Czy przy szukaniu partnerów powinniśmy zacząć od biblioteki czy od klubu seniora?",
    notes:
      "Czekamy na potwierdzenie dostępności sali i osoby koordynującej. Nie przedstawiać potencjalnych partnerów jako potwierdzonych.",
    replies: [
      "Oba miejsca mogą być dobrym punktem kontaktu. Proszę najpierw ustalić, kto udostępni salę i kto poprowadzi rekrutację. Czy mają już Państwo koordynatora oraz wstępną zgodę któregoś z miejsc?",
      "Biblioteka jest zainteresowana rozmową, ale jeszcze niczego nie potwierdziła. Wrócę z informacją po spotkaniu z zespołem w przyszłym tygodniu.",
    ],
  },
  {
    source: "contact",
    name: "Piotr Mazur",
    title: "Bochnia — konsultacja zakończona, szkic gotowy do zgłoszenia",
    status: "completed",
    message:
      "Przygotowujemy mały projekt wymiany umiejętności między mieszkańcami Bochni. Mamy sześciu wolontariuszy i chcemy zacząć od jednego osiedla. Proszę o pomoc w odróżnieniu opisu działań od celu projektu.",
    notes:
      "Wyjaśniono różnicę między działaniem a rezultatem. Klient przygotuje osobne zgłoszenie pomysłu; konsultacja zakończona.",
    replies: [
      "Działanie to np. sześć spotkań sąsiedzkich. Cel opisuje zmianę: dziesięć osób będzie potrafiło samodzielnie wykonać wybraną drobną naprawę. Warto ustalić, jak sprawdzą Państwo tę umiejętność po spotkaniu.",
      "Dziękuję, to nam bardzo pomogło. Dopisaliśmy krótką ankietę i zadanie praktyczne. Przejdziemy teraz do formularza pomysłu.",
    ],
  },
  {
    source: "dodaj-pomysl",
    name: "Katarzyna Nowak",
    title: "Ławka kontaktu — sąsiedzka pomoc na krakowskim osiedlu",
    status: "new",
    message:
      "Na naszym osiedlu w Nowej Hucie wiele starszych osób mieszka samotnie. Chcemy zacząć od prostego telefonu do koordynatorki i krótkich wizyt sąsiedzkich, bez obowiązku używania aplikacji.",
    notes:
      "Pełny szkic do pierwszej konsultacji. Ustalić zasady bezpieczeństwa wizyt i granice pomocy wolontariuszy.",
    fields: {
      "Opis pomysłu":
        "Pilotaż sąsiedzkiego wsparcia dla 15 seniorów w Nowej Hucie: telefon do koordynatorki, pomoc w zakupach i wspólne spacery.",
      Problem:
        "Samotnie mieszkającym seniorom brakuje osoby, którą mogą poprosić o niewielką codzienną pomoc. Pomysł wynika z rozmów inicjatorki z ośmioma sąsiadami, nie z reprezentatywnego badania.",
      Odbiorcy:
        "15 osób w wieku 65+ z jednego osiedla, w tym osoby bez smartfona; sześciu lokalnych wolontariuszy.",
      Rozwiązanie:
        "Ośmiotygodniowy test. Koordynatorka przyjmuje zgłoszenia przez telefon, uzgadnia zakres pomocy i łączy seniora z parą przeszkolonych wolontariuszy.",
      "Kto zapłaci i kto zdecyduje":
        "O udział decyduje senior. Finansowanie pilotażu chcemy uzgodnić z lokalną organizacją; nie ma jeszcze decyzji o wsparciu.",
      "Propozycja wartości":
        "Łatwiejsze zakupy i wyjścia z domu, jeden znany numer kontaktowy, większe poczucie bezpieczeństwa oraz regularny kontakt z sąsiadami.",
      "Kto pomoże, a kto przeszkodzi":
        "Pomóc mogą wolontariusze i administrator osiedla. Bariery: brak zaufania do obcych, nieobecności wolontariuszy i oczekiwanie pomocy medycznej, której nie świadczymy.",
      "Struktura kosztów":
        "Koordynacja 2 400 zł, szkolenie i ubezpieczenie 1 200 zł, telefon i wydruki 400 zł, rezerwa 500 zł. Razem 4 500 zł na osiem tygodni.",
      "Źródła dochodów":
        "Planowany mikrogrant i wkład rzeczowy partnera. Żadne źródło finansowania nie jest jeszcze potwierdzone; udział seniorów bezpłatny.",
      "Jak dotrzeć do odbiorców":
        "Papierowe zaproszenia na klatkach, spotkanie informacyjne i polecenia sąsiadów. Zgłoszenie telefoniczne lub osobiste.",
      Partnerzy:
        "Potencjalni: klub seniora i lokalna biblioteka. Trwają wstępne rozmowy o miejscu spotkania; brak formalnych zobowiązań.",
      Cel: "15 seniorów skorzysta z co najmniej dwóch wizyt. Sprawdzimy liczbę wykonanych zgłoszeń i ocenę poczucia wsparcia przed oraz po teście.",
    },
  },
  {
    source: "dodaj-pomysl",
    name: "Magdalena Lis",
    title: "Mobilna pracownia napraw — gmina Limanowa",
    status: "in-progress",
    message:
      "Chcemy organizować spotkania naprawcze w świetlicach wiejskich. Starsi mieszkańcy mają umiejętności, którymi mogliby podzielić się z młodzieżą, a uczestnicy nie musieliby dojeżdżać do miasta.",
    notes:
      "Doprecyzować odpowiedzialność za narzędzia. Pilotaż obejmuje szycie i naprawy mechaniczne; bez urządzeń elektrycznych.",
    fields: {
      "Opis pomysłu":
        "Cztery sobotnie pracownie napraw w dwóch miejscowościach gminy Limanowa, prowadzone przez mieszkańców.",
      Problem:
        "Brak niedrogich zajęć łączących pokolenia i możliwości naprawy drobnych przedmiotów blisko miejsca zamieszkania.",
      Odbiorcy:
        "24 mieszkańców, w tym 12 osób w wieku 60+ i 12 osób w wieku 15–24 lata. Osoby niepełnoletnie za zgodą opiekuna.",
      Rozwiązanie:
        "Dwie mobilne skrzynie narzędzi, instruktor i cztery warsztaty po trzy godziny. Uczestnicy naprawiają odzież, rowery i drobne przedmioty domowe.",
      "Struktura kosztów":
        "Narzędzia 2 000 zł, instruktorzy 1 800 zł, transport 700 zł, materiały 500 zł; łącznie 5 000 zł.",
      Partnerzy:
        "Potencjalne partnerstwo z dwiema świetlicami i grupą wolontariuszy; terminy sal wymagają potwierdzenia.",
      Cel: "Naprawić co najmniej 30 przedmiotów i sprawdzić, czy 16 uczestników potrafi powtórzyć jedną naprawę samodzielnie.",
    },
    replies: [
      "Pomysł ma jasno określoną skalę. Proszę doprecyzować, kto odpowiada za instruktaż i jakich napraw nie podejmą się Państwo podczas testu.",
      "Instruktaż poprowadzą dwie osoby z doświadczeniem warsztatowym. Wykluczamy naprawy elektryczne i gazowe. Dodamy regulamin korzystania z narzędzi.",
    ],
  },
  {
    source: "dodaj-pomysl",
    name: "Ewa Dudek",
    title: "Spokojna godzina — dostępne spotkania w Wieliczce",
    status: "waiting",
    message:
      "Mój pomysł to spokojne spotkania w bibliotece dla dorosłych, którym przeszkadza hałas i tłok. Bez muzyki w tle, z przewidywalnym planem i możliwością wyjścia do cichego pokoju.",
    notes:
      "Czekamy na konsultację z przyszłymi uczestnikami. Nie dobierać grupy wyłącznie na podstawie opinii opiekunów.",
    fields: {
      "Opis pomysłu":
        "Sześć kameralnych spotkań czytelniczych w Wieliczce, z planem w prostym języku i ograniczoną liczbą bodźców.",
      Problem:
        "Głośne wydarzenia utrudniają części mieszkańców uczestnictwo w życiu kulturalnym.",
      Odbiorcy:
        "Osiem dorosłych osób potrzebujących spokojniejszego otoczenia; udział bez wymogu przedstawiania diagnozy.",
      Rozwiązanie:
        "Stała grupa, sześć spotkań po 60 minut, plan przesyłany wcześniej, brak muzyki i możliwość przerwy w osobnym pomieszczeniu.",
      "Propozycja wartości":
        "Przewidywalność, możliwość samodzielnego wyboru aktywności i kontakt z innymi bez presji pozostania do końca.",
      "Struktura kosztów":
        "Prowadzenie 1 800 zł, materiały 400 zł, konsultacja dostępności 600 zł; razem 2 800 zł.",
      Partnerzy:
        "Biblioteka jako potencjalny gospodarz. Dostępność osobnego pokoju jest jeszcze sprawdzana.",
      Cel: "Co najmniej sześć osób weźmie udział w czterech spotkaniach i oceni warunki jako odpowiadające swoim potrzebom.",
    },
    replies: [
      "Proszę zaprosić przyszłych uczestników do oceny planu spotkania i sposobu komunikacji. Czy można też sprawdzić, jak będzie wyglądała przerwa w osobnym pokoju?",
      "Przygotujemy krótkie spotkanie próbne dla trzech osób. Czekamy jeszcze na potwierdzenie dostępności pokoju; prześlę ich uwagi po próbie.",
    ],
  },
  {
    source: "dodaj-pomysl",
    name: "Tomasz Sikora",
    title: "Sąsiedzki kurs do lekarza — Chrzanów",
    status: "rejected",
    message:
      "Chciałbym zorganizować odpłatne przejazdy mieszkańców do poradni, korzystając z prywatnych samochodów znajomych. Na początek planuję przyjmować wszystkie zgłoszenia z powiatu.",
    notes:
      "Zamknięto obecną wersję szkicu: brak ograniczenia skali, zasad bezpieczeństwa i wyjaśnienia modelu odpłatnych przejazdów. Możliwy powrót z projektem towarzyszenia w istniejącym transporcie.",
    fields: {
      Problem:
        "Część mieszkańców potrzebuje pomocy w dotarciu na umówioną wizytę.",
      Odbiorcy:
        "Dorośli mieszkańcy powiatu chrzanowskiego; liczba osób nie została oszacowana.",
      Rozwiązanie:
        "Odpłatne przejazdy prywatnymi samochodami. Pomysł nie ma jeszcze ustalonych zasad bezpieczeństwa ani odpowiedzialności.",
      "Struktura kosztów":
        "Nie ustalono kosztów ubezpieczenia, koordynacji ani zasad rozliczania przejazdów.",
      Cel: "Wymaga doprecyzowania skali oraz sposobu pomiaru dostępności dojazdu.",
    },
    replies: [
      "Nie możemy rekomendować pilotażu w obecnej postaci. Potrzebne są zasady bezpieczeństwa, odpowiedzialności i wyjaśnienie modelu odpłatności. Można rozważyć mniejszy test towarzyszenia mieszkańcom w korzystaniu z istniejących form transportu.",
      "Rozumiem. Zamknijmy ten szkic; porozmawiam z grupą o pomocy w planowaniu dojazdu i wrócę z mniejszym pomysłem.",
    ],
  },
  {
    source: "testuj-innowacje",
    name: "Anna Baran",
    title: "Sucha Beskidzka — test telefonu sąsiedzkiego dla seniorów",
    status: "new",
    message:
      "Reprezentuję fikcyjną grupę Sąsiedzi spod Babiej Góry. Chcemy sprawdzić, czy stały numer telefonu ułatwi seniorom proszenie o drobną pomoc. Mamy koordynatorkę i pięciu chętnych wolontariuszy.",
    notes:
      "Przed startem omówić zgody, grafik zastępstw i procedurę sytuacji wymagających profesjonalnej pomocy.",
    fields: {
      "Co chcemy testować":
        "Telefon sąsiedzki: przyjmowanie potrzeb i umawianie wolontariuszy.",
      "Miejsce testu": "Sucha Beskidzka, jedno osiedle.",
      Uczestnicy: "12 seniorów i pięciu wolontariuszy.",
      "Plan testu":
        "Sześć tygodni, dyżur telefoniczny trzy razy w tygodniu po dwie godziny.",
      "Jak sprawdzimy efekt":
        "Liczba zgłoszeń, czas znalezienia wolontariusza i krótka rozmowa z każdym uczestnikiem.",
      "Potrzebne wsparcie":
        "Wzór grafiku, konsultacja zasad bezpieczeństwa i pomoc w zbieraniu informacji zwrotnej.",
    },
  },
  {
    source: "testuj-innowacje",
    name: "Paweł Kołodziej",
    title: "Nowy Targ — próba instrukcji zakupowych w prostym języku",
    status: "in-progress",
    message:
      "W fikcyjnej pracowni Krok po Kroku chcemy przetestować obrazkowe listy zakupów z osobami potrzebującymi wsparcia w codziennych czynnościach. Zależy nam, żeby uczestnicy sami ocenili instrukcje.",
    notes:
      "Dwie wersje instrukcji, bez porównywania uczestników między sobą. Zbierać tylko dane potrzebne do oceny materiału.",
    fields: {
      "Co chcemy testować": "Lista zakupów z piktogramami i prostym tekstem.",
      "Miejsce testu":
        "Nowy Targ; próbne zadanie w pracowni, potem wyjście do sklepu.",
      Uczestnicy:
        "Ośmiu dorosłych uczestników, każdy może wybrać osobę wspierającą.",
      "Plan testu":
        "Cztery spotkania w ciągu miesiąca, dwie wersje listy i wspólne omówienie.",
      "Jak sprawdzimy efekt":
        "Czy instrukcja jest zrozumiała, które elementy wymagają wyjaśnienia i którą wersję wybiera uczestnik.",
      "Potrzebne wsparcie":
        "Konsultacja prostego języka i sprawdzenie czytelności piktogramów.",
    },
    replies: [
      "Proszę zacząć od próby w spokojnym miejscu i dać uczestnikom możliwość zmiany piktogramów. Czy każda osoba będzie mogła odmówić wyjścia do sklepu?",
      "Tak, wyjście będzie dobrowolne. Dwie osoby wolą zostać w pracowni; uwzględnimy ich ocenę na równi z pozostałymi.",
    ],
  },
  {
    source: "testuj-innowacje",
    name: "Monika Górska",
    title: "Gorlice — test krótkich spotkań dla opiekunów",
    status: "waiting",
    message:
      "Przygotowujemy test grupy wsparcia dla osób opiekujących się bliskimi. Zamiast długich warsztatów proponujemy spotkania po 45 minut, możliwe także przez telefon.",
    notes:
      "Czekamy na preferencje godzinowe uczestników. Nie obiecywać opieki zastępczej, której organizator jeszcze nie zapewnił.",
    fields: {
      "Co chcemy testować":
        "Krótka grupa wymiany doświadczeń, z możliwością udziału telefonicznego.",
      "Miejsce testu": "Gorlice i pobliskie miejscowości.",
      Uczestnicy: "Dziesięciu opiekunów nieformalnych.",
      "Plan testu":
        "Sześć spotkań po 45 minut; porównanie dwóch godzin rozpoczęcia.",
      "Jak sprawdzimy efekt":
        "Frekwencja, przyczyny rezygnacji i samoocena przydatności spotkań.",
      "Potrzebne wsparcie":
        "Pomoc w zaplanowaniu rekrutacji i doborze prostych pytań ewaluacyjnych.",
    },
    replies: [
      "Warto przed ustaleniem grafiku zapytać uczestników o dostępność i o to, czy potrzebują pomocy na czas spotkania. Czy mogą Państwo zebrać te informacje telefonicznie?",
      "Tak, rozmawiamy teraz z dziesięcioma osobami. Wyniki podsumuję w przyszłym tygodniu; na razie najwięcej osób wskazuje wczesne popołudnie.",
    ],
  },
  {
    source: "testuj-innowacje",
    name: "Dorota Wrona",
    title: "Oświęcim — zakończony test spacerów z mapą odpoczynku",
    status: "completed",
    message:
      "Chcemy przetestować papierową mapę krótkiego spaceru z miejscami odpoczynku, toaletami i opisem nawierzchni. Mapę przygotujemy razem ze starszymi mieszkańcami.",
    notes:
      "Test zakończony. Uczestnicy wskazali dwie poprawki: większy druk i opis nierównej nawierzchni. Wyniki fikcyjne, przygotowane do prezentacji.",
    fields: {
      "Co chcemy testować": "Papierowa mapa dostępnego spaceru.",
      "Miejsce testu": "Oświęcim; jedna trasa o długości około 800 metrów.",
      Uczestnicy:
        "Dziesięć osób 65+, w tym trzy korzystające z pomocy przy chodzeniu.",
      "Plan testu":
        "Dwa wspólne przejścia, rozmowa po spacerze i poprawiona wersja mapy.",
      "Jak sprawdzimy efekt":
        "Czy można odnaleźć miejsca odpoczynku i przewidzieć trudniejsze fragmenty trasy.",
      "Potrzebne wsparcie":
        "Konsultacja czytelności mapy i sposobu opisu barier.",
    },
    replies: [
      "Proszę po próbie zebrać także uwagi osób, które nie ukończyły trasy. To pomoże opisać ograniczenia mapy i dobrać krótszy wariant.",
      "Zebraliśmy uwagi wszystkich dziesięciu osób. Osiem ukończyło trasę, dwie wybrały krótszy odcinek. Powiększyliśmy druk i zaznaczyliśmy nierówną nawierzchnię. Dziękujemy za konsultację.",
    ],
  },
  ...[
    {
      name: "Aleksandra Kaczmarek",
      title: "Miechów — Biblioteka rzeczy blisko domu",
      status: "new" as const,
      place: "Miechów",
      people:
        "30 gospodarstw domowych, w tym osoby samotnie wychowujące dzieci",
      problem:
        "Zakup rzadko używanych narzędzi i sprzętu domowego obciąża budżety mieszkańców.",
      plan: "Trzy miesiące pilotażu wypożyczalni 20 przedmiotów, prosty rejestr papierowy i dwa dyżury tygodniowo. Przed uruchomieniem opracujemy zasady zwrotu i przeglądu sprzętu.",
      budget:
        "12 000 zł: sprzęt 6 000 zł, koordynacja 3 600 zł, przeglądy i ubezpieczenie 1 400 zł, materiały 1 000 zł.",
      result:
        "Co najmniej 60 wypożyczeń i rozmowy z 20 użytkownikami o użyteczności usługi.",
      notes:
        "Zweryfikować miejsce przechowywania i sposób udostępniania sprzętu.",
    },
    {
      name: "Robert Wójcik",
      title: "Brzesko — Cyfrowy sąsiad dla osób 60+",
      status: "in-progress" as const,
      place: "Brzesko",
      people: "20 osób w wieku 60+ i sześciu wolontariuszy",
      problem:
        "Seniorzy proszą o pomoc w obsłudze telefonu, ale obawiają się przekazywania haseł i danych osobowych.",
      plan: "Osiem tygodni indywidualnych dyżurów. Ćwiczymy ustawienia telefonu, wyszukiwanie informacji i rozpoznawanie podejrzanych wiadomości. Bez obsługi bankowości i bez przejmowania haseł.",
      budget:
        "9 600 zł: koordynacja 4 000 zł, szkolenie 2 000 zł, wynajem sali 1 600 zł, materiały 1 000 zł, ubezpieczenie 1 000 zł.",
      result:
        "16 uczestników samodzielnie wykona trzy wybrane czynności; krótka próba przed i po cyklu.",
      notes:
        "Budżet sumuje się poprawnie. Omówić instrukcję ochrony prywatności i scenariusz szkolenia.",
      replies: [
        "Proszę doprecyzować zasady ochrony prywatności podczas dyżurów. Czy wolontariusze będą pracować na urządzeniu uczestnika bez zapisywania jego danych?",
        "Tak. Uczestnik sam wpisuje hasła; wolontariusze nie wykonują operacji bankowych. Dodaliśmy krótką instrukcję oraz ćwiczenia na przykładowych ekranach.",
      ] as [string, string],
    },
    {
      name: "Justyna Zielińska",
      title: "Myślenice — Chwila dla opiekuna",
      status: "waiting" as const,
      place: "Myślenice",
      people: "12 opiekunów rodzinnych osób starszych",
      problem:
        "Opiekunowie mają mało czasu na własne sprawy i rzadko korzystają ze spotkań trwających kilka godzin.",
      plan: "Sześć krótkich spotkań i indywidualne konsultacje organizacji codziennych obowiązków. Najpierw sprawdzimy preferowane godziny i warunki uczestnictwa.",
      budget:
        "14 400 zł: prowadzenie 6 000 zł, konsultacje 4 800 zł, sala 1 200 zł, dojazdy 1 200 zł, materiały 1 200 zł.",
      result:
        "Dziewięć osób weźmie udział w minimum czterech spotkaniach i wskaże jedną przydatną zmianę w organizacji tygodnia.",
      notes:
        "Czekamy na potwierdzenie sali i szczegółowy harmonogram. Nie traktować wstępnych deklaracji jako gwarancji udziału.",
      replies: [
        "Opis potrzeb jest czytelny. Proszę dosłać harmonogram i potwierdzić dostępność sali. Warto wskazać też alternatywę dla osób, które nie mogą przyjść osobiście.",
        "Sprawdzamy dwa terminy z właścicielem sali. Dodamy możliwość indywidualnej konsultacji telefonicznej; harmonogram prześlemy po potwierdzeniu.",
      ] as [string, string],
    },
    {
      name: "Marcin Bąk",
      title: "Dąbrowa Tarnowska — Międzypokoleniowa pracownia ogrodu",
      status: "completed" as const,
      place: "Dąbrowa Tarnowska",
      people: "18 mieszkańców: seniorzy i młodzi dorośli",
      problem:
        "Brakuje regularnych zajęć, podczas których mieszkańcy różnych pokoleń współpracują przy wspólnym zadaniu.",
      plan: "Sześć spotkań ogrodniczych, trzy podwyższone skrzynie i wspólnie przygotowany grafik pielęgnacji. Udział bezpłatny, zadania dopasowane do możliwości uczestników.",
      budget:
        "11 800 zł: skrzynie 4 200 zł, prowadzenie 3 600 zł, ziemia i sadzonki 1 800 zł, narzędzia 1 200 zł, materiały i ubezpieczenie 1 000 zł.",
      result:
        "Trzy obsadzone skrzynie, minimum 12 stałych uczestników i wspólnie uzgodniony plan dalszej pielęgnacji.",
      notes:
        "Konsultację formalną zakończono; komplet informacji przekazany do dalszej oceny. Status nie oznacza przyznania grantu.",
      replies: [
        "Dziękuję za uzupełnienie budżetu i planu pielęgnacji. Zgłoszenie zawiera komplet informacji potrzebnych do dalszej oceny. Zakończenie rozmowy konsultacyjnej nie oznacza decyzji o finansowaniu.",
        "Dziękujemy. Mamy już listę zadań i wstępny grafik; rozumiemy, że czekamy na odrębną decyzję dotyczącą finansowania.",
      ] as [string, string],
    },
  ].map(
    (item): DemoCase => ({
      source: "grant-application",
      name: item.name,
      title: item.title,
      status: item.status,
      message: `Przesyłam przykładowy wniosek dotyczący projektu „${item.title}”. Proszę o kontakt w tej rozmowie, jeśli potrzebne będą uzupełnienia.`,
      notes: item.notes,
      replies: item.replies,
      fields: {
        "Nazwa projektu i miejsce realizacji": item.title,
        "Problem i odbiorcy": `${item.problem} Odbiorcy: ${item.people}. Miejsce: ${item.place}.`,
        "Plan działań": item.plan,
        "Budżet pilotażu": item.budget,
        "Rezultaty i sposób sprawdzenia": item.result,
      },
    }),
  ),
];

export const demoCaseIds = cases.map(
  (_, index) =>
    `de000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const staff =
  "(SELECT id FROM users WHERE email = 'cms@hubmi.invalid' AND role = 'cms')";

// Reserved demo IDs make repeat runs additive and preserve edits made in the CMS.
// No application submission/reply handlers are called, so no email is queued.
export function demoStatements(now = new Date()): string[] {
  const at = (daysAgo: number, hoursLater = 0) =>
    new Date(
      now.getTime() - daysAgo * 86400000 + hoursLater * 3600000,
    ).toISOString();
  const call: GrantCall = {
    id: 900001,
    title: "DEMO — Małopolska: małe testy innowacji społecznych",
    description:
      "Fikcyjny nabór przygotowany wyłącznie do prezentacji AIkonika. Nie jest ofertą finansowania i nie przyjmuje rzeczywistych wniosków. Przykładowe pilotaże dla mieszkańców województwa małopolskiego: do 15 000 zł, do trzech miesięcy, z opisem potrzeb, budżetem i oceną rezultatów.",
    opensAt: at(60),
    closesAt: at(1),
    published: false,
    updatedAt: at(60),
    questions: [
      "Nazwa projektu i miejsce realizacji",
      "Problem i odbiorcy",
      "Plan działań",
      "Budżet pilotażu",
      "Rezultaty i sposób sprawdzenia",
    ].map((label, index) => ({
      key: `question_${index + 1}`,
      label,
      help: "Opisz konkretnie założenia pilotażu.",
      required: true,
      maxLength: 2000,
    })),
  };
  const statements = [
    `INSERT INTO grant_calls (id,title,description,opens_at,closes_at,published,questions,updated_at,created_at) SELECT ${call.id},${quote(call.title)},${quote(call.description)},${quote(call.opensAt)},${quote(call.closesAt)},0,${quote(JSON.stringify(call.questions))},${quote(call.updatedAt)},${quote(call.updatedAt)} WHERE ${staff} IS NOT NULL ON CONFLICT(id) DO NOTHING;`,
  ];
  for (const [index, item] of cases.entries()) {
    const id = demoCaseIds[index];
    const daysAgo = item.status === "new" ? 1 + index / 24 : 5 + index;
    const artifact: AgentArtifact | null = item.fields
      ? {
          title: item.title,
          ready: true,
          fields: Object.entries(item.fields).map(([label, value]) => ({
            label,
            value,
          })),
        }
      : null;
    const isGrant = item.source === "grant-application";
    statements.push(`INSERT INTO submissions (id,submitted_at,source,subject,name,email,message,details,artifact,status,assigned_to_id,internal_notes,grant_call_id,call_snapshot)
      SELECT ${quote(id)},${quote(at(daysAgo))},${quote(item.source)},${quote(item.title)},${quote(item.name)},${quote(`demo-${index + 1}@hubmi.invalid`)},${quote(item.message)},${artifact ? quote(artifact.fields.map((field) => `${field.label}\n${field.value}`).join("\n\n")) : "NULL"},${artifact ? quote(JSON.stringify(artifact)) : "NULL"},${quote(item.status)},${staff},${quote(`DANE DEMONSTRACYJNE — fikcyjne osoby, organizacje i przebieg sprawy. ${item.notes}`)},${isGrant ? call.id : "NULL"},${isGrant ? `(SELECT json_object('id',id,'title',title,'description',description,'opensAt',opens_at,'closesAt',closes_at,'published',json('false'),'questions',json(questions),'updatedAt',updated_at) FROM grant_calls WHERE id=${call.id})` : "NULL"}
      WHERE ${staff} IS NOT NULL ON CONFLICT(id) DO NOTHING;`);
    for (const [replyIndex, body] of (item.replies ?? []).entries()) {
      statements.push(`INSERT INTO request_messages (id,submission_id,author,staff_id,body,internal,created_at)
        SELECT ${quote(`de000001-0000-4000-8000-${String(index * 10 + replyIndex + 1).padStart(12, "0")}`)},id,${quote(replyIndex === 0 ? "staff" : "customer")},${replyIndex === 0 ? staff : "NULL"},${quote(body)},0,${quote(at(daysAgo, replyIndex + 2))} FROM submissions WHERE id=${quote(id)} AND assigned_to_id=${staff} ON CONFLICT(id) DO NOTHING;`);
    }
    if (item.replies) {
      statements.push(`INSERT INTO request_messages (id,submission_id,author,staff_id,body,internal,created_at)
        SELECT ${quote(`de000002-0000-4000-8000-${String(index + 1).padStart(12, "0")}`)},id,'staff',${staff},${quote(item.notes)},1,${quote(at(daysAgo, 4))} FROM submissions WHERE id=${quote(id)} AND assigned_to_id=${staff} ON CONFLICT(id) DO NOTHING;`);
    }
  }
  return statements;
}
