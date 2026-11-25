// แสดงปุ่ม "คู่มือการใช้งาน" บนหน้าสาธารณะ เมื่อผู้ดูแลระบบกำหนดลิงก์/ไฟล์คู่มือไว้ (ซ่อนเองเมื่อยังไม่ได้ตั้งค่า)
(function () {
  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ''; }
  Api.publicConfig().then(function (cfg) {
    var url = cfg && safeUrl(cfg.manualUrl);
    if (!url) return;
    var label = (cfg.manualTitle && cfg.manualTitle.trim()) || 'คู่มือการใช้งาน';
    var nav = document.querySelector('.main-nav');
    if (nav) {
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'คู่มือการใช้งาน'; a.id = 'manualNavLink';
      nav.appendChild(a);
    }
    document.querySelectorAll('[data-manual-slot]').forEach(function (slot) {
      var b = document.createElement('a');
      b.href = url; b.target = '_blank'; b.rel = 'noopener'; b.className = 'btn btn-outline'; b.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/></svg> '; b.appendChild(document.createTextNode(label));
      slot.appendChild(b); slot.style.display = '';
    });
  }).catch(function () {});
})();
