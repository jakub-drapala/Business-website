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
