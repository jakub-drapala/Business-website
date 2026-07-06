# Sekcja FAQ na landing page — projekt

Data: 2026-07-06
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

4 działy po 4 pytania. Każdy dział ma mały nagłówek działu. Odpowiedzi: 2–4 zdania,
prosty język bez żargonu, ton spójny z resztą strony (bezpośredni, konkretny).

### Dział 1: AI po ludzku
1. Co to jest agent AI?
2. Co to jest RAG i po co AI dostęp do moich dokumentów?
3. Czym różni się ChatGPT od AI wdrożonego w firmie?
4. Czy moje dane są bezpieczne, gdy firma korzysta z AI?

### Dział 2: Faktury i KSeF
1. Czym różni się faktura PDF od faktury XML?
2. Co to jest faktura ustrukturyzowana?
3. Skoro mam PDF-y, to po co mi KSeF?
4. Od czego zacząć przygotowania firmy do KSeF?

### Dział 3: Płatności i standardy bankowe
1. Co to jest ISO 20022?
2. Co to jest MT940?
3. Na czym polega migracja z MT940 na CAMT?
4. Co ta migracja oznacza dla mojej firmy?

### Dział 4: Współpraca
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
- JSON-LD `FAQPage` w `<head>` `index.html` z pełną treścią wszystkich 16 pytań
  i odpowiedzi (drugi blok `<script type="application/ld+json">`, obok istniejącego
  `ProfessionalService`).

## Weryfikacja

- Podgląd strony w przeglądarce: desktop i szerokość mobilna; akordeony otwierają się
  i zamykają, chevron się obraca.
- Walidacja poprawności HTML i JSON-LD (poprawny JSON, typ `FAQPage` z `mainEntity`).

## Poza zakresem

- Zmiany na pozostałych podstronach (uslugi.html itd.).
- Tabs/JS, wyszukiwarka w FAQ, linkowanie do bloga z odpowiedzi (można dodać później).
