# Sekcja FAQ na landing page — projekt

Data: 2026-07-06 (rew. 2 — po przeglądzie notatek z ~/Dokumenty/biznes-plan)
Status: zatwierdzony przez Jakuba

## Cel

Dodać na `index.html` sekcję FAQ, która tłumaczy laikom (właścicielom MŚP) podstawowe pojęcia
z obszarów, w których J-SOFT świadczy usługi, oraz rozwiewa wątpliwości dotyczące współpracy —
tuż przed końcowym CTA.

## Umiejscowienie i nagłówek

- Nowa sekcja `faq-section` w `index.html`, **między** `.about-section` a `.cta-section`.
- Nagłówek w konwencji istniejących sekcji: eyebrow „FAQ", tytuł serif
  „Pytania, które słyszę *najczęściej*" (kursywa przez `<em>`).

## Struktura i treść

4 działy, razem 21 pytań. W każdym dziale pytania ułożone **od najbardziej podstawowych
do najbardziej zaawansowanych**. Każdy dział ma mały nagłówek. Odpowiedzi: 2–4 zdania,
prosty język bez żargonu, ton spójny z resztą strony.

**Zasada uczciwości** (z planu przebudowy j-soft.me 2026-05-10): żadnych zmyślonych liczb,
SLA, sugerowania klientów/casów, których nie ma. Odpowiedzi o kosztach i tempie szczere:
„zależy od zakresu, zaczynamy od małego prototypu".

### Dział 1: AI po ludzku (6)
1. Czym różni się ChatGPT od AI wdrożonego w firmie?
2. Do czego mała firma może realnie wykorzystać AI? (konkrety: czytanie maili i zamówień,
   drafty dokumentów, odpowiedzi na typowe zapytania, analiza ofert)
3. Czy AI może samo wystawiać faktury albo odpisywać klientom? (człowiek w pętli —
   AI przygotowuje drafty, człowiek zatwierdza; z notatki o auto-fakturowaniu 2026-05-03)
4. Czy moje dane są bezpieczne, gdy firma korzysta z AI?
5. Co to jest agent AI?
6. Co to jest RAG i po co AI dostęp do moich dokumentów? (najbardziej zaawansowane — na końcu)

### Dział 2: Faktury i KSeF (6)
1. Czym różni się faktura PDF od faktury XML?
2. Co to jest faktura ustrukturyzowana?
3. Skoro mam PDF-y, to po co mi KSeF?
4. Od czego zacząć przygotowania firmy do KSeF?
5. Co jeszcze mogą mi dać dane z KSeF poza wystawianiem faktur? (monitoring płatności faktur,
   dashboardy kosztów, historia cen dostawców / porównywanie ofert, baza kontrahentów
   pod aktywny marketing — pomysły Jakuba + notatka cashflow-wedge 2026-04-28)
6. Czy KSeF sam wykryje błędy i nadużycia na fakturach? (sam nie — ale na jego danych można
   zbudować kontrole: duplikaty, nietypowe ceny, biała lista VAT; z notatki o audycie anomalii
   2026-05-01; link do artykułu na blogu o 5 kontrolach przed płatnością)

### Dział 3: Płatności i standardy bankowe (5)
1. Co to jest MT940?
2. Co to jest ISO 20022?
3. Na czym polega migracja z MT940 na CAMT?
4. Co ta migracja oznacza dla mojej firmy?
5. Co mogę zautomatyzować, mając wyciągi w formacie CAMT? (uzgadnianie płatności z fakturami,
   alerty o zaległościach, bieżący obraz przepływów — spina się z monitoringiem z KSeF)

### Dział 4: Współpraca (4)
1. Ile kosztuje taki projekt?
2. Czy muszę mieć gotową specyfikację?
3. Jak szybko zobaczę efekty?
4. Nie wiem, czy mój problem da się zautomatyzować — co wtedy?

## Rozwiązanie techniczne

- Akordeon na natywnym `<details class="faq-item">` + `<summary>` — bez JavaScriptu,
  treść w pełni indeksowana przez wyszukiwarki.
- Style dopisane na końcu `style.css`, zgodne z systemem (zmienne `--navy`, `--gold`,
  `--cream`, fonty Playfair Display / DM Sans). Chevron w `summary` obracany przy
  `details[open]`. Widok mobilny w istniejącym breakpoincie.
- JSON-LD `FAQPage` w `<head>` `index.html` z pełną treścią wszystkich 21 pytań
  i odpowiedzi (drugi blok `<script type="application/ld+json">`, obok istniejącego
  `ProfessionalService`).
- W odpowiedzi 2.6 link do istniejącego artykułu na blogu (KSeF — 5 kontroli przed płatnością).

## Weryfikacja

- Podgląd strony w przeglądarce: desktop i szerokość mobilna; akordeony otwierają się
  i zamykają, chevron się obraca.
- Walidacja poprawności HTML i JSON-LD (poprawny JSON, typ `FAQPage` z `mainEntity`).
- Link do artykułu blogowego prowadzi do istniejącego pliku.

## Poza zakresem

- Zmiany na pozostałych podstronach (uslugi.html itd.).
- Tabs/JS, wyszukiwarka w FAQ.
