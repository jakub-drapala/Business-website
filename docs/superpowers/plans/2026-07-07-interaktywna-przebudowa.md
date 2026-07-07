# Interaktywna przebudowa j-soft.me — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ożywić stronę (scroll-reveal, liczniki, mikro-interakcje), dodać interaktywną oś procesu, filtr FAQ i podstronę demo kontroli faktury KSeF — czysty vanilla JS, progressive enhancement.

**Architecture:** Jeden współdzielony `site.js` (defer, wszystkie strony) z niezależnymi modułami inicjowanymi warunkowo; samodzielny `demo-ksef.js` tylko na nowej podstronie; `kontakt.js` przejmuje inline skrypty EmailJS. Style dopisywane do istniejącego `style.css`. Bez JS strona wygląda i działa jak dziś.

**Tech Stack:** HTML + CSS + vanilla JS (ES5-owy styl, bez modułów, bez zależności, bez builda). Weryfikacja: geckodriver + python3/urllib (patrz `.claude/skills/verify/SKILL.md`).

**Spec:** `docs/superpowers/specs/2026-07-07-interaktywna-przebudowa-design.md`

## Global Constraints

- Strona w 100% działa bez JavaScriptu; stan „ukryty przed animacją" nadaje wyłącznie JS (klasa `js` na `<html>`).
- Animacje ≤ 0,6 s, tylko `transform`/`opacity`, jedna krzywa easing; pełny respekt `prefers-reduced-motion` (animacje wyłączone, liczniki od razu z wartością końcową, werdykty demo bez opóźnień). Wyjątek (decyzja Jakuba 2026-07-07): paint-only przejścia hover/cienia (np. box-shadow na nav, border/kolor) są dopuszczalne — nie przesuwają layoutu.
- Dane w demo jawnie fikcyjne (stały dopisek), zero wywołań sieciowych z demo, symulacja białej listy opisana wprost.
- Zero zależności, zero builda. Żadnych inline `<script>` po Task 5 (poza `application/ld+json`, którego CSP nie dotyczy).
- Polskie cudzysłowy „…” w treściach (ASCII `"` psuje JSON-LD — patrz verify skill).
- Commity po polsku, lokalnie na `main`, ze stopką `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. **Push = produkcja j-soft.me — wyłącznie za zgodą Jakuba.**
- Brak frameworka testowego: „test" = skrypt weryfikacyjny geckodriver z twardymi asercjami (exit code ≠ 0 przy porażce).
- Serwer lokalny na czas weryfikacji: `python3 -m http.server 8321` (z katalogu repo) + `geckodriver --port 4444`. Sprzątanie: PID z `ss -ltnp` (NIE `pkill -f` — łapie własny wrapper).
- `style.css` linkowany bez wersji do Task 5; Task 5 podbija wszystkie strony na `style.css?v=2` (immutable cache w `_headers`).

---

### Task 0: Harness weryfikacyjny

**Files:**
- Create: `.claude/verify/wd.py` (katalog `.claude/` jest w .gitignore — plik lokalny, bez commitu)

**Interfaces:**
- Produces: moduł `wd` z funkcjami `session(prefs=None,width=1440,height=900)->sid`, `go(sid,url)`, `js(sid,script,args=None)`, `shot(sid,path)`, `scroll_to(sid,selector)`, `end(sid)`. Używany przez weryfikacje Tasków 1–6.

- [ ] **Step 1: Napisz helper WebDriver**

```python
# .claude/verify/wd.py
import json, urllib.request, base64, time

BASE = 'http://127.0.0.1:4444'

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method,
                               headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read())['value']

def session(prefs=None, width=1440, height=900):
    opts = {'args': ['-headless']}
    if prefs:
        opts['prefs'] = prefs
    v = req('POST', '/session', {'capabilities': {'alwaysMatch': {'moz:firefoxOptions': opts}}})
    sid = v['sessionId']
    req('POST', '/session/%s/window/rect' % sid, {'width': width, 'height': height})
    return sid

def go(sid, url):
    req('POST', '/session/%s/url' % sid, {'url': url})
    time.sleep(1.2)

def js(sid, script, args=None):
    return req('POST', '/session/%s/execute/sync' % sid, {'script': script, 'args': args or []})

def shot(sid, path):
    b64 = req('GET', '/session/%s/screenshot' % sid)
    open(path, 'wb').write(base64.b64decode(b64))

def scroll_to(sid, sel):
    js(sid, "document.documentElement.style.scrollBehavior='auto';"
            "var el=document.querySelector(arguments[0]);"
            "window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90);", [sel])
    time.sleep(0.7)

def end(sid):
    req('DELETE', '/session/%s' % sid)
```

- [ ] **Step 2: Uruchom serwery i sprawdź helper**

```bash
cd /home/jakub-drapala/projects/Business-website
(python3 -m http.server 8321 >/dev/null 2>&1 &); (geckodriver --port 4444 >/dev/null 2>&1 &); sleep 2
python3 -c "
import sys; sys.path.insert(0, '.claude/verify')
from wd import *
sid = session(); go(sid, 'http://127.0.0.1:8321/index.html')
assert js(sid, 'return document.title') != '', 'brak tytulu'
end(sid); print('HARNESS OK')
"
```

Expected: `HARNESS OK`. Serwery zostają uruchomione dla kolejnych tasków. Bez commitu (plik jest w gitignore).

---

### Task 1: Fundament `site.js` — hamburger, nav-scrolled, scroll-reveal, liczniki, mikro-interakcje

**Files:**
- Create: `site.js`
- Modify: `style.css` (blok `/* ENHANCE */` przed `@media (max-width: 900px)`)
- Modify: `index.html`, `uslugi.html`, `doswiadczenie.html`, `kontakt.html`, `realizacje.html`, `blog/index.html`, `blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html` — `<script src="site.js" defer>` w `<head>`, usunięcie `onclick` z hamburgera, `<span class="arr">→</span>` w CTA na index

**Interfaces:**
- Produces: `site.js` jako IIFE ze zmiennymi `reduceMotion` (bool) i funkcjami `initReveal(extraSelector)`, `initCounters()` oraz sekcją `/* === INIT === */` na końcu — Taski 2–3 dopisują moduły PRZED tą sekcją i modyfikują ją. Klasa `js` na `<html>`; klasa `.reveal`/`.is-visible` na elementach; klasa `.nav-scrolled` na `<nav>`.

- [ ] **Step 1: Napisz `site.js`**

```js
/* j-soft.me — progressive enhancement. Strona dziala w pelni bez tego pliku. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Hamburger (przeniesiony z inline onclick) --- */
  var nav = document.querySelector('nav');
  var burger = document.querySelector('.hamburger');
  if (nav && burger) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
    });
  }

  /* --- Nav po przewinieciu --- */
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Scroll reveal --- */
  var REVEAL_SELECTOR = '.section-header, .problem-card, .svc-card, .trust-item';
  function initReveal(extraSelector) {
    var selector = extraSelector ? REVEAL_SELECTOR + ', ' + extraSelector : REVEAL_SELECTOR;
    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (reduceMotion || !('IntersectionObserver' in window) || !targets.length) return;
    var perParent = new Map();
    targets.forEach(function (el) {
      var n = perParent.get(el.parentElement) || 0;
      el.style.setProperty('--reveal-delay', (n * 60) + 'ms');
      perParent.set(el.parentElement, n + 1);
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* --- Liczniki trust-grid --- */
  function initCounters() {
    var nums = document.querySelectorAll('.trust-num');
    if (reduceMotion || !('IntersectionObserver' in window) || !nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }
  function animateCount(el) {
    var m = el.textContent.trim().match(/^(\d+)([\s\S]*)$/);
    if (!m) return;
    var target = parseInt(m[1], 10);
    var suffix = m[2];
    var t0 = null;
    var DUR = 600;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min((ts - t0) / DUR, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* === INIT === */
  initReveal('');
  initCounters();
})();
```

- [ ] **Step 2: Dopisz style do `style.css`** — blok wstawić BEZPOŚREDNIO PRZED linią `@media (max-width: 900px) {`

```css
/* ENHANCE — style aktywne tylko z JS (progressive enhancement) */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .5s ease, transform .5s ease;
  transition-delay: var(--reveal-delay, 0s);
}
.reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
nav { transition: box-shadow .25s ease; }
html.js nav.nav-scrolled:not(.nav-open) { box-shadow: 0 8px 30px rgba(0,0,0,0.35); }
.nav-links a { position: relative; }
.nav-links a::after {
  content: ''; position: absolute; left: 0; bottom: -4px;
  width: 100%; height: 1px; background: var(--gold-light);
  transform: scaleX(0); transform-origin: left; transition: transform .25s ease;
}
.nav-links a:hover::after, .nav-links a.active::after { transform: scaleX(1); }
.btn-gold .arr { display: inline-block; transition: transform .25s ease; }
.btn-gold:hover .arr { transform: translateX(4px); }
.svc-icon { display: inline-block; transition: transform .25s ease; }
.svc-card:hover .svc-icon { transform: translateY(-3px); }
```

- [ ] **Step 3: Podepnij `site.js` i usuń inline onclick na wszystkich stronach**

W każdym z 7 plików HTML dodaj w `<head>` po linii `<link rel="stylesheet" ...>`:
`<script src="site.js" defer></script>` (w plikach `blog/*.html`: `<script src="../site.js" defer></script>`).

Usuń atrybut onclick z hamburgera wszędzie:

```bash
cd /home/jakub-drapala/projects/Business-website
grep -rln 'hamburger' --include='*.html' .   # lista plików z hamburgerem
sed -i 's| onclick="document.querySelector('"'"'nav'"'"').classList.toggle('"'"'nav-open'"'"')"||' *.html blog/*.html
grep -rn 'onclick' --include='*.html' . ; echo "exit=$?"   # oczekiwane: brak trafień (exit=1)
```

W `index.html` w sekcji CTA zamień:
`<a href="kontakt.html" class="btn-gold">Umów bezpłatną konsultację →</a>`
na:
`<a href="kontakt.html" class="btn-gold">Umów bezpłatną konsultację <span class="arr">→</span></a>`

- [ ] **Step 4: Weryfikacja (asercje + zrzuty)**

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'
PAGES = ['index.html','uslugi.html','doswiadczenie.html','kontakt.html','realizacje.html','blog/index.html','blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html']

sid = session()
for p in PAGES:
    go(sid, B + p)
    assert js(sid, "return document.documentElement.classList.contains('js')"), 'site.js nie dziala na ' + p
go(sid, B); scroll_to(sid, '.about-section'); time.sleep(1.3)
nums = js(sid, "return Array.from(document.querySelectorAll('.trust-num')).map(e=>e.textContent)")
assert nums == ['7+', '4', '0 zł', '1:1'], 'liczniki nie doszly do wartosci: %r' % nums
assert js(sid, "return document.querySelectorAll('.reveal.is-visible').length > 0"), 'brak reveal'
assert js(sid, "return document.querySelector('nav').classList.contains('nav-scrolled')"), 'brak nav-scrolled'
shot(sid, '/tmp/t1-desktop.png'); end(sid)

sid = session(width=500, height=950)
go(sid, B)
js(sid, "document.querySelector('.hamburger').click()")
assert js(sid, "return document.querySelector('nav').classList.contains('nav-open')"), 'hamburger nie dziala'
assert js(sid, "return document.documentElement.scrollWidth - document.documentElement.clientWidth") == 0, 'overflow mobile'
end(sid)

sid = session(prefs={'ui.prefersReducedMotion': 1})
go(sid, B)
assert js(sid, "return document.querySelectorAll('.reveal').length") == 0, 'reduced-motion: reveal nie powinien byc dodany'
end(sid)
print('TASK 1 OK')
EOF
```

**Test no-JS:** z `javascript.enabled=False` WebDriver `execute/sync` też nie działa, więc no-JS sprawdzamy statycznie — klasa `.reveal` (jedyna ukrywająca treść) nie może występować w żadnym pliku HTML, bo nadaje ją wyłącznie JS:

```bash
grep -rn 'class="[^"]*reveal' --include='*.html' . ; echo "exit=$? (oczekiwane 1 = brak trafien)"
```

Expected: `TASK 1 OK`, screenshot `/tmp/t1-desktop.png` obejrzany (sekcje widoczne, brak glitchy).

- [ ] **Step 5: Commit**

```bash
git add site.js style.css index.html uslugi.html doswiadczenie.html kontakt.html realizacje.html blog/index.html blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html
git commit -m "Fundament site.js: scroll-reveal, liczniki, nav-scrolled, hamburger bez inline onclick

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Interaktywna oś procesu

**Files:**
- Modify: `index.html` (sekcja `.process-section`, ~linie 341–372: dopisanie `<p class="process-more">` do każdego kroku)
- Modify: `site.js` (nowa funkcja `initProcess()` przed `/* === INIT === */`, zmiana sekcji INIT)
- Modify: `style.css` (blok `/* PROCESS — oś */` w bloku ENHANCE + reguły mobile w media query)

**Interfaces:**
- Consumes: `reduceMotion`, `initReveal(extraSelector)` z Task 1.
- Produces: `initProcess()` zwraca `true` gdy oś zbudowana; buduje `.process-track` (przyciski `.process-node` z `aria-expanded`) i `.process-panel`; oryginalny `.process-grid` dostaje `hidden`.

- [ ] **Step 1: Dopisz treści `process-more` w `index.html`**

Do każdego `.process-step` po `.process-desc` dodaj akapit (dokładnie te treści — bez SLA, zgodnie z zasadą uczciwości):

Krok 01: `<p class="process-more">Pierwsza rozmowa jest bezpłatna i do niczego nie zobowiązuje. Wystarczy jedno zdanie w stylu „tracimy godziny na przepisywanie zamówień” — resztę pytań zadam ja.</p>`

Krok 02: `<p class="process-more">Bywa, że po analizie odradzam automatyzację, bo koszt przewyższyłby zysk. Wolę stracić zlecenie niż Twoje zaufanie. Jeśli temat ma sens — dostajesz konkretny kierunek.</p>`

Krok 03: `<p class="process-more">Prototyp oglądasz na przykładzie swojego procesu i decydujesz bez presji. Płacisz dopiero wtedy, gdy zdecydujesz się na wdrożenie.</p>`

Krok 04: `<p class="process-more">Po starcie nie znikam — umawiamy się, jak wygląda wsparcie i drobne poprawki. Narzędzie ma pracować latami, a nie tylko na pokazie.</p>`

- [ ] **Step 2: Dodaj `initProcess()` do `site.js`** (wklej PRZED `/* === INIT === */`)

```js
  /* --- Interaktywna os procesu --- */
  function initProcess() {
    var grid = document.querySelector('.process-grid');
    if (!grid) return false;
    var steps = Array.prototype.slice.call(grid.querySelectorAll('.process-step'));
    if (steps.length < 2) return false;

    var track = document.createElement('div');
    track.className = 'process-track';
    var panel = document.createElement('div');
    panel.className = 'process-panel';

    var nodes = steps.map(function (step, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'process-node';
      btn.innerHTML =
        '<span class="process-node-num">' + step.querySelector('.process-num').textContent + '</span>' +
        '<span class="process-node-name">' + step.querySelector('.process-name').textContent + '</span>';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () { activate(i, false); });
      track.appendChild(btn);
      return btn;
    });

    track.addEventListener('keydown', function (e) {
      var current = nodes.indexOf(document.activeElement);
      if (current === -1) return;
      var next = e.key === 'ArrowRight' ? current + 1 : (e.key === 'ArrowLeft' ? current - 1 : null);
      if (next === null || !nodes[next]) return;
      e.preventDefault();
      nodes[next].focus();
      activate(next, false);
    });

    function activate(i, instant) {
      nodes.forEach(function (n, j) {
        n.classList.toggle('is-active', j === i);
        n.setAttribute('aria-expanded', String(j === i));
      });
      var desc = steps[i].querySelector('.process-desc');
      var more = steps[i].querySelector('.process-more');
      var html = '<p class="process-panel-desc">' + desc.innerHTML + '</p>' +
                 (more ? '<p class="process-panel-more">' + more.innerHTML + '</p>' : '');
      if (!instant && !reduceMotion) {
        panel.classList.remove('is-shown');
        panel.innerHTML = html;
        void panel.offsetWidth;
        panel.classList.add('is-shown');
      } else {
        panel.innerHTML = html;
        panel.classList.add('is-shown');
      }
    }

    grid.hidden = true;
    grid.parentElement.insertBefore(track, grid);
    grid.parentElement.insertBefore(panel, grid);
    activate(0, true);
    return true;
  }
```

Zmień sekcję INIT na:

```js
  /* === INIT === */
  var hasTimeline = initProcess();
  initReveal(hasTimeline ? '.process-track, .process-panel' : '.process-step');
  initCounters();
```

- [ ] **Step 3: Style osi** — do bloku ENHANCE w `style.css` (przed media query):

```css
/* PROCESS — os (budowana przez JS) */
.process-track { display: flex; position: relative; margin-bottom: 28px; }
.process-track::before {
  content: ''; position: absolute; left: 40px; right: 40px; top: 27px;
  height: 2px; background: linear-gradient(90deg, var(--gold), var(--cream2));
}
.process-node {
  position: relative; flex: 1; background: none; border: none; cursor: pointer;
  padding: 8px 8px 0; text-align: center; font-family: 'DM Sans', sans-serif;
}
.process-node-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--white); border: 2px solid var(--cream2);
  color: var(--muted); font-family: 'Playfair Display', serif; font-size: 14px;
  position: relative; z-index: 1; transition: all .25s ease;
}
.process-node-name { display: block; margin-top: 10px; font-size: 14px; font-weight: 500; color: var(--muted); transition: color .25s ease; }
.process-node:hover .process-node-num { border-color: var(--gold); color: var(--gold); }
.process-node.is-active .process-node-num { background: var(--gold); border-color: var(--gold); color: var(--navy); }
.process-node.is-active .process-node-name { color: var(--navy); }
.process-node:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; }
.process-panel {
  background: var(--cream); padding: 28px 32px; max-width: 760px; margin: 0 auto;
  transition: opacity .3s ease, transform .3s ease;
}
.process-panel:not(.is-shown) { opacity: 0; transform: translateY(8px); }
.process-panel-desc { color: var(--text); font-size: 15px; line-height: 1.7; }
.process-panel-more { color: var(--muted); font-size: 14px; line-height: 1.8; font-weight: 300; margin-top: 10px; }
```

Do `@media (max-width: 900px)` dopisz:

```css
  .process-track { flex-direction: column; align-items: stretch; gap: 4px; }
  .process-track::before { left: 27px; right: auto; top: 10px; bottom: 10px; width: 2px; height: auto; background: linear-gradient(180deg, var(--gold), var(--cream2)); }
  .process-node { display: flex; align-items: center; gap: 14px; text-align: left; padding: 6px 8px; }
  .process-node-name { margin-top: 0; }
```

- [ ] **Step 4: Weryfikacja**

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'
sid = session()
go(sid, B); scroll_to(sid, '.process-section')
assert js(sid, "return !!document.querySelector('.process-track')"), 'brak osi'
assert js(sid, "return document.querySelector('.process-grid').hidden"), 'grid nie schowany'
assert js(sid, "return document.querySelectorAll('.process-node').length") == 4
js(sid, "document.querySelectorAll('.process-node')[2].click()"); time.sleep(0.5)
assert js(sid, "return document.querySelectorAll('.process-node')[2].getAttribute('aria-expanded')") == 'true'
assert 'Prototyp' in js(sid, "return document.querySelector('.process-panel').textContent"), 'panel bez tresci kroku 03'
js(sid, """var n=document.querySelectorAll('.process-node')[2]; n.focus();
n.parentElement.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));""")
time.sleep(0.5)
assert js(sid, "return document.querySelectorAll('.process-node')[3].getAttribute('aria-expanded')") == 'true', 'strzalka nie dziala'
shot(sid, '/tmp/t2-process.png'); end(sid)
print('TASK 2 OK')
EOF
grep -c 'process-more' index.html   # oczekiwane: 4
```

Expected: `TASK 2 OK`, w `/tmp/t2-process.png` oś ze złotą linią i aktywnym krokiem. Dodatkowo sprawdź fallback: `grep -n 'process-more' index.html` — treści w statycznym HTML (widoczne bez JS).

- [ ] **Step 5: Commit**

```bash
git add index.html site.js style.css
git commit -m "Interaktywna oś procesu: klikalne kroki 01-04 z panelem detali, fallback statyczny

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Filtr FAQ

**Files:**
- Modify: `site.js` (funkcje `normalize()`, `escapeHtml()`, `initFaqFilter()` przed `/* === INIT === */`; dopisanie wywołania w INIT)
- Modify: `style.css` (blok `/* FAQ FILTR */` w ENHANCE)

**Interfaces:**
- Consumes: strukturę FAQ z index.html: `.faq-groups > .faq-group > details.faq-item > summary + .faq-answer`.
- Produces: pole `#faq-filter` (input wstawiany przez JS — bez JS brak martwego elementu), licznik `.faq-count` (aria-live), pusty stan `.faq-empty`.

- [ ] **Step 1: Dodaj moduł filtra do `site.js`** (przed `/* === INIT === */`)

```js
  /* --- Filtr FAQ --- */
  function normalize(s) {
    return Array.prototype.map.call(s, function (c) {
      var lower = c.toLowerCase();
      if (lower === 'ł') return 'l'; /* ł nie rozkłada się w NFD */
      return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }).join('');
  }
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initFaqFilter() {
    var groupsWrap = document.querySelector('.faq-groups');
    if (!groupsWrap) return;
    var groups = Array.prototype.slice.call(groupsWrap.querySelectorAll('.faq-group'));
    var items = Array.prototype.slice.call(groupsWrap.querySelectorAll('.faq-item')).map(function (details) {
      var summary = details.querySelector('summary');
      return {
        details: details,
        summary: summary,
        originalSummary: summary.innerHTML,
        summaryText: summary.textContent,
        norm: normalize(summary.textContent + ' ' + details.querySelector('.faq-answer').textContent)
      };
    });

    var bar = document.createElement('div');
    bar.className = 'faq-search';
    bar.innerHTML =
      '<input type="search" id="faq-filter" autocomplete="off"' +
      ' placeholder="Filtruj pytania — np. KSeF, RAG, koszty…"' +
      ' aria-label="Filtruj pytania FAQ">' +
      '<p class="faq-count" aria-live="polite"></p>';
    groupsWrap.parentElement.insertBefore(bar, groupsWrap);

    var empty = document.createElement('p');
    empty.className = 'faq-empty';
    empty.hidden = true;
    empty.innerHTML = 'Nie ma takiego pytania — <a href="kontakt.html">zadaj je mi bezpośrednio</a>.';
    groupsWrap.parentElement.insertBefore(empty, groupsWrap.nextSibling);

    var input = bar.querySelector('#faq-filter');
    var count = bar.querySelector('.faq-count');
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { apply(input.value); }, 120);
    });

    function apply(raw) {
      var q = normalize(raw.trim());
      var visible = 0;
      items.forEach(function (item) {
        var hit = q === '' || item.norm.indexOf(q) !== -1;
        item.details.hidden = !hit;
        if (hit) visible++;
        highlight(item, q);
      });
      groups.forEach(function (group) {
        group.hidden = group.querySelectorAll('.faq-item:not([hidden])').length === 0;
      });
      if (q === '') {
        count.textContent = '';
        empty.hidden = true;
        return;
      }
      count.textContent = 'Pokazuję ' + visible + ' z ' + items.length + ' pytań';
      empty.hidden = visible !== 0;
      if (visible > 0 && visible <= 3) {
        items.forEach(function (item) {
          if (!item.details.hidden) item.details.open = true;
        });
      }
    }

    /* normalize() mapuje znak-na-znak (1:1), wiec indeksy w tekscie
       znormalizowanym odpowiadaja oryginalowi */
    function highlight(item, q) {
      if (q === '') { item.summary.innerHTML = item.originalSummary; return; }
      var idx = normalize(item.summaryText).indexOf(q);
      if (idx === -1) { item.summary.innerHTML = item.originalSummary; return; }
      var t = item.summaryText;
      item.summary.innerHTML =
        escapeHtml(t.slice(0, idx)) + '<mark>' + escapeHtml(t.slice(idx, idx + q.length)) + '</mark>' +
        escapeHtml(t.slice(idx + q.length));
    }
  }
```

W sekcji INIT dopisz na końcu: `initFaqFilter();`

- [ ] **Step 2: Style filtra** — do bloku ENHANCE w `style.css`:

```css
/* FAQ FILTR (wstawiany przez JS) */
.faq-search { max-width: 560px; margin-bottom: 40px; }
.faq-search input {
  width: 100%; padding: 14px 16px;
  border: 1px solid var(--cream2); background: var(--white);
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text);
  outline: none; transition: border-color .2s;
}
.faq-search input:focus { border-color: var(--gold); }
.faq-count { margin-top: 8px; font-size: 12px; color: var(--muted); min-height: 18px; }
.faq-item summary mark { background: rgba(200,151,58,0.25); color: inherit; }
.faq-empty { color: var(--muted); font-size: 15px; }
.faq-empty a { color: var(--gold); }
```

- [ ] **Step 3: Weryfikacja**

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'
sid = session()
go(sid, B); scroll_to(sid, '.faq-section')

def typeq(q):
    js(sid, "var i=document.getElementById('faq-filter'); i.value=arguments[0];"
            "i.dispatchEvent(new Event('input',{bubbles:true}));", [q])
    time.sleep(0.4)

assert js(sid, "return !!document.getElementById('faq-filter')"), 'brak pola filtra'
typeq('ksef')
vis = js(sid, "return document.querySelectorAll('.faq-item:not([hidden])').length")
assert 0 < vis < 21, 'filtr ksef: %r widocznych' % vis
assert 'z 21' in js(sid, "return document.querySelector('.faq-count').textContent")
assert js(sid, "return document.querySelectorAll('.faq-item summary mark').length > 0"), 'brak podswietlenia'
typeq('bialalistaxyz')
assert js(sid, "return document.querySelectorAll('.faq-item:not([hidden])').length") == 0
assert js(sid, "return !document.querySelector('.faq-empty').hidden"), 'brak pustego stanu'
typeq('rag')
opened = js(sid, "return document.querySelectorAll('.faq-item:not([hidden])[open]').length")
assert opened >= 1, 'przy <=3 wynikach pytania powinny byc otwarte'
typeq('')
assert js(sid, "return document.querySelectorAll('.faq-item:not([hidden])').length") == 21
shot(sid, '/tmp/t3-faq.png'); end(sid)
print('TASK 3 OK')
EOF
```

Expected: `TASK 3 OK`. Uwaga: jeśli „rag" daje > 3 trafień (słowo występuje w innych odpowiedziach), zmień zapytanie testowe na bardziej selektywne (np. `retrieval`) zamiast zmieniać implementację.

- [ ] **Step 4: Commit**

```bash
git add site.js style.css
git commit -m "Filtr FAQ: wyszukiwanie na żywo po pytaniach i odpowiedziach, bez wrażliwości na diakrytyki

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Demo kontroli faktury KSeF

**Files:**
- Create: `demo-ksef.html`
- Create: `demo-ksef.js`
- Modify: `style.css` (blok `/* DEMO KSEF */` + mobile)
- Modify: `index.html` (link w karcie usługi KSeF; zdanie + link w odpowiedzi FAQ i w JSON-LD FAQPage)
- Modify: `uslugi.html` (link w sekcji KSeF)
- Modify: `blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html` (link do demo)
- Modify: `sitemap.xml` (wpis demo + lastmod index)

**Interfaces:**
- Consumes: `site.js` (nav, reveal na `.section-header`), style bazowe (`page-hero`, `btn-gold`, `divider`).
- Produces: strona `/demo-ksef.html`; `demo-ksef.js` czyta DOM po `data-check` (wartości: `xml-pdf`, `suma`, `nip`, `biala-lista`, `duplikat`) i `data-field` (wartości: `numer`, `nip`, `brutto`, `rachunek`); id: `#demo-run`, `#demo-summary`, `#demo-summary-line`.

- [ ] **Step 1: Utwórz `demo-ksef.html`**

```html
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="https://j-soft.me/demo-ksef.html">
<meta name="description" content="Interaktywne demo: 5 kontroli faktury z KSeF przed płatnością — zgodność XML z PDF, kwoty, NIP, biała lista VAT i duplikaty. Dane fikcyjne, mechanizmy prawdziwe.">
<meta property="og:title" content="Demo: kontrola faktury z KSeF przed płatnością | J-SOFT">
<meta property="og:description" content="Zobacz, jak automat sprawdza fakturę kosztową zanim ktokolwiek zleci przelew. 5 kontroli, dane fikcyjne, mechanizmy prawdziwe.">
<meta property="og:type" content="website">
<meta property="og:locale" content="pl_PL">
<meta property="og:url" content="https://j-soft.me/demo-ksef.html">
<meta property="og:site_name" content="J-SOFT">
<meta property="og:image" content="https://j-soft.me/j-soft-gradient.jpeg">
<meta name="theme-color" content="#0a1628">
<title>Demo: kontrola faktury z KSeF przed płatnością · J-SOFT</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="192x192" href="/favicon-192.png">
<link rel="stylesheet" href="style.css">
<script src="site.js" defer></script>
<script src="demo-ksef.js" defer></script>
</head>
<body>

<nav>
  <a href="index.html" class="logo">J-SOFT<span> Jakub Drapała</span></a>
  <div class="nav-links">
    <a href="uslugi.html">Usługi</a>
    <a href="doswiadczenie.html">Doświadczenie</a>
    <a href="kontakt.html">Kontakt</a>
    <a href="/blog/">Blog</a>
  </div>
  <a href="kontakt.html" class="nav-cta">Konsultacja</a>
  <button class="hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<div class="page-hero">
  <div class="section-eyebrow">Demo</div>
  <h1>Kontrola faktury<br><em>przed płatnością</em></h1>
  <p class="page-hero-desc">Tak działa automatyczna kontrola faktury kosztowej pobranej z KSeF — pięć sprawdzeń, zanim ktokolwiek zleci przelew. Wszystkie dane poniżej są fikcyjne; mechanizmy kontroli są prawdziwe.</p>
</div>

<div class="divider"></div>

<div class="demo-section">
  <p class="demo-note">Dane przykładowe — firma, NIP i rachunek są fikcyjne. Biała lista VAT jest w tym demo symulowana lokalnie; w realnym wdrożeniu sprawdza ją API Ministerstwa Finansów.</p>

  <noscript>
    <p class="demo-note">To demo wymaga JavaScriptu. Opis wszystkich pięciu kontroli znajdziesz w artykule <a href="blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html">KSeF i faktury kosztowe: 5 kontroli przed płatnością</a>.</p>
  </noscript>

  <div class="demo-wrap">
    <div class="demo-invoice">
      <div class="demo-panel-label">Faktura ustrukturyzowana · dane fikcyjne</div>
      <div class="inv-row" data-field="numer"><span>Numer</span><strong>FV 118/07/2026</strong></div>
      <div class="inv-row" data-field="sprzedawca"><span>Sprzedawca</span><strong>BUD-STAL Sp. z o.o.</strong></div>
      <div class="inv-row" data-field="nip"><span>NIP</span><strong>111-111-11-11</strong></div>
      <div class="inv-row" data-field="pozycje"><span>Stal zbrojeniowa B500SP, 2 t</span><strong>10 800,00 zł</strong></div>
      <div class="inv-row" data-field="pozycje"><span>Transport HDS</span><strong>3 600,00 zł</strong></div>
      <div class="inv-row" data-field="netto"><span>Netto</span><strong>14 400,00 zł</strong></div>
      <div class="inv-row" data-field="vat"><span>VAT 23%</span><strong>3 312,00 zł</strong></div>
      <div class="inv-row inv-row-total" data-field="brutto"><span>Do zapłaty (brutto)</span><strong>17 712,00 zł</strong></div>
      <div class="inv-row" data-field="rachunek"><span>Rachunek</span><strong>PL61 1090 1014 0000 0712 1981 2874</strong></div>
      <div class="inv-row" data-field="termin"><span>Termin płatności</span><strong>21.07.2026</strong></div>
    </div>

    <div class="demo-checks">
      <div class="demo-panel-label">Kontrole przed płatnością</div>
      <div class="check-row" data-check="xml-pdf">
        <div class="check-head"><span class="check-dot"></span><span class="check-name">1. Zgodność XML z PDF</span></div>
        <p class="check-msg"></p>
      </div>
      <div class="check-row" data-check="suma">
        <div class="check-head"><span class="check-dot"></span><span class="check-name">2. Kwota do zapłaty</span></div>
        <p class="check-msg"></p>
      </div>
      <div class="check-row" data-check="nip">
        <div class="check-head"><span class="check-dot"></span><span class="check-name">3. NIP kontrahenta</span></div>
        <p class="check-msg"></p>
      </div>
      <div class="check-row" data-check="biala-lista">
        <div class="check-head"><span class="check-dot"></span><span class="check-name">4. Biała lista VAT</span></div>
        <p class="check-msg"></p>
      </div>
      <div class="check-row" data-check="duplikat">
        <div class="check-head"><span class="check-dot"></span><span class="check-name">5. Duplikat faktury</span></div>
        <p class="check-msg"></p>
      </div>
      <button id="demo-run" class="btn-gold" type="button">Uruchom kontrole</button>
    </div>
  </div>

  <div id="demo-summary" class="demo-summary" hidden>
    <p id="demo-summary-line" class="demo-summary-line"></p>
    <p class="demo-summary-note">W realnym wdrożeniu te kontrole działają automatycznie dla każdej faktury pobranej z KSeF — wynik trafia do osoby, która zatwierdza płatność. Kontrola nie zastępuje księgowej: podpowiada, gdzie spojrzeć, zanim pieniądze wyjdą z firmy.</p>
    <div class="demo-summary-links">
      <a href="blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html">Przeczytaj artykuł o tych kontrolach</a>
      <a href="kontakt.html" class="btn-gold">Chcę taką kontrolę u siebie <span class="arr">→</span></a>
    </div>
  </div>
</div>

<footer>
  <a href="index.html" class="footer-logo">J-SOFT<span> Jakub Drapała</span></a>
  <p>© 2026 · Usługi IT dla firm · Automatyzacja · AI · Aplikacje · Integracje</p>
  <p>Dębica · Podkarpackie · cała Polska zdalnie</p>
</footer>

<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "882d9c8667b04eb5aa3e356e2c5c215f"}'></script>
</body>
</html>
```

- [ ] **Step 2: Utwórz `demo-ksef.js`**

```js
/* Demo kontroli faktury z KSeF. Dane w 100% fikcyjne. Zero wywolan sieciowych. */
(function () {
  'use strict';

  var runBtn = document.getElementById('demo-run');
  if (!runBtn) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP_MS = reduceMotion ? 0 : 800;

  var INVOICE = {
    numer: 'FV 118/07/2026',
    nip: '111-111-11-11',
    rachunek: 'PL61 1090 1014 0000 0712 1981 2874',
    pozycjeNetto: [10800, 3600],
    netto: 14400,
    vat: 3312,
    brutto: 17712,
    pdfBrutto: 17712
  };
  /* Symulowana biala lista: dla tego NIP zarejestrowany jest INNY rachunek. */
  var BIALA_LISTA = { '1111111111': ['PL27114020040000300201355387'] };
  var HISTORIA_PLATNOSCI = ['FV 92/05/2026', 'FV 103/06/2026'];

  function digits(s) { return s.replace(/\D/g, ''); }
  function bezSpacji(s) { return s.replace(/\s/g, ''); }

  /* Prawdziwy algorytm sumy kontrolnej NIP (wagi 6-5-7-2-3-4-5-6-7, mod 11). */
  function nipPoprawny(nip) {
    var d = digits(nip);
    if (d.length !== 10) return false;
    var w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += w[i] * +d[i];
    return sum % 11 === +d[9];
  }

  var CHECKS = [
    { id: 'xml-pdf', field: 'brutto', run: function () {
        var ok = INVOICE.pdfBrutto === INVOICE.brutto;
        return { ok: ok, msg: ok
          ? 'Kwota w wizualizacji PDF zgadza się z danymi XML (17 712,00 zł). Liczy się XML — to on jest fakturą.'
          : 'Kwota w PDF różni się od XML — księguj wyłącznie na podstawie XML.' };
      } },
    { id: 'suma', field: 'brutto', run: function () {
        var netto = 0;
        for (var i = 0; i < INVOICE.pozycjeNetto.length; i++) netto += INVOICE.pozycjeNetto[i];
        var ok = netto === INVOICE.netto && netto + INVOICE.vat === INVOICE.brutto;
        return { ok: ok, msg: ok
          ? 'Suma pozycji (14 400,00) + VAT (3 312,00) = kwota do zapłaty. Rachunek się zgadza.'
          : 'Suma pozycji nie zgadza się z kwotą do zapłaty — wyjaśnij przed księgowaniem.' };
      } },
    { id: 'nip', field: 'nip', run: function () {
        var ok = nipPoprawny(INVOICE.nip);
        return { ok: ok, msg: ok
          ? 'Suma kontrolna NIP poprawna (algorytm prawdziwy, numer fikcyjny).'
          : 'NIP ma błędną sumę kontrolną — faktura do wyjaśnienia.' };
      } },
    { id: 'biala-lista', field: 'rachunek', run: function () {
        var konta = BIALA_LISTA[digits(INVOICE.nip)] || [];
        var ok = konta.indexOf(bezSpacji(INVOICE.rachunek)) !== -1;
        return { ok: ok, msg: ok
          ? 'Rachunek zgodny z białą listą VAT.'
          : 'Rachunek z faktury NIE widnieje na (symulowanej) białej liście dla tego NIP. Przy kwocie powyżej 15 tys. zł zapłata na taki rachunek to utrata kosztu podatkowego i solidarna odpowiedzialność za VAT. Wstrzymaj płatność i wyjaśnij z kontrahentem.' };
      } },
    { id: 'duplikat', field: 'numer', run: function () {
        var ok = HISTORIA_PLATNOSCI.indexOf(INVOICE.numer) === -1;
        return { ok: ok, msg: ok
          ? 'Numer FV 118/07/2026 nie występuje w historii płatności — to nie duplikat.'
          : 'Ta faktura już była opłacona — zablokuj ponowną płatność.' };
      } }
  ];

  var summary = document.getElementById('demo-summary');
  var summaryLine = document.getElementById('demo-summary-line');

  function row(id) { return document.querySelector('.check-row[data-check="' + id + '"]'); }
  function field(name) { return document.querySelector('.inv-row[data-field="' + name + '"]'); }

  function reset() {
    CHECKS.forEach(function (chk) {
      var r = row(chk.id);
      r.classList.remove('is-running', 'is-ok', 'is-warn');
      r.querySelector('.check-msg').textContent = '';
      var f = field(chk.field);
      if (f) f.classList.remove('is-checking', 'is-flagged');
    });
    summary.hidden = true;
  }

  function runAll() {
    reset();
    runBtn.disabled = true;
    var i = 0;
    var warns = 0;
    function next() {
      if (i >= CHECKS.length) { finish(warns); return; }
      var chk = CHECKS[i];
      var r = row(chk.id);
      var f = field(chk.field);
      r.classList.add('is-running');
      if (f) f.classList.add('is-checking');
      window.setTimeout(function () {
        var res = chk.run();
        r.classList.remove('is-running');
        if (f) f.classList.remove('is-checking');
        r.classList.add(res.ok ? 'is-ok' : 'is-warn');
        r.querySelector('.check-msg').textContent = res.msg;
        if (!res.ok) {
          warns++;
          if (f) f.classList.add('is-flagged');
        }
        i++;
        next();
      }, STEP_MS);
    }
    next();
  }

  function finish(warns) {
    summaryLine.textContent = (CHECKS.length - warns) + ' z ' + CHECKS.length + ' kontroli OK — ' +
      (warns ? 'tej faktury nie opłacaj bez wyjaśnienia rachunku.' : 'faktura gotowa do płatności.');
    summary.hidden = false;
    runBtn.disabled = false;
    runBtn.textContent = 'Uruchom ponownie';
  }

  runBtn.addEventListener('click', runAll);
})();
```

- [ ] **Step 3: Style demo** — do bloku ENHANCE w `style.css` (przed media query):

```css
/* DEMO KSEF */
.demo-section { background: var(--cream); padding: 80px 60px; }
.demo-note {
  max-width: 860px; margin: 0 auto 40px;
  background: var(--white); border-left: 3px solid var(--gold);
  padding: 16px 20px; color: var(--muted); font-size: 13px; line-height: 1.7; font-weight: 300;
}
.demo-note a { color: var(--gold); }
.demo-wrap { display: grid; grid-template-columns: 1.15fr 1fr; gap: 32px; max-width: 1100px; margin: 0 auto; align-items: start; }
.demo-invoice, .demo-checks { background: var(--white); padding: 28px 32px; }
.demo-panel-label { color: var(--gold); font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 500; margin-bottom: 18px; }
.inv-row {
  display: flex; justify-content: space-between; gap: 16px;
  padding: 10px 6px; border-bottom: 1px solid var(--cream);
  font-size: 14px; transition: background .25s ease, box-shadow .25s ease;
}
.inv-row span { color: var(--muted); font-weight: 300; }
.inv-row strong { color: var(--navy); font-weight: 500; text-align: right; }
.inv-row-total strong { font-family: 'Playfair Display', serif; font-size: 17px; }
.inv-row.is-checking { background: rgba(200,151,58,0.12); box-shadow: inset 0 0 0 2px var(--gold); }
.inv-row.is-flagged { background: rgba(179,38,30,0.07); box-shadow: inset 0 0 0 2px #b3261e; }
.check-row { padding: 14px 6px; border-bottom: 1px solid var(--cream); }
.check-head { display: flex; align-items: center; gap: 12px; }
.check-dot {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--cream2); background: transparent; transition: all .25s ease;
}
.check-row.is-running .check-dot { border-color: var(--gold); background: var(--gold); }
.check-row.is-ok .check-dot { border-color: #2e7d32; background: #2e7d32; }
.check-row.is-warn .check-dot { border-color: #b3261e; background: #b3261e; }
.check-name { color: var(--navy); font-size: 14px; font-weight: 500; }
.check-row.is-warn .check-name { color: #b3261e; }
.check-msg { margin: 8px 0 0 24px; color: var(--muted); font-size: 13px; line-height: 1.7; font-weight: 300; }
.check-msg:empty { display: none; }
#demo-run { margin-top: 24px; width: 100%; }
#demo-run:disabled { opacity: 0.55; cursor: default; }
.demo-summary {
  max-width: 1100px; margin: 32px auto 0;
  background: var(--navy); padding: 32px 36px; border-left: 3px solid var(--gold);
}
.demo-summary-line { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--white); font-weight: 700; }
.demo-summary-note { color: rgba(255,255,255,0.55); font-size: 14px; line-height: 1.8; font-weight: 300; margin-top: 12px; }
.demo-summary-links { display: flex; gap: 24px; align-items: center; margin-top: 24px; flex-wrap: wrap; }
.demo-summary-links a:first-child { color: var(--gold-light); font-size: 14px; }
.svc-link { display: inline-block; margin-top: 14px; color: var(--gold); font-size: 13px; font-weight: 500; text-decoration: none; }
.svc-link:hover { text-decoration: underline; }
```

Do `@media (max-width: 900px)` dopisz:

```css
  .demo-section { padding: 60px 24px; }
  .demo-wrap { grid-template-columns: 1fr; }
```

- [ ] **Step 4: Linki prowadzące do demo**

a) `index.html`, karta usługi KSeF — po `<div class="svc-desc">Pomagam przygotować systemy...</div>` dodaj:
`<a class="svc-link" href="demo-ksef.html">Zobacz demo kontroli faktury →</a>`

b) `index.html`, FAQ, pytanie `Czy KSeF sam wykryje błędy i nadużycia na fakturach?` — na końcu akapitu odpowiedzi (w `.faq-answer`, przed `</p>`) dopisz:
` Przygotowałem też <a href="demo-ksef.html">interaktywne demo takiej kontroli</a> — zobaczysz krok po kroku, co wychwytuje automat.`

c) `index.html`, JSON-LD FAQPage — w `acceptedAnswer.text` tego samego pytania dopisz na końcu (czysty tekst, bez HTML):
` Przygotowałem też interaktywne demo takiej kontroli — pokazuje krok po kroku, co wychwytuje automat.`

d) `uslugi.html` — w sekcji usługi KSeF (znajdź nagłówek zawierający „KSeF") na końcu opisu dodaj:
`<p><a class="svc-link" href="demo-ksef.html">Zobacz interaktywne demo kontroli faktury przed płatnością →</a></p>`

e) `blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html` — na końcu treści artykułu (przed stopką/ostatnią sekcją) dodaj:
`<p><strong><a href="../demo-ksef.html">Zobacz te kontrole w działaniu — interaktywne demo →</a></strong></p>`

f) `sitemap.xml` — przed `</urlset>` dodaj oraz podbij `lastmod` wpisu `https://j-soft.me/` na `2026-07-07`:

```xml
  <url>
    <loc>https://j-soft.me/demo-ksef.html</loc>
    <lastmod>2026-07-07</lastmod>
    <priority>0.6</priority>
  </url>
```

- [ ] **Step 5: Weryfikacja**

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time, json, re, urllib.request; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'

# JSON-LD nadal parsuje po edycji FAQ
html = open('index.html', encoding='utf-8').read()
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    json.loads(block)

# linki 200
for url in ['demo-ksef.html', 'demo-ksef.js']:
    assert urllib.request.urlopen(B + url).status == 200, url

sid = session()
go(sid, B + 'demo-ksef.html')
assert js(sid, "return document.querySelectorAll('.check-row').length") == 5
js(sid, "document.getElementById('demo-run').click()")
time.sleep(5 * 0.8 + 1.5)
assert js(sid, "return document.querySelectorAll('.check-row.is-ok').length") == 4, 'oczekiwane 4x OK'
assert js(sid, "return document.querySelector('.check-row[data-check=\"biala-lista\"]').classList.contains('is-warn')"), 'biala lista powinna byc na czerwono'
assert js(sid, "return document.querySelector('.inv-row[data-field=\"rachunek\"]').classList.contains('is-flagged')"), 'rachunek nie oznaczony'
line = js(sid, "return document.getElementById('demo-summary-line').textContent")
assert '4 z 5' in line, line
assert js(sid, "return document.getElementById('demo-run').textContent") == 'Uruchom ponownie'
js(sid, "document.getElementById('demo-run').click()"); time.sleep(0.3)
assert js(sid, "return document.getElementById('demo-summary').hidden"), 'reset nie chowa podsumowania'
time.sleep(5 * 0.8 + 1.5)
shot(sid, '/tmp/t4-demo.png')
# demo nie strzela do sieci: zadnych requestow poza localhost/fonts/cloudflare
hosts = js(sid, "return performance.getEntriesByType('resource').map(r=>new URL(r.name).host)")
allowed = {'127.0.0.1:8321', 'fonts.googleapis.com', 'fonts.gstatic.com', 'static.cloudflareinsights.com', 'cloudflareinsights.com'}
assert set(hosts) <= allowed, 'nieoczekiwane hosty: %r' % (set(hosts) - allowed)
end(sid)

# wejscia do demo
sid = session()
go(sid, B)
assert js(sid, "return document.querySelectorAll('a[href=\"demo-ksef.html\"]').length") >= 2, 'brak linkow na index'
end(sid)
print('TASK 4 OK')
EOF
grep -c 'demo-ksef' uslugi.html blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html sitemap.xml
```

Expected: `TASK 4 OK`; każdy grep ≥ 1; `/tmp/t4-demo.png` obejrzany (4 zielone kropki, 1 czerwona, podsumowanie navy).

- [ ] **Step 6: Commit**

```bash
git add demo-ksef.html demo-ksef.js style.css index.html uslugi.html blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html sitemap.xml
git commit -m "Demo kontroli faktury KSeF: pulpit z fikcyjną fakturą i 5 kontrolami przed płatnością

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `kontakt.js`, zaostrzenie CSP, wersjonowanie CSS

**Files:**
- Create: `kontakt.js`
- Modify: `kontakt.html` (usunięcie dwóch inline skryptów, podpięcie `kontakt.js`)
- Modify: `_headers` (script-src bez `'unsafe-inline'`)
- Modify: wszystkie pliki HTML (link `style.css?v=2`)

**Interfaces:**
- Consumes: formularz `#contact-form`, przycisk `#submit-btn`, globalny `emailjs` z SDK (cdn.jsdelivr.net, ładowany w `<head>` kontakt.html).
- Produces: brak inline `<script>` w całym serwisie (poza `application/ld+json`).

- [ ] **Step 1: Utwórz `kontakt.js`** (logika przeniesiona 1:1 z inline skryptów kontakt.html)

```js
/* Formularz kontaktowy (EmailJS). Logika przeniesiona z inline <script> dla scislego CSP. */
(function () {
  'use strict';
  if (typeof emailjs === 'undefined') return;
  emailjs.init('ZOBwl7GMNRPwk_VRu');

  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('submit-btn');
    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;
    emailjs.sendForm('service_3ae2jx4', 'template_tkwp64l', this)
      .then(function () {
        btn.textContent = 'Wysłano! ✓';
      }, function (error) {
        btn.textContent = 'Błąd — spróbuj ponownie';
        btn.disabled = false;
        console.error('EmailJS error:', error);
      });
  });
})();
```

- [ ] **Step 2: Podmień skrypty w `kontakt.html`**

Usuń linię `<script>emailjs.init('ZOBwl7GMNRPwk_VRu');</script>` (po SDK w head) i cały blok `<script>document.getElementById('contact-form')...</script>` przy formularzu. Po linii SDK (`<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>`) dodaj:
`<script src="kontakt.js" defer></script>`

Kontrola: `grep -n '<script>' kontakt.html` → brak trafień.

- [ ] **Step 3: Zaostrzenie CSP w `_headers`**

W linii `Content-Security-Policy` zamień:
`script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com`
na:
`script-src 'self' https://cdn.jsdelivr.net https://static.cloudflareinsights.com`

Kontrola, że nigdzie nie został wykonywalny inline skrypt:

```bash
grep -rn '<script>' --include='*.html' . ; echo "exit=$? (oczekiwane 1)"
grep -rn 'onclick\|onload\|onsubmit' --include='*.html' . ; echo "exit=$? (oczekiwane 1)"
```

- [ ] **Step 4: Wersjonowanie CSS**

```bash
cd /home/jakub-drapala/projects/Business-website
sed -i 's|href="style.css"|href="style.css?v=2"|' *.html
sed -i 's|href="../style.css"|href="../style.css?v=2"|' blog/*.html
grep -rn 'style.css' --include='*.html' . | grep -v 'v=2' ; echo "exit=$? (oczekiwane 1)"
```

- [ ] **Step 5: Weryfikacja formularza (bez wysyłania prawdziwego maila!)**

`http.server` nie serwuje `_headers`, więc CSP nie da się sprawdzić lokalnie — po deployu: `curl -sI https://j-soft.me | grep -i content-security`. Lokalnie sprawdzamy, że handler działa (z podmienionym `sendForm`, żeby NIE wysłać maila):

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'
sid = session()
go(sid, B + 'kontakt.html'); time.sleep(1)
assert js(sid, "return typeof emailjs !== 'undefined'"), 'SDK EmailJS nie zaladowany'
js(sid, """
emailjs.sendForm = function(){ return Promise.resolve(); };  // stub - zero prawdziwych maili
document.querySelectorAll('#contact-form input, #contact-form textarea').forEach(function(el){ el.value = 'test'; });
var em = document.querySelector('#contact-form input[type=email]'); if (em) em.value = 'test@example.com';
document.getElementById('contact-form').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
""")
time.sleep(0.6)
txt = js(sid, "return document.getElementById('submit-btn').textContent")
assert 'Wysłano' in txt, 'handler formularza nie zadzialal: %r' % txt
end(sid)
print('TASK 5 OK')
EOF
```

Expected: `TASK 5 OK`. Realną wysyłkę maila testuje Jakub ręcznie po deployu.

- [ ] **Step 6: Commit**

```bash
git add kontakt.js kontakt.html _headers *.html blog/*.html
git commit -m "kontakt.js zamiast inline skryptów, CSP bez unsafe-inline, style.css?v=2

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Weryfikacja end-to-end i sprzątanie

**Files:**
- Brak nowych; ewentualne poprawki z weryfikacji.

**Interfaces:**
- Consumes: całość z Tasków 1–5.

- [ ] **Step 1: Pełny przebieg E2E**

```bash
cd /home/jakub-drapala/projects/Business-website && python3 - <<'EOF'
import sys, time, json, re; sys.path.insert(0, '.claude/verify')
from wd import *
B = 'http://127.0.0.1:8321/'
PAGES = ['index.html','uslugi.html','doswiadczenie.html','kontakt.html','realizacje.html','demo-ksef.html','blog/index.html','blog/ksef-faktury-kosztowe-kontrole-przed-platnoscia.html']

# desktop i mobile: kazda strona bez poziomego overflow, site.js aktywny
for w, label in [(1440, 'desktop'), (500, 'mobile')]:
    sid = session(width=w, height=950)
    for p in PAGES:
        go(sid, B + p)
        assert js(sid, "return document.documentElement.classList.contains('js')"), p
        ov = js(sid, "return document.documentElement.scrollWidth - document.documentElement.clientWidth")
        assert ov == 0, 'overflow %s na %s: %spx' % (label, p, ov)
    end(sid)

# reduced-motion: brak reveal, liczniki od razu koncowe, demo bez opoznien
sid = session(prefs={'ui.prefersReducedMotion': 1})
go(sid, B)
assert js(sid, "return document.querySelectorAll('.reveal').length") == 0
go(sid, B + 'demo-ksef.html')
js(sid, "document.getElementById('demo-run').click()"); time.sleep(0.8)
assert js(sid, "return document.querySelectorAll('.check-row.is-ok, .check-row.is-warn').length") == 5, 'reduced-motion: kontrole powinny byc natychmiastowe'
end(sid)

# JSON-LD na index parsuje
html = open('index.html', encoding='utf-8').read()
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    json.loads(block)
print('TASK 6 E2E OK')
EOF
```

- [ ] **Step 2: Zrzuty do oceny wizualnej** — `index` (hero, FAQ z filtrem, proces, o mnie) i `demo-ksef` po przebiegu kontroli, desktop + mobile; obejrzeć każdy.

- [ ] **Step 3: Test no-JS (ręcznie przez geckodriver z wyłączonym JS nie zadziała `execute`)** — statyczna kontrola:

```bash
# zadne tresci nie sa domyslnie ukryte przez markup:
grep -rn 'class="[^"]*reveal\|hidden' --include='*.html' . | grep -v 'demo-summary\|noscript' ; echo "exit=$?"
```

Jedyny dopuszczalny `hidden` w HTML: `#demo-summary` (podsumowanie demo — bez JS i tak nie ma czego podsumować, a noscript wyjaśnia). Oczekiwane: brak innych trafień.

- [ ] **Step 4: Sprzątnij serwery**

```bash
for port in 8321 4444; do pid=$(ss -ltnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1); [ -n "$pid" ] && kill "$pid"; done
ss -ltn | grep -E ':(8321|4444)' || echo "porty wolne"
```

- [ ] **Step 5: Commit poprawek (jeśli były) i raport**

```bash
git status --short   # czysto lub commit poprawek
git log --oneline -8
```

Raport dla Jakuba: co zrobione, wynik weryfikacji, przypomnienie że push = produkcja i wymaga jego zgody; po deployu ręczny test formularza kontaktowego i `curl -sI https://j-soft.me | grep -i content-security`.
