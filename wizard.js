// ตัวช่วยแบ่งฟอร์มลงทะเบียนเป็นขั้นตอน (wizard) — ไม่เปลี่ยน id/ชื่อฟิลด์เดิม จึงไม่กระทบ register.js
(function () {
  const form = document.getElementById('registerForm');
  const list = document.getElementById('wizSteps');
  const prog = document.getElementById('wizProgress');
  if (!form || !list) return;

  const kids = Array.from(form.children);
  const steps = [];
  let cur = null;
  kids.forEach(el => {
    if (el.tagName === 'H3') {
      cur = { h: el, els: [el] };
      steps.push(cur);
    } else if (cur) cur.els.push(el);
    else { (steps._pre = steps._pre || []).push(el); }
  });
  if (!steps.length) return;

  const titleOf = h => {
    const c = h.cloneNode(true);
    c.querySelectorAll('button').forEach(b => b.remove());
    return c.textContent.replace(/^\s*\d+\.\s*/, '').trim();
  };

  const wrappers = steps.map((st, i) => {
    const w = document.createElement('section');
    w.className = 'wiz-step';
    w.dataset.step = i;
    if (i === 0 && steps._pre) steps._pre.forEach(e => w.appendChild(e));
    const kick = document.createElement('div');
    kick.className = 'wiz-kicker';
    kick.textContent = 'ขั้นตอนที่ ' + (i + 1) + ' จาก ' + steps.length;
    w.appendChild(kick);
    st.h.classList.remove('mt-24');
    st.h.classList.add('wiz-title');
    const first = st.h;
    form.insertBefore(w, first);
    w.appendChild(first);
    // เนื้อหาถัดจาก h3 ย้ายเข้า wrapper
    st.els.slice(1).forEach(e => w.appendChild(e));
    st.title = titleOf(st.h);
    return w;
  });

  // ปุ่มนำทาง
  wrappers.forEach((w, i) => {
    if (i < wrappers.length - 1) {
      const nav = document.createElement('div');
      nav.className = 'wiz-nav';
      nav.innerHTML = (i > 0 ? '<button type="button" class="btn btn-ghost" data-go="-1">← ย้อนกลับ</button>' : '<button type="button" class="btn btn-ghost" onclick="showView(\'gateView\')">ยกเลิก</button>') +
        '<button type="button" class="btn btn-primary" data-go="1">ถัดไป →</button>';
      w.appendChild(nav);
    } else {
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'btn btn-ghost'; back.dataset.go = '-1'; back.textContent = '← ย้อนกลับ';
      const row = w.querySelector('.flex.gap-12');
      if (row) row.insertBefore(back, row.firstChild);
    }
  });

  let idx = 0, maxDone = 0;
  function render() {
    wrappers.forEach((w, i) => w.classList.toggle('active', i === idx));
    list.innerHTML = steps.map((st, i) =>
      `<li class="${i === idx ? 'active' : ''} ${i < maxDone || i < idx ? 'done' : ''}"><button type="button" data-jump="${i}"><span class="dot">${i < idx ? '✓' : i + 1}</span><span>${st.title}</span></button></li>`
    ).join('');
    prog.innerHTML = steps.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('');
  }
  function validCurrent() {
    const fields = wrappers[idx].querySelectorAll('input, select, textarea');
    for (const f of fields) {
      if (f.offsetParent === null && f.type !== 'hidden') continue;
      if (!f.checkValidity()) { f.reportValidity(); return false; }
    }
    return true;
  }
  function go(n) {
    if (n > idx && !validCurrent()) return;
    idx = Math.max(0, Math.min(steps.length - 1, n));
    maxDone = Math.max(maxDone, idx);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (b) go(idx + Number(b.dataset.go));
  });
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-jump]');
    if (!b) return;
    const t = Number(b.dataset.jump);
    if (t <= maxDone || t === idx + 1) go(t);
  });
  // ถ้า submit ไม่ผ่านการตรวจใน browser ให้เด้งไปขั้นที่มีช่องผิด
  form.addEventListener('invalid', e => {
    const w = e.target.closest('.wiz-step');
    if (w) { idx = Number(w.dataset.step); render(); }
  }, true);
  window.wizardReset = () => { idx = 0; maxDone = 0; render(); };
  render();
})();
