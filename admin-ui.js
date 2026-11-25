// ส่วนเสริม UI หลังบ้าน: ช่อง OTP 6 ช่อง + ตัวกรอง Audit Log (ไม่แตะตรรกะเดิมใน admin.js)
(function () {
  // ---- OTP 6 ช่อง: ช่องจริง #adminOtpInput ยังเป็นแหล่งค่าเดียว ----
  const real = document.getElementById('adminOtpInput');
  if (real) {
    const field = real.closest('.field');
    real.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';
    const box = document.createElement('div');
    box.className = 'otp-boxes';
    box.innerHTML = Array.from({ length: 6 }, () => '<input type="text" inputmode="numeric" maxlength="1" autocomplete="off" aria-label="หลัก OTP">').join('');
    field.appendChild(box);
    const cells = Array.from(box.querySelectorAll('input'));
    const sync = () => { real.value = cells.map(c => c.value).join(''); };
    const reset = () => { cells.forEach(c => c.value = ''); real.value = ''; cells[0].focus(); };
    real.addEventListener('focus', reset);           // admin.js เรียก focus() หลังเคลียร์ค่า
    cells.forEach((c, i) => {
      c.addEventListener('input', () => {
        c.value = c.value.replace(/\D/g, '').slice(-1);
        sync();
        if (c.value && i < 5) cells[i + 1].focus();
        if (real.value.length === 6) document.getElementById('adminVerifyOtpBtn').click();
      });
      c.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !c.value && i > 0) { cells[i - 1].focus(); cells[i - 1].value = ''; sync(); }
        if (e.key === 'Enter') document.getElementById('adminVerifyOtpBtn').click();
      });
      c.addEventListener('paste', e => {
        const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (!t) return;
        e.preventDefault();
        cells.forEach((x, k) => x.value = t[k] || '');
        sync(); cells[Math.min(t.length, 5)].focus();
      });
    });
  }

  // ---- Audit: กรองแถวในตารางที่ admin.js วาดไว้ ----
  const body = document.getElementById('auditTableBody');
  const search = document.getElementById('auditSearch');
  const chips = document.getElementById('auditChips');
  if (body && search && chips) {
    let pattern = '';
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      const re = pattern ? new RegExp(pattern, 'i') : null;
      body.querySelectorAll('tr').forEach(tr => {
        if (tr.children.length < 5) return;
        const t = tr.textContent.toLowerCase();
        tr.style.display = (!q || t.includes(q)) && (!re || re.test(tr.children[2].textContent)) ? '' : 'none';
      });
    };
    search.addEventListener('input', apply);
    chips.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      pattern = b.dataset.f; apply();
    });
    new MutationObserver(apply).observe(body, { childList: true });
  }
})();
