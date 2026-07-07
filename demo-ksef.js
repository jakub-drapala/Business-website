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
