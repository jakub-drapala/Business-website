# Sekcja FAQ na landing page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać na `index.html` sekcję FAQ (4 działy, 21 pytań, akordeon bez JS) plus schema FAQPage, zgodnie ze specem `docs/superpowers/specs/2026-07-06-faq-section-design.md`.

**Architecture:** Statyczna strona HTML/CSS (bez frameworka, bez bundlera). Akordeon na natywnym `<details>/<summary>`. Style dopisane na końcu `style.css` w konwencji istniejących sekcji. JSON-LD `FAQPage` jako drugi blok `<script type="application/ld+json">` w `<head>`.

**Tech Stack:** HTML5, CSS (zmienne `--navy/--gold/--cream`, fonty Playfair Display + DM Sans), JSON-LD schema.org.

## Global Constraints

- Język treści: polski, prosty, bez żargonu; odpowiedzi 2–4 zdania.
- Zasada uczciwości: żadnych zmyślonych liczb, SLA, sugerowania nieistniejących klientów.
- Zero JavaScriptu dla FAQ.
- Sekcja FAQ wstawiona **między** `</div>` zamykającym `.about-section` a `<div class="cta-section">` w `index.html`.
- Breakpoint mobilny: `@media (max-width: 900px)` — reguły FAQ dopisane WEWNĄTRZ istniejącego bloku media query na końcu `style.css`.
- Link do artykułu: `blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html` (plik istnieje).
- Commity po polsku, w stylu repo (np. „Dodanie sekcji FAQ na stronie głównej"), z trailerem `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Markup sekcji FAQ w index.html

**Files:**
- Modify: `index.html` (wstawka między `.about-section` — kończy się na linii z `</div>` po `trust-grid` — a `<div class="cta-section">`, ok. linia 286)

**Interfaces:**
- Produces: klasy `faq-section`, `faq-groups`, `faq-group`, `faq-group-title`, `faq-item`, `faq-answer` — Task 2 pisze pod nie CSS; treść pytań/odpowiedzi — Task 3 kopiuje ją do JSON-LD.

- [ ] **Step 1: Wstaw sekcję FAQ**

W `index.html`, bezpośrednio PO zamknięciu `.about-section` (po `</div>` kończącym `<div class="about-section">`) i PRZED `<div class="cta-section">`, wstaw:

```html
<div class="faq-section">
  <div class="section-header">
    <div>
      <div class="section-eyebrow">FAQ</div>
      <h2 class="section-title-serif">Pytania, które słyszę <em>najczęściej</em></h2>
    </div>
  </div>
  <div class="faq-groups">

    <div class="faq-group">
      <h3 class="faq-group-title">AI po ludzku</h3>
      <details class="faq-item">
        <summary>Czym różni się ChatGPT od AI wdrożonego w firmie?</summary>
        <div class="faq-answer"><p>ChatGPT to ogólny asystent — odpowiada na pytania, ale nie zna Twojej firmy i nie wykona pracy w Twoich systemach. AI wdrożone w firmie jest podłączone do Twoich danych i narzędzi — skrzynki, faktur, dokumentów — i wykonuje konkretne, powtarzalne zadania według ustalonych zasad. To różnica między rozmową a działaniem.</p></div>
      </details>
      <details class="faq-item">
        <summary>Do czego mała firma może realnie wykorzystać AI?</summary>
        <div class="faq-answer"><p>Najczęściej tam, gdzie ktoś ręcznie czyta i przepisuje: odczytywanie zamówień z maili, wyciąganie danych ze skanów i PDF-ów, przygotowywanie szkiców dokumentów, odpowiedzi na powtarzalne zapytania klientów, streszczanie ofert i umów. Dobre wdrożenie zaczyna się od jednego wąskiego zadania, które zabiera najwięcej czasu — nie od „rewolucji AI".</p></div>
      </details>
      <details class="faq-item">
        <summary>Czy AI może samo wystawiać faktury albo odpisywać klientom?</summary>
        <div class="faq-answer"><p>Może — ale nie powinno robić tego bez nadzoru. Sprawdzony model to „człowiek w pętli": AI czyta zamówienia i przygotowuje gotowe szkice faktur czy odpowiedzi, a Ty tylko przeglądasz listę i zatwierdzasz jednym kliknięciem. Jeden błędny NIP na fakturze to realny problem podatkowy, dlatego ostatnie słowo zawsze należy do człowieka.</p></div>
      </details>
      <details class="faq-item">
        <summary>Czy moje dane są bezpieczne, gdy firma korzysta z AI?</summary>
        <div class="faq-answer"><p>To zależy od sposobu wdrożenia — i dlatego warto je zaplanować. Biznesowe usługi AI (w przeciwieństwie do darmowych czatów) dają umowy, które zakazują trenowania modeli na Twoich danych. Można też ograniczyć, co w ogóle trafia do AI: dane wrażliwe da się filtrować lub anonimizować, zanim opuszczą firmę.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co to jest agent AI?</summary>
        <div class="faq-answer"><p>Program, który nie tylko odpowiada na pytania, ale sam wykonuje wieloetapowe zadania: potrafi sprawdzić skrzynkę, odczytać załącznik, zajrzeć do systemu i przygotować dokument — krok po kroku, bez prowadzenia za rękę. Ty ustalasz zasady i granice, agent wykonuje pracę i pokazuje wynik do akceptacji.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co to jest RAG i po co AI dostęp do moich dokumentów?</summary>
        <div class="faq-answer"><p>RAG (Retrieval-Augmented Generation) to technika, w której AI przed udzieleniem odpowiedzi najpierw wyszukuje informacje w Twoich dokumentach — umowach, cennikach, procedurach — i odpowiada na ich podstawie, zamiast „z głowy". Dzięki temu odpowiedzi dotyczą Twojej firmy, a nie ogólnej wiedzy z internetu, i można wskazać źródło każdej informacji. To podstawa np. firmowej bazy wiedzy dla pracowników.</p></div>
      </details>
    </div>

    <div class="faq-group">
      <h3 class="faq-group-title">Faktury i KSeF</h3>
      <details class="faq-item">
        <summary>Czym różni się faktura PDF od faktury XML?</summary>
        <div class="faq-answer"><p>PDF to obraz faktury przeznaczony dla człowieka — komputer widzi w nim tylko „obrazek z tekstem" i żeby zaksięgować dane, ktoś musi je przepisać albo użyć zawodnego OCR. XML to faktura zapisana jako dane: każda pozycja, kwota i NIP ma swoje miejsce w strukturze, więc program księgowy odczyta ją bezbłędnie i automatycznie. Krótko: PDF czyta człowiek, XML czyta komputer.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co to jest faktura ustrukturyzowana?</summary>
        <div class="faq-answer"><p>To faktura w formacie XML zgodnym ze schematem Ministerstwa Finansów, wystawiona przez KSeF. „Ustrukturyzowana" znaczy tyle, że wszystkie dane — sprzedawca, nabywca, pozycje, stawki VAT — mają ściśle określone miejsca, dzięki czemu każdy system w Polsce odczyta ją tak samo. W obowiązkowym KSeF to ona jest „prawdziwą" fakturą, a PDF czy wydruk to tylko jej wizualizacja.</p></div>
      </details>
      <details class="faq-item">
        <summary>Skoro mam PDF-y, to po co mi KSeF?</summary>
        <div class="faq-answer"><p>Bo KSeF nie jest kwestią wyboru — wystawianie faktur przez ten system staje się w Polsce obowiązkowe (od lutego 2026 dla największych firm, od kwietnia 2026 dla pozostałych). Faktury sprzedażowe wystawiasz w KSeF, a kosztowe odbierasz z KSeF. Ta zmiana ma też dobrą stronę: wszystkie faktury stają się danymi, które można automatycznie księgować, kontrolować i analizować.</p></div>
      </details>
      <details class="faq-item">
        <summary>Od czego zacząć przygotowania firmy do KSeF?</summary>
        <div class="faq-answer"><p>Od trzech pytań: czym dziś wystawiasz faktury (i czy dostawca ma już moduł KSeF), jak odbierasz faktury kosztowe oraz kto w firmie ma mieć uprawnienia do KSeF. Potem porządkuje się obieg: nadanie uprawnień, próby w środowisku testowym KSeF, dopiero na końcu produkcja. Zwykle nie trzeba wymieniać systemu — trzeba go rozsądnie podłączyć i przetestować.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co jeszcze mogą mi dać dane z KSeF poza wystawianiem faktur?</summary>
        <div class="faq-answer"><p>Sporo, bo wszystkie faktury firmy w jednym miejscu i w formie danych to gotowy materiał do analizy: monitoring, które faktury są opłacone, a które po terminie; dashboard kosztów zamiast ręcznych zestawień w Excelu; historia cen od dostawców — łatwo sprawdzisz, czy nowa oferta nie jest zawyżona; pełna baza kontrahentów do wykorzystania np. w marketingu. Samo wystawianie faktur to obowiązek — te dane to okazja.</p></div>
      </details>
      <details class="faq-item">
        <summary>Czy KSeF sam wykryje błędy i nadużycia na fakturach?</summary>
        <div class="faq-answer"><p>Nie — KSeF sprawdza tylko, czy faktura jest technicznie poprawna, a nie czy jest zasadna i uczciwa. Ale na danych z KSeF można zbudować własne kontrole: wykrywanie zdublowanych faktur, nietypowych kwot i podejrzanych zmian cen czy sprawdzanie rachunku na białej liście VAT przed płatnością. Więcej o tym piszę w artykule <a href="blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html">o 5 kontrolach faktur kosztowych przed płatnością</a>.</p></div>
      </details>
    </div>

    <div class="faq-group">
      <h3 class="faq-group-title">Płatności i standardy bankowe</h3>
      <details class="faq-item">
        <summary>Co to jest MT940?</summary>
        <div class="faq-answer"><p>To format elektronicznego wyciągu bankowego używany od dekad — plik tekstowy z listą operacji, który firmy importują do systemów księgowych i finansowych. Problem w tym, że MT940 jest mocno skrótowy: ma mało miejsca na szczegóły przelewu, a każdy bank wypełnia go trochę inaczej, więc automatyczne przetwarzanie bywa zawodne.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co to jest ISO 20022?</summary>
        <div class="faq-answer"><p>Międzynarodowy standard wymiany danych finansowych — wspólny „język", w którym banki na całym świecie opisują przelewy, wyciągi i statusy płatności. Zamiast skrótowych pól tekstowych używa czytelnej struktury (XML), w której każda informacja — nadawca, odbiorca, tytuł, kwota — ma jednoznaczne miejsce. Przechodzi na niego cały świat płatności, ze SWIFT na czele, a sukcesywnie także polskie banki.</p></div>
      </details>
      <details class="faq-item">
        <summary>Na czym polega migracja z MT940 na CAMT?</summary>
        <div class="faq-answer"><p>CAMT to rodzina komunikatów ISO 20022 zastępujących stare wyciągi: camt.053 to wyciąg dzienny (następca MT940), camt.052 — raport śróddzienny, a camt.054 — powiadomienia o uznaniach i obciążeniach. Migracja oznacza, że bank zaczyna udostępniać wyciągi w nowym formacie, a systemy firmy — księgowość, ERP, controlling — muszą nauczyć się je wczytywać.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co ta migracja oznacza dla mojej firmy?</summary>
        <div class="faq-answer"><p>Jeśli Twoja księgowość lub ERP importują dziś wyciągi MT940, w pewnym momencie trzeba będzie przełączyć się na CAMT, bo banki stopniowo wycofują stary format. To nie tylko koszt: CAMT niesie dużo więcej szczegółów o każdej operacji (pełne dane nadawcy, referencje, kody opłat), więc automatyczne księgowanie i uzgadnianie płatności staje się dokładniejsze. Pracowałem przy takich migracjach od strony banków — wiem, na co uważać od strony firmy.</p></div>
      </details>
      <details class="faq-item">
        <summary>Co mogę zautomatyzować, mając wyciągi w formacie CAMT?</summary>
        <div class="faq-answer"><p>Przede wszystkim uzgadnianie płatności: system sam łączy wpłaty z wyciągu z fakturami (np. z KSeF) i pokazuje, kto zapłacił, kto zalega i komu wysłać przypomnienie — zamiast ręcznego sprawdzania banku co dwa dni. Do tego bieżący obraz przepływów: ile weszło, ile wyszło, co wisi po terminie. Połączenie danych z banku i z KSeF daje małej firmie kontrolę nad płynnością, którą kiedyś miały tylko korporacje.</p></div>
      </details>
    </div>

    <div class="faq-group">
      <h3 class="faq-group-title">Współpraca</h3>
      <details class="faq-item">
        <summary>Ile kosztuje taki projekt?</summary>
        <div class="faq-answer"><p>To zależy od zakresu — dlatego zaczynamy od bezpłatnej konsultacji, po której dostajesz konkretną propozycję: co warto zrobić, w jakiej kolejności i ile to będzie kosztować. Małe automatyzacje to dni pracy, nie miesiące. Zasada jest prosta: nie zaczynamy, dopóki nie wiesz, za co płacisz.</p></div>
      </details>
      <details class="faq-item">
        <summary>Czy muszę mieć gotową specyfikację?</summary>
        <div class="faq-answer"><p>Nie. Wystarczy, że opiszesz problem własnymi słowami — „tracimy pół dnia na przepisywanie zamówień" to w zupełności wystarczający punkt wyjścia. Zadawanie właściwych pytań i zamiana problemu na rozwiązanie techniczne to moja praca, nie Twoja.</p></div>
      </details>
      <details class="faq-item">
        <summary>Jak szybko zobaczę efekty?</summary>
        <div class="faq-answer"><p>Zaczynam od najmniejszego działającego rozwiązania — prototypu albo pierwszego usprawnienia, które można ocenić w praktyce, zanim zdecydujesz o czymś większym. Dzięki temu szybko widać, czy kierunek jest dobry, a Ty nie płacisz za miesiące planowania.</p></div>
      </details>
      <details class="faq-item">
        <summary>Nie wiem, czy mój problem da się zautomatyzować — co wtedy?</summary>
        <div class="faq-answer"><p>To najczęstszy punkt startu i dokładnie po to jest bezpłatna konsultacja. Opisujesz, jak wygląda praca dziś, a ja szczerze mówię, co da się zautomatyzować, co się nie opłaci i od czego zacząć. Czasem najlepsza odpowiedź brzmi „tego nie automatyzuj" — i taką też usłyszysz.</p></div>
      </details>
    </div>

  </div>
</div>
```

- [ ] **Step 2: Weryfikacja struktury**

Run: `python3 -c "import html.parser,sys
class P(html.parser.HTMLParser):
    d=0; s=0
    def handle_starttag(self,t,a):
        if t=='details': P.d+=1
        if t=='summary': P.s+=1
P().feed(open('index.html',encoding='utf-8').read()); print(P.d,'details,',P.s,'summary')"`
Expected: `21 details, 21 summary`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Dodanie sekcji FAQ na stronie głównej (4 działy, 21 pytań)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Style sekcji FAQ w style.css

**Files:**
- Modify: `style.css` (nowy blok `/* FAQ */` przed blokiem `@media (max-width: 900px)` z linii 384; reguły mobilne dopisane wewnątrz tego istniejącego bloku media)

**Interfaces:**
- Consumes: klasy z Task 1 (`faq-section`, `faq-groups`, `faq-group`, `faq-group-title`, `faq-item`, `faq-answer`); zmienne `--navy`, `--gold`, `--cream`, `--cream2`, `--muted`.

- [ ] **Step 1: Dodaj blok FAQ przed media query**

Przed linią `@media (max-width: 900px) {` wstaw:

```css
/* FAQ */
.faq-section { background: var(--cream); padding: 100px 60px; }
.faq-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 48px 72px; align-items: start; }
.faq-group-title {
  font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700;
  color: var(--navy); padding-bottom: 14px; margin-bottom: 6px;
  border-bottom: 2px solid var(--gold);
}
.faq-item { border-bottom: 1px solid var(--cream2); }
.faq-item summary {
  list-style: none; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 18px 0;
  color: var(--navy); font-size: 15px; font-weight: 500;
  transition: color .2s;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after {
  content: '+';
  font-family: 'Playfair Display', serif;
  color: var(--gold); font-size: 24px; line-height: 1;
  flex-shrink: 0; transition: transform .25s;
}
.faq-item[open] summary::after { transform: rotate(45deg); }
.faq-item summary:hover { color: var(--gold); }
.faq-answer { padding: 0 32px 20px 0; color: var(--muted); font-size: 14px; line-height: 1.8; font-weight: 300; }
.faq-answer a { color: var(--gold); }
```

Znak `+` obracany o 45° do `×` pełni rolę wskaźnika rozwinięcia (zamiennik chevronu ze specu — ta sama funkcja, lepiej pasuje do serifowej typografii).

- [ ] **Step 2: Dodaj reguły mobilne wewnątrz istniejącego `@media (max-width: 900px)`**

Wewnątrz bloku media query (np. po linii `.process-section, .audience-section { padding: 60px 24px; }`) dopisz:

```css
  .faq-section { padding: 60px 24px; }
  .faq-groups { grid-template-columns: 1fr; gap: 40px; }
```

- [ ] **Step 3: Weryfikacja składni CSS (balans nawiasów)**

Run: `python3 -c "s=open('style.css',encoding='utf-8').read(); print('OK' if s.count('{')==s.count('}') else 'MISMATCH', s.count('{'), s.count('}'))"`
Expected: `OK <n> <n>`

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "Style sekcji FAQ (akordeon details/summary, wersja mobilna)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Schema FAQPage (JSON-LD) + sitemap

**Files:**
- Modify: `index.html` (drugi blok `<script type="application/ld+json">` po istniejącym bloku `ProfessionalService`, przed `</head>`)
- Modify: `sitemap.xml` (lastmod wpisu strony głównej → `2026-07-06`)

**Interfaces:**
- Consumes: treść 21 pytań/odpowiedzi z Task 1 — teksty odpowiedzi w JSON-LD identyczne z HTML, ale bez tagów (czysty tekst; w pytaniu 2.6 link zapisany zwykłym tekstem „…w artykule na blogu j-soft.me").

- [ ] **Step 1: Dodaj JSON-LD FAQPage**

Po zamykającym `</script>` bloku `ProfessionalService`, przed `</head>`, wstaw blok `<script type="application/ld+json">` z obiektem:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "<pytanie 1.1>", "acceptedAnswer": {"@type": "Answer", "text": "<odpowiedź 1.1 bez HTML>"}},
    {"...": "— i tak dla wszystkich 21 pytań w kolejności z Task 1 —"}
  ]
}
```

Treść `name`/`text` przepisz 1:1 z markupu Task 1 (bez tagów HTML). W odpowiedzi o wykrywaniu błędów zamiast linku: „Więcej o tym piszę w artykule o 5 kontrolach faktur kosztowych na blogu j-soft.me."

- [ ] **Step 2: Walidacja JSON**

Run: `python3 -c "
import json,re
h=open('index.html',encoding='utf-8').read()
blocks=re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',h,re.S)
faq=[json.loads(b) for b in blocks if 'FAQPage' in b]
assert len(faq)==1 and len(faq[0]['mainEntity'])==21, (len(faq), faq and len(faq[0]['mainEntity']))
print('FAQPage OK, 21 pytań')"`
Expected: `FAQPage OK, 21 pytań`

- [ ] **Step 3: Zaktualizuj sitemap.xml**

W `sitemap.xml` we wpisie `<loc>https://j-soft.me/</loc>` ustaw `<lastmod>2026-07-06</lastmod>`.

- [ ] **Step 4: Commit**

```bash
git add index.html sitemap.xml
git commit -m "Schema FAQPage dla sekcji FAQ + aktualizacja sitemap

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Weryfikacja end-to-end w przeglądarce

**Files:**
- żadnych zmian — tylko weryfikacja

**Interfaces:**
- Consumes: całość zmian z Tasków 1–3.

- [ ] **Step 1: Serwuj stronę lokalnie**

Run: `python3 -m http.server 8321 --directory /home/jakub-drapala/projects/Business-website` (w tle)

- [ ] **Step 2: Sprawdź render**

Otwórz `http://localhost:8321/` (narzędziem przeglądarkowym/screenshotem, jeśli dostępne — inaczej `curl -s http://localhost:8321/ | grep -c 'faq-item'` → Expected: `22` (21 details + 1 selektor CSS nie występuje w HTML, więc 21) — użyj `grep -c '<details class="faq-item">'` → Expected: `21`).

Checklist wizualny (desktop + zwężone okno ~400px):
- sekcja FAQ ma tło cream i siedzi między „O mnie" a granatowym CTA,
- 4 tytuły działów ze złotym podkreśleniem, na mobile jedna kolumna,
- kliknięcie pytania rozwija odpowiedź, `+` obraca się w `×`,
- link w odpowiedzi o kontrolach prowadzi do artykułu na blogu (HTTP 200).

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8321/blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html`
Expected: `200`

- [ ] **Step 3: Zatrzymaj serwer, podsumuj wynik użytkownikowi**

---

## Self-review (wykonany przy pisaniu planu)

- Spec coverage: umiejscowienie ✓ (Task 1), 21 pytań w 4 działach w zatwierdzonej kolejności ✓ (Task 1), akordeon bez JS ✓ (Task 1+2), style w konwencji ✓ (Task 2), mobile ✓ (Task 2), FAQPage JSON-LD ✓ (Task 3), link do bloga ✓ (Task 1, weryfikacja w Task 4), zasada uczciwości ✓ (treść odpowiedzi bez liczb/SLA).
- Placeholdery: treść wszystkich 21 odpowiedzi podana w całości w Task 1; JSON-LD kopiuje ją 1:1 (wzorzec podany, treść źródłowa kompletna).
- Spójność nazw klas między Task 1 i Task 2 ✓.
