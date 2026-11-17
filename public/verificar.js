/* Sinalume: se o app não abrir (celular ou navegador muito antigo), mostra o que fazer em vez de uma tela branca.
   Escrito em JavaScript antigo de propósito, para rodar em qualquer navegador. */
(function () {
  function aviso(motivo) {
    var raiz = document.getElementById('root');
    if (!raiz || raiz.children.length > 0 || window.__sinalume) return;
    raiz.innerHTML =
      '<div style="font-family:system-ui,Arial,sans-serif;padding:24px;max-width:520px;margin:0 auto;color:#111827">' +
      '<h1 style="color:#1B3A8C;font-size:28px;margin:8px 0 12px">sinalume</h1>' +
      '<p style="font-size:18px;line-height:1.5">Não foi possível abrir o app neste navegador.</p>' +
      '<ol style="font-size:17px;line-height:1.6;padding-left:22px">' +
      '<li>Abra este endereço no <b>Chrome</b> (Android) ou no <b>Safari</b> (iPhone), e não dentro do WhatsApp ou do Instagram.</li>' +
      '<li>Atualize o Chrome pela Play Store, ou o iPhone em Ajustes &rsaquo; Geral &rsaquo; Atualização de Software.</li>' +
      '<li>Confira a internet e toque em recarregar.</li></ol>' +
      '<p style="font-size:15px;color:#4B5563">Endereço: <b>ktunda.github.io/sinalume</b></p>' +
      '<p style="font-size:12px;color:#9CA3AF">Código do problema: ' + motivo + '</p>' +
      '<button onclick="location.reload()" style="font-size:18px;padding:12px 20px;border-radius:12px;border:0;background:#1B3A8C;color:#fff">Recarregar</button>' +
      '</div>';
  }
  var erro = '';
  window.addEventListener('error', function (e) {
    if (!erro) erro = String((e && e.message) || 'erro').slice(0, 80);
  });
  // internet lenta: espera bastante; se o app começou a rodar, não interfere
  setTimeout(function () { aviso(erro || 'tempo esgotado'); }, 20000);
})();
