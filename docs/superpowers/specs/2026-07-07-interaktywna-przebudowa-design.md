# Spec: Interaktywna przebudowa j-soft.me

Data: 2026-07-07
Status: zatwierdzony kierunek (brainstorming z Jakubem), spec do review

## Cel

Strona ma być bardziej interaktywna i zaawansowana technicznie, zachowując obecną
stonowaną, biznesową elegancję (navy/gold/cream, Playfair + DM Sans) i pozycję
„rzemieślnik buduje praktykę". Interaktywność ma być dowodem fachu, nie ozdobą.

## Decyzje z brainstormingu

- Kierunek: **ożywienie obecnych sekcji + interaktywne narzędzia** (bez zmiany
  stacku, bez efektów „wow" typu parallax).
- Narzędzia: **demo kontroli faktury KSeF** (osobna podstrona, układ „pulpit
  kontrolera"), **interaktywna oś procesu**, **wyszukiwarka FAQ**.
  Kalkulator ręcznej pracy — odrzucony.
- Podejście techniczne: **A — czysty vanilla JS, progressive enhancement**
  (odrzucone: CSS scroll-driven animations jako podstawa — nierówne wsparcie;
  Alpine.js — zbędna zależność, kłóci się z zaostrzaniem CSP).

## Zasady nadrzędne

1. **Strona w 100% działa bez JavaScriptu.** Stan „ukryty przed animacją" nadaje
   wyłącznie JS (klasa na `<html>` dodawana skryptem); bez JS nic nie jest schowane.
2. **Stonowanie:** animacje ≤ 0,6 s, jedna krzywa easing, wyłącznie
   `transform`/`opacity` (zero przesunięć layoutu), pełny respekt dla
   `prefers-reduced-motion` (animacje wyłączone, liczniki pokazują od razu
   wartości końcowe, werdykty demo bez animacji skanowania).
3. **Zasada uczciwości** (docs: content-rules): dane w demo jawnie fikcyjne
   (stały dopisek), symulacja białej listy opisana wprost, żadnych sugestii
   istniejącego produktu ani liczb bez pokrycia.
4. Zero zależności, zero builda. Repo pozostaje czystym HTML/CSS/JS.

## Architektura plików

| Plik | Zmiana |
|---|---|
| `site.js` | NOWY, ~150 linii, `defer` na każdej podstronie: scroll-reveal, liczniki, nav-scrolled, hamburger, oś procesu, filtr FAQ |
| `demo-ksef.html` | NOWA podstrona: pulpit demo kontroli faktury |
| `demo-ksef.js` | NOWY, tylko na stronie demo, samodzielny |
| `style.css` | dopisane style (reveal, oś, filtr, pulpit demo); linkowany jako `style.css?v=2` |
| `index.html` i pozostałe strony | `<script src="site.js" defer>`, `style.css?v=2`, usunięty inline `onclick` hamburgera, linki do demo |
| `kontakt.js` | NOWY: init EmailJS + obsługa formularza przeniesione z inline skryptów `kontakt.html` (warunek zaostrzenia CSP) |
| `_headers` | `script-src` bez `'unsafe-inline'` (po usunięciu inline onclick) |
| `sitemap.xml` | wpis `demo-ksef.html`, lastmod |
| `blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html` | link do demo |

## 1. Ożywienie sekcji (wszystkie podstrony)

- **Scroll-reveal:** nagłówki sekcji, karty problemów, kafelki usług, kroki
  procesu, kafelki trust-grid wjeżdżają (translateY ~16 px + fade, 0,5 s),
  kaskadowo (60 ms odstępu między elementami grupy). `IntersectionObserver`
  dodaje klasę; brak IO = wszystko widoczne.
- **Liczniki:** 7+ / 4 / 0 zł / 1:1 w „O mnie" odliczają od zera przy wejściu
  w widok (raz, ~1 s). Wartości docelowe pozostają w HTML (fallback bez JS);
  format z sufiksem (`+`, ` zł`, `:1`) zachowany.
- **Mikro-interakcje (CSS):** podkreślenia linków nav rysowane od lewej,
  strzałka CTA lekko przesuwana na hover, delikatna reakcja ikon usług.
- **Nav-scrolled:** po przewinięciu > ~40 px nav dostaje cień i mniejszą
  wysokość (klasa z JS, transition w CSS).
- **Hamburger:** logika przeniesiona z inline `onclick` do `site.js`
  (addEventListener) — warunek zaostrzenia CSP.

## 2. Interaktywna oś procesu (index.html)

- Kafelki 01–04 zamienione w poziomą oś: złota linia, numery jako punkty.
  Klik / strzałki ←→ podświetlają krok i rozwijają panel z detalami pod osią.
- Nowa treść: 2–3 zdania konkretu na krok (bezpłatna i niezobowiązująca
  pierwsza rozmowa; szczera ocena, czy temat ma sens; prototyp do obejrzenia
  zanim wydasz złotówkę; wdrożenie i wsparcie bez znikania). **Bez SLA.**
- Nic nie przełącza się samo (zero autoplay).
- Bez JS: wszystkie detale widoczne statycznie pod krokami; JS przekształca
  w widok „jeden krok naraz".
- A11y: kroki jako `<button>` z `aria-expanded`, widoczny focus, obsługa
  klawiatury. Mobile: oś pionowa.

## 3. Wyszukiwarka FAQ (index.html)

- Pole tekstowe nad działami („Filtruj pytania — np. KSeF, RAG, koszty…"),
  stylizowane jak pola formularza kontaktowego (ramka `--cream2`, złoty focus).
- Filtrowanie na żywo po treści **pytań i odpowiedzi**, bez wrażliwości na
  polskie znaki (normalizacja diakrytyków: „ksef" znajdzie „KSeF").
- Licznik „pokazuję X z 21". Dział bez trafień znika razem z nagłówkiem.
- ≤ 3 wyniki → trafione pytania otwierają się same; trafiony fragment
  w pytaniu podświetlony (`<mark>`, delikatne złoto).
- 0 wyników → „Nie ma takiego pytania — zadaj je mi bezpośrednio" + link do
  kontaktu.
- Pole wstawia JS (bez JS nie ma martwego elementu).

## 4. Demo kontroli faktury KSeF (`demo-ksef.html`)

Układ **„pulpit kontrolera"**: navy `page-hero` (eyebrow „Demo", tytuł
„Kontrola faktury *przed płatnością*"), niżej dwupanelowy pulpit —
**faktura po lewej, kontrole po prawej** (mobile: jedno pod drugim).

- **Faktura (dane fikcyjne, oznaczone na stałe):** sprzedawca, NIP, numer,
  data, 2–3 pozycje, netto/VAT/brutto, rachunek bankowy, termin płatności.
  Dane jako stała w `demo-ksef.js`.
- **5 kontroli** (spójne z artykułem na blogu):
  1. Zgodność XML z PDF (kwoty wizualizacji vs dane ustrukturyzowane) → OK
  2. Kwota do zapłaty (suma pozycji vs brutto) → OK
  3. NIP kontrahenta — **prawdziwy algorytm sumy kontrolnej NIP** na
     fikcyjnym numerze → OK
  4. Biała lista VAT — rachunek **celowo spoza listy** → ⚠ (wyjaśnienie:
     utrata kosztu, solidarna odpowiedzialność > 15 tys. zł); w demo lista
     symulowana lokalnie — napisane wprost, produkcyjnie API MF
  5. Duplikat — numer vs wbudowana mini-historia płatności → OK
- **Przebieg:** „Uruchom kontrole" odpala sekwencyjnie (~0,8 s/kontrola):
  złota obwódka na sprawdzanym polu faktury → werdykt ✓/⚠ + jedno zdanie.
  Finał: „4 z 5 OK — tej faktury nie opłacaj bez wyjaśnienia rachunku" +
  link do artykułu + CTA konsultacja. „Uruchom ponownie" resetuje.
- **Zero wywołań sieciowych** (CSP `connect-src` bez zmian).
- `<noscript>`: opis 5 kontroli + link do artykułu.
- Wejścia do demo: karta usługi „KSeF i zgodność procesów" (index
  i uslugi.html), artykuł na blogu, odpowiedź FAQ o wykrywaniu błędów.
  **Demo poza nawigacją główną.**

## 5. Integracja i szczegóły techniczne

- **Cache CSS:** `/style.css` ma w `_headers` cache immutable 1 rok →
  wersjonowanie `style.css?v=2` we wszystkich stronach; podbijać przy każdej
  zmianie CSS. JS łapie domyślny cache 1 h (bez zmian w `_headers`).
- **CSP:** wyciąć `'unsafe-inline'` ze `script-src` wymaga usunięcia
  WSZYSTKICH inline skryptów: (a) `onclick` hamburgera → `site.js`;
  (b) `kontakt.html` ma dwa inline skrypty (init EmailJS + obsługa
  formularza) → przenieść do nowego `kontakt.js` (external, self-hosted,
  `defer`). JSON-LD (`application/ld+json`) nie jest wykonywalny — CSP go
  nie blokuje. Beacon Cloudflare i `cdn.jsdelivr.net` (SDK EmailJS)
  pozostają na liście dozwolonych. Po zmianie przetestować wysyłkę
  formularza kontaktowego.
- **SEO/meta demo:** komplet meta + OG + canonical wzorem podstron; wpis
  w `sitemap.xml`.
- Waga: `site.js` ~4–6 KB, `demo-ksef.js` ~8–10 KB, bez nowych obrazków.

## Weryfikacja (geckodriver, wg .claude/skills/verify)

1. Demo: uruchomienie kontroli, ⚠ na białej liście, reset, brak requestów
   sieciowych z demo.
2. Filtr FAQ: „ksef" → zawężenie + licznik; brak wyników → pusty stan
   z linkiem; czyszczenie pola przywraca 21.
3. Oś procesu: klik + klawiatura, `aria-expanded` się zmienia.
4. `javascript.enabled=false` → pełna treść widoczna na wszystkich stronach.
5. `ui.prefersReducedMotion=1` → brak animacji, liczniki z wartościami
   końcowymi.
6. Konsola bez błędów CSP po zaostrzeniu (wszystkie strony); na kontakt.html
   handler formularza podpięty (klik zmienia przycisk na „Wysyłanie...").
   Realną wysyłkę maila testuje Jakub ręcznie — automat nie wysyła maili.
7. Desktop 1440 px i mobile 500 px: brak poziomego overflow; JSON-LD parsuje.

## Kolejność implementacji

1. Fundament `site.js` + scroll-reveal + liczniki + nav + hamburger (commit)
2. Interaktywna oś procesu (commit)
3. Filtr FAQ (commit)
4. `demo-ksef.html` + `demo-ksef.js` + linki + sitemap (commit)
5. `kontakt.js` + zaostrzenie CSP + wersjonowanie `style.css?v=2` (commit)
6. Weryfikacja end-to-end (poprawki, commit)

Commity lokalnie na `main`, po polsku. **Push = produkcja — tylko za zgodą.**

## Poza zakresem

- Zmiana frameworka/stacku, build tooling
- Parallax, animowane tła, przejścia między stronami
- Kalkulator kosztu ręcznej pracy (świadomie odrzucony)
- Backend / prawdziwe API białej listy
