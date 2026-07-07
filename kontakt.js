/* Formularz kontaktowy (EmailJS). Logika przeniesiona z inline <script> dla scislego CSP. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  if (typeof emailjs !== 'undefined') {
    emailjs.init('ZOBwl7GMNRPwk_VRu');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('submit-btn');
    if (typeof emailjs === 'undefined') {
      btn.textContent = 'Moduł wysyłki nie działa — napisz na jakubdrapala@gmail.com';
      return;
    }
    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;
    emailjs.sendForm('service_3ae2jx4', 'template_tkwp64l', form)
      .then(function () {
        btn.textContent = 'Wysłano! ✓';
      }, function (error) {
        btn.textContent = 'Błąd — spróbuj ponownie';
        btn.disabled = false;
        console.error('EmailJS error:', error);
      });
  });
})();
