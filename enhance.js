/**
 * enhance.js — ชั้นปรับปรุง UX/การเข้าถึง (Accessibility) แบบ "เพิ่มเติมเท่านั้น"
 * โหลดเป็นสคริปต์ "ตัวสุดท้าย" ของทุกหน้า (ต่อจาก api.js / app.js / register.js / admin.js ฯลฯ)
 *
 * หลักการ:
 *  - ไม่เปลี่ยน id / name / class เดิม และไม่แก้ตรรกะธุรกิจใน JS เดิม
 *  - ไม่เปลี่ยนค่า err.message (โค้ดเดิมยังเทียบรหัสข้อผิดพลาดได้ตามปกติ) — แปลเป็นภาษาไทยเฉพาะตอน "แสดงผล"
 *  - ทุกส่วนครอบด้วย try/catch แยกกัน ถ้าส่วนใดพัง ส่วนอื่นและระบบเดิมยังทำงานต่อได้
 *  - ถ้าต้องการย้อนกลับ ให้ลบ <script src="enhance.js"> ออกได้ทันที
 */
(function () {
  'use strict';

  const run = (name, fn) => { try { fn(); } catch (e) { if (window.console) console.warn('[enhance] ' + name, e); } };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let uid = 0;
  const ensureId = el => el.id || (el.id = 'fx-' + (++uid));

  const ICONS = {
    info: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    close: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  // ======================================================================
  // 1) แปลรหัสข้อผิดพลาดจากเซิร์ฟเวอร์ (เช่น server_error) เป็นข้อความภาษาไทยที่ผู้ใช้เข้าใจ
  // ======================================================================
  const ERROR_TEXT = {
    unauthorized: 'เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
    session_expired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    account_disabled: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
    password_change_required: 'กรุณาเปลี่ยนรหัสผ่านชั่วคราวก่อนใช้งาน',
    forbidden_insufficient_role: 'บัญชีของท่านไม่มีสิทธิ์ทำรายการนี้',
    not_found: 'ไม่พบข้อมูลที่ต้องการ (อาจถูกลบหรือแก้ไขไปแล้ว)',
    server_error: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
    bad_request: 'คำขอไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่',
    unknown_action: 'ระบบหลังบ้านยังไม่รองรับคำสั่งนี้ (อาจยังไม่ได้ Deploy เวอร์ชันล่าสุด)',
    too_many_attempts: 'ลองผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    invalid_credentials: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
    missing_required_fields: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ',
    pdpa_consent_required: 'กรุณายืนยันความยินยอม PDPA ก่อนบันทึกข้อมูล',
    national_id_already_registered: 'เลขบัตรประชาชนนี้ลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบแทน',
    claim_requires_thaid: 'ระเบียนนี้ต้องยืนยันตัวตนผ่าน ThaiD',
    claim_verification_failed: 'เลขที่สมาชิก/เลขที่ใบอนุญาตไม่ตรงกับข้อมูลของสภาฯ',
    invalid_username: 'ชื่อผู้ใช้ต้องเป็น A-Z, 0-9, จุด, ขีด ความยาว 3–30 ตัว',
    display_name_required: 'กรุณากรอกชื่อที่แสดง',
    invalid_role: 'บทบาทไม่ถูกต้อง',
    invalid_email: 'รูปแบบอีเมลไม่ถูกต้อง',
    invalid_national_id: 'เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก และหลักสุดท้ายต้องตรงกับหลักตรวจสอบ)',
    username_taken: 'ชื่อผู้ใช้นี้มีอยู่แล้ว',
    national_id_taken: 'เลขบัตรประชาชนนี้ผูกกับบัญชีอื่นแล้ว',
    cannot_modify_self: 'ไม่สามารถแก้ไขค่านี้กับบัญชีของตนเองได้',
    invalid_status: 'สถานะไม่ถูกต้อง',
    last_superadmin: 'ต้องมี superadmin ที่ใช้งานได้อย่างน้อย 1 บัญชี',
    password_too_short: 'รหัสผ่านสั้นเกินไป',
    password_too_weak: 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข',
    password_same_as_old: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม',
    invalid_url: 'ลิงก์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)',
    invalid_file_type: 'รองรับเฉพาะไฟล์ PDF หรือ DOCX',
    empty_file: 'ไฟล์ว่างเปล่า',
    file_too_large: 'ไฟล์ใหญ่เกิน 5 MB',
    thaid_not_configured: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ ThaiD',
    mfa_invalid: 'รหัส OTP ไม่ถูกต้อง',
    otp_expired: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่',
    mfa_no_email: 'บัญชีนี้ยังไม่ได้ผูกอีเมลสำหรับรับ OTP',
    email_quota_exceeded: 'โควตาการส่งอีเมลของวันนี้หมดแล้ว กรุณาลองใหม่พรุ่งนี้',
    email_send_failed: 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง'
  };
  const NETWORK_RE = /^(Failed to fetch|NetworkError.*|Load failed|network error)$/i;

  // แปลเฉพาะ "รหัส" ที่อยู่ท้ายข้อความ เช่น "บันทึกไม่สำเร็จ: server_error"
  function humanizeMessage(msg) {
    const s = String(msg == null ? '' : msg);
    return s.replace(/(^|:\s*)([a-z][a-z0-9_]*)(:[A-Za-z0-9_.-]+)?\s*$/, (m, pre, code) => {
      if (ERROR_TEXT[code]) return pre + ERROR_TEXT[code];
      if (/^sheet_not_found/.test(code)) return pre + 'ฐานข้อมูลยังไม่ครบ (โปรดรัน setupDatabase อีกครั้ง)';
      return m;
    }).replace(/(^|:\s*)(Failed to fetch|NetworkError[^:]*|Load failed)\s*$/i, (m, pre) =>
      pre + 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  }
  window.humanizeError = humanizeMessage;

  // ======================================================================
  // 2) Toast: ประกาศให้โปรแกรมอ่านหน้าจอ, มีปุ่มปิด, ข้อความผิดพลาดค้างนานขึ้น, แปลรหัสผิดพลาด
  // ======================================================================
  run('toast', () => {
    if (typeof window.toast !== 'function') return;
    window.toast = function (msg, type) {
      let wrap = document.querySelector('.toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'toast-wrap';
        document.body.appendChild(wrap);
      }
      const isErr = type === 'error';
      const el = document.createElement('div');
      el.className = 'toast ' + (isErr ? 'err' : 'ok');
      el.setAttribute('role', isErr ? 'alert' : 'status');
      el.setAttribute('aria-live', isErr ? 'assertive' : 'polite');
      const text = document.createElement('span');
      text.textContent = humanizeMessage(msg);
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'toast-close'; close.setAttribute('aria-label', 'ปิดข้อความ');
      close.innerHTML = ICONS.close;
      close.addEventListener('click', () => el.remove());
      el.append(text, close);
      wrap.appendChild(el);
      setTimeout(() => el.remove(), isErr ? 8000 : 4000);
    };
  });

  // แปลรหัสผิดพลาดที่ JS เดิมเขียนลงกล่อง .alert / ตาราง ("โหลดไม่สำเร็จ: server_error")
  function humanizeIn(root) {
    if (!root || root.nodeType !== 1) return;
    const SEL = '.alert, td.text-soft, td[colspan]';
    const targets = root.matches && root.matches(SEL) ? [root] : [];
    $$(SEL, root).forEach(n => targets.push(n));
    targets.forEach(node => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = walker.nextNode())) {
        const v = t.nodeValue;
        if (!/[a-z]_[a-z]|Failed to fetch|NetworkError|Load failed/.test(v)) continue;
        const nv = humanizeMessage(v);
        if (nv !== v) t.nodeValue = nv;
      }
    });
  }
  run('alertHumanize', () => {
    // กล่องแจ้งเตือนเป็น live region เพื่อให้โปรแกรมอ่านหน้าจออ่านข้อความผิดพลาดทันที
    $$('[id$="Alert"]').forEach(el => { if (!el.hasAttribute('aria-live')) el.setAttribute('aria-live', 'polite'); });
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1) humanizeIn(n);
      else if (n.nodeType === 3 && n.parentElement && n.parentElement.closest('.alert')) humanizeIn(n.parentElement.closest('.alert'));
    }))).observe(document.body, { childList: true, subtree: true });
  });

  // ======================================================================
  // 3) ผูก <label> กับช่องกรอก (เดิม 182 ป้ายไม่ได้ผูก — คลิกป้ายแล้วไม่โฟกัส และโปรแกรมอ่านหน้าจออ่านชื่อช่องไม่ได้)
  // ======================================================================
  function linkLabels(root) {
    $$('.field', root).forEach(field => {
      $$(':scope > label:not([for])', field).forEach(label => {
        if (label.querySelector('input, select, textarea')) return; // ป้ายที่ห่อช่องไว้แล้ว ใช้ได้อยู่แล้ว
        let ctl = label.nextElementSibling;
        while (ctl && !ctl.matches('input:not([type=hidden]), select, textarea')) {
          const inner = ctl.querySelector && ctl.querySelector('input:not([type=hidden]), select, textarea');
          if (inner) { ctl = inner; break; }
          ctl = ctl.nextElementSibling;
        }
        if (!ctl) return;
        label.htmlFor = ensureId(ctl);
        // ป้ายที่มี * = ช่องบังคับ → แจ้งโปรแกรมอ่านหน้าจอด้วย
        if (/\*/.test(label.textContent) && !ctl.required) ctl.setAttribute('aria-required', 'true');
        const hint = field.querySelector('.hint');
        if (hint && !ctl.hasAttribute('aria-describedby')) ctl.setAttribute('aria-describedby', ensureId(hint));
      });
    });
    // ช่องที่ยังไม่มีชื่อ (เช่น ช่อง "อื่นๆ โปรดระบุ", ช่องค้นหา/กรองในตาราง) → ใช้ placeholder หรือป้ายของช่องเลือกที่อยู่ก่อนหน้า
    $$('input:not([type=hidden]), select, textarea', root).forEach(c => {
      if ((c.labels && c.labels.length) || c.hasAttribute('aria-label') || c.hasAttribute('aria-labelledby')) return;
      let name = c.getAttribute('placeholder') || c.getAttribute('title') || '';
      if (!name) {
        let prev = c.previousElementSibling;
        while (prev && !prev.matches('select, input')) prev = prev.previousElementSibling;
        if (prev && prev.labels && prev.labels.length) name = prev.labels[0].textContent.replace(/\*/g, '').trim() + ' (โปรดระบุ)';
      }
      if (!name && c.type === 'file') name = 'เลือกไฟล์';
      if (!name && c.tagName === 'SELECT' && c.options.length) name = c.options[0].textContent.trim();
      if (name) c.setAttribute('aria-label', name);
    });
  }
  run('labels', () => {
    linkLabels(document);
    // ฟอร์มที่สร้างภายหลัง (เช่น แถววุฒิการศึกษา/ประวัติการทำงานที่กด "เพิ่ม")
    let pending = false;
    new MutationObserver(() => {
      if (pending) return; pending = true;
      requestAnimationFrame(() => { pending = false; run('labels-late', () => linkLabels(document)); });
    }).observe(document.body, { childList: true, subtree: true });
  });

  // ======================================================================
  // 4) คุณสมบัติช่องกรอก: autocomplete / inputmode / enterkeyhint (ช่วยมือถือและตัวจัดการรหัสผ่าน)
  // ======================================================================
  run('inputAttrs', () => {
    const set = (sel, attrs) => $$(sel).forEach(el => Object.keys(attrs).forEach(k => { if (!el.hasAttribute(k)) el.setAttribute(k, attrs[k]); }));
    set('#loginNationalId', { inputmode: 'numeric', autocomplete: 'username', pattern: '\\d{13}', title: 'เลขบัตรประชาชน 13 หลัก (ตัวเลขเท่านั้น)' });
    set('#loginPassword', { autocomplete: 'current-password', enterkeyhint: 'go' });
    set('#adminUsername', { autocomplete: 'username', autocapitalize: 'off', spellcheck: 'false' });
    set('#adminPassword', { autocomplete: 'current-password', enterkeyhint: 'go' });
    set('input[name="NationalID"]', { inputmode: 'numeric', autocomplete: 'off' });
    set('#regNationalId', { pattern: '\\d{13}', title: 'เลขบัตรประชาชน 13 หลัก (ตัวเลขเท่านั้น)' });
    set('#regPassword, #regPassword2', { autocomplete: 'new-password' });
    set('input[type=tel]', { inputmode: 'tel', autocomplete: 'tel' });
    set('input[type=email]', { autocomplete: 'email', autocapitalize: 'off', spellcheck: 'false' });
    set('input[name="FirstName"]', { autocomplete: 'given-name' });
    set('input[name="LastName"]', { autocomplete: 'family-name' });
    set('.addr-zipcode', { inputmode: 'numeric' });
    set('#searchInput', { type: 'search', 'aria-label': 'ค้นหาผู้ปฏิบัติงานด้วยชื่อ-นามสกุล เลขที่ใบอนุญาต หรือเลขที่สมาชิก', enterkeyhint: 'search', autocomplete: 'off' });
    const si = $('#searchInput'); if (si && si.type !== 'search') si.type = 'search';
  });

  // ======================================================================
  // 5) กด Enter เพื่อเข้าสู่ระบบ (เดิมต้องคลิกปุ่มเท่านั้น)
  // ======================================================================
  run('enterSubmit', () => {
    const bind = (inputs, btnSel) => inputs.forEach(sel => {
      const el = $(sel); const btn = $(btnSel);
      if (!el || !btn) return;
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing && !btn.disabled && btn.offsetParent !== null) { e.preventDefault(); btn.click(); }
      });
    });
    bind(['#loginNationalId', '#loginPassword'], '#loginBtn');
    bind(['#adminUsername', '#adminPassword'], '#adminLoginBtn');
    bind(['#cpConfirm'], '#cpSubmitBtn');
  });

  // ======================================================================
  // 6) Skip link + จุดเริ่มเนื้อหาหลัก
  // ======================================================================
  run('skipLink', () => {
    const main = $('.admin-main') || $('main');
    if (!main) return;
    if (!main.id) main.id = 'mainContent';
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    const a = document.createElement('a');
    a.className = 'skip-link'; a.href = '#' + main.id; a.textContent = 'ข้ามไปยังเนื้อหาหลัก';
    document.body.insertBefore(a, document.body.firstChild);
    const nav = $('nav.main-nav');
    if (nav && !nav.hasAttribute('aria-label')) nav.setAttribute('aria-label', 'เมนูหลัก');
    const cur = nav && nav.querySelector('a.active');
    if (cur) cur.setAttribute('aria-current', 'page');
  });

  // ======================================================================
  // 7) หน้าแรก: สถานะกำลังค้นหา + ประกาศจำนวนผลลัพธ์ + โครงร่าง KPI ระหว่างโหลด
  // ======================================================================
  run('search', () => {
    const btn = $('#searchBtn');
    // Api ประกาศด้วย const ใน api.js จึงไม่อยู่บน window — อ้างชื่อตรง ๆ ได้
    if (!btn || typeof Api === 'undefined' || typeof Api.search !== 'function') return;
    const count = $('#searchResultCount');
    if (count) { count.setAttribute('role', 'status'); count.setAttribute('aria-live', 'polite'); }
    const label = btn.textContent;
    const orig = Api.search;
    Api.search = async function () {
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> กำลังค้นหา';
      try { return await orig.apply(this, arguments); }
      finally { btn.removeAttribute('aria-busy'); btn.textContent = label; }
    };
  });
  run('kpiSkeleton', () => {
    $$('.kpi .num').forEach(n => {
      if (n.textContent.trim() !== '-') return;
      n.classList.add('is-loading'); n.setAttribute('aria-busy', 'true');
      const done = () => { n.classList.remove('is-loading'); n.removeAttribute('aria-busy'); };
      new MutationObserver((_, obs) => { if (n.textContent.trim() !== '-') { done(); obs.disconnect(); } })
        .observe(n, { childList: true, characterData: true, subtree: true });
      setTimeout(done, 15000); // กันโครงร่างค้างถ้าโหลดไม่สำเร็จ
    });
  });

  // ======================================================================
  // 8) แผนที่: คำอธิบายสำหรับโปรแกรมอ่านหน้าจอ + ตารางรายจังหวัดที่ใช้คีย์บอร์ดได้
  // ======================================================================
  run('mapAlt', () => {
    if (typeof window.renderThailandMap !== 'function') return;
    const orig = window.renderThailandMap;
    window.renderThailandMap = async function (containerId, dataByProvince, opts) {
      const r = await orig.apply(this, arguments);
      run('mapAlt-render', () => {
        const box = document.getElementById(containerId);
        if (!box) return;
        const entries = Object.entries(dataByProvince || {}).filter(([k]) => k).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((s, [, n]) => s + Number(n || 0), 0);
        const svg = box.querySelector('svg');
        if (svg) {
          svg.setAttribute('role', 'img');
          svg.setAttribute('aria-label', `แผนที่ความหนาแน่นผู้ปฏิบัติงานรายจังหวัด รวม ${total.toLocaleString('th-TH')} คน ใน ${entries.length} จังหวัด — ดูตัวเลขรายจังหวัดได้จากตารางใต้แผนที่`);
        }
        const old = box.parentNode && box.parentNode.querySelector(`.map-table-alt[data-for="${containerId}"]`);
        if (old) old.remove();
        if (!entries.length) return;
        const click = opts && opts.onProvinceClick;
        const det = document.createElement('details');
        det.className = 'map-table-alt'; det.dataset.for = containerId;
        det.innerHTML = `<summary>ดูข้อมูลเป็นตาราง (${entries.length} จังหวัด)</summary>
          <div class="table-scroll"><table class="data-table"><caption class="sr-only">จำนวนผู้ปฏิบัติงานรายจังหวัด</caption>
          <thead><tr><th scope="col">จังหวัด</th><th scope="col">จำนวน (คน)</th></tr></thead>
          <tbody>${entries.map(([p, n]) => `<tr><td>${click ? `<button type="button" class="btn-link" data-prov="${escapeHtml(p)}">${escapeHtml(p)}</button>` : escapeHtml(p)}</td><td>${Number(n).toLocaleString('th-TH')}</td></tr>`).join('')}</tbody></table></div>`;
        if (click) det.addEventListener('click', e => {
          const b = e.target.closest('[data-prov]'); if (!b) return;
          click(b.dataset.prov, dataByProvince[b.dataset.prov] || 0);
        });
        box.insertAdjacentElement('afterend', det);
      });
      return r;
    };
  });

  // ======================================================================
  // 9) หน้าผู้ปฏิบัติงาน: modal PDPA คืนโฟกัส, wizard ย้ายโฟกัสไปหัวข้อขั้นตอน, ช่องผิดถูกทำเครื่องหมาย
  // ======================================================================
  run('pdpaModal', () => {
    if (typeof window.openPdpaModal !== 'function') return;
    let opener = null;
    const o = window.openPdpaModal, c = window.closePdpaModal;
    window.openPdpaModal = function () {
      opener = document.activeElement;
      o.apply(this, arguments);
      const btn = $('#pdpaModal .modal-close-btn'); if (btn) btn.focus();
    };
    window.closePdpaModal = function () {
      c.apply(this, arguments);
      if (opener && opener.focus) opener.focus();
      opener = null;
    };
    // คุมโฟกัสให้อยู่ใน modal ขณะเปิด
    document.addEventListener('keydown', e => {
      const m = $('#pdpaModal');
      if (e.key !== 'Tab' || !m || m.hidden) return;
      const f = $$('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', m).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });

  run('wizardA11y', () => {
    const form = $('#registerForm'), list = $('#wizSteps');
    if (!form || !list) return;
    let userNav = false;
    form.addEventListener('click', e => { if (e.target.closest('[data-go]')) userNav = true; }, true);
    list.addEventListener('click', e => { if (e.target.closest('[data-jump]')) userNav = true; }, true);
    list.setAttribute('aria-label', 'ขั้นตอนการลงทะเบียน');
    const sync = () => {
      $$('li', list).forEach(li => {
        const b = li.querySelector('button');
        if (b) { if (li.classList.contains('active')) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }
      });
      if (!userNav) return;
      userNav = false;
      const h = form.querySelector('.wiz-step.active .wiz-title');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    };
    new MutationObserver(sync).observe(list, { childList: true });
    sync();
  });

  run('invalidMarks', () => {
    document.addEventListener('invalid', e => {
      const el = e.target; if (!el || !el.setAttribute) return;
      el.setAttribute('aria-invalid', 'true');
    }, true);
    const clear = e => { const el = e.target; if (el && el.getAttribute && el.getAttribute('aria-invalid') === 'true' && el.checkValidity && el.checkValidity()) el.removeAttribute('aria-invalid'); };
    document.addEventListener('input', clear, true);
    document.addEventListener('change', clear, true);
  });

  // ======================================================================
  // 10) หลังบ้าน: ลิงก์ตรงไปแต่ละแท็บ (#tabPeople), aria-current, ปิดเมนูมือถือหลังเลือก/กด Esc
  // ======================================================================
  run('adminNav', () => {
    const app = $('#adminAppView');
    const tabs = $$('.sb-nav .tab-btn');
    if (!app || !tabs.length) return;
    const nav = $('.sb-nav'); if (nav) nav.setAttribute('aria-label', 'เมนูผู้ดูแลระบบ');
    const toggle = $('.admin-topbar button');
    const setExpanded = () => { if (toggle) toggle.setAttribute('aria-expanded', document.body.classList.contains('nav-open') ? 'true' : 'false'); };
    if (toggle) { toggle.setAttribute('aria-controls', ensureId($('.admin-sidebar') || app)); setExpanded(); toggle.addEventListener('click', () => setTimeout(setExpanded)); }

    const syncCurrent = () => tabs.forEach(b => { if (b.classList.contains('active')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    tabs.forEach(b => {
      b.type = 'button';
      new MutationObserver(syncCurrent).observe(b, { attributes: true, attributeFilter: ['class'] });
      b.addEventListener('click', () => {
        if (history.replaceState && b.dataset.tab) history.replaceState(null, '', '#' + b.dataset.tab);
        if (document.body.classList.contains('nav-open')) { document.body.classList.remove('nav-open'); setExpanded(); }
        const h = document.getElementById(b.dataset.tab) && document.getElementById(b.dataset.tab).querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        window.scrollTo(0, 0);
      });
    });
    syncCurrent();

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { document.body.classList.remove('nav-open'); setExpanded(); if (toggle) toggle.focus(); }
    });

    // เปิดแท็บตาม #hash หลังเข้าสู่ระบบ (เฉพาะแท็บที่บัญชีนี้มีสิทธิ์และมองเห็นอยู่)
    const restore = () => {
      const id = (location.hash || '').slice(1);
      if (!id) return;
      const b = tabs.find(x => x.dataset.tab === id);
      if (b && b.style.display !== 'none' && !b.classList.contains('active')) b.click();
    };
    let shown = app.style.display !== 'none';
    new MutationObserver(() => {
      const now = app.style.display !== 'none';
      if (now && !shown) setTimeout(restore, 120);
      shown = now;
    }).observe(app, { attributes: true, attributeFilter: ['style'] });
    if (shown) setTimeout(restore, 120);
  });

  // ======================================================================
  // 11) ตารางข้อมูล: หัวตารางมี scope ให้โปรแกรมอ่านหน้าจออ่านคู่กับเซลล์ได้
  // ======================================================================
  run('tableScope', () => {
    const fix = () => $$('table.data-table thead th:not([scope])').forEach(th => th.setAttribute('scope', 'col'));
    fix();
    let p = false;
    new MutationObserver(() => { if (p) return; p = true; requestAnimationFrame(() => { p = false; fix(); }); })
      .observe(document.body, { childList: true, subtree: true });
  });

  // ======================================================================
  // 12) ลิงก์ที่เปิดแท็บใหม่ บอกผู้ใช้ล่วงหน้า
  // ======================================================================
  run('newTabLinks', () => {
    const mark = a => {
      if (a.dataset.fxNewtab) return; a.dataset.fxNewtab = '1';
      if (!a.querySelector('.sr-only')) a.insertAdjacentHTML('beforeend', '<span class="sr-only"> (เปิดในแท็บใหม่)</span>');
      if (!/noopener/.test(a.rel || '')) a.rel = ((a.rel || '') + ' noopener').trim();
    };
    $$('a[target="_blank"]').forEach(mark);
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches('a[target="_blank"]')) mark(n);
      $$('a[target="_blank"]', n).forEach(mark);
    }))).observe(document.body, { childList: true, subtree: true });
  });

  // ======================================================================
  // 13) เมนูหลักบนมือถือ: ปุ่มเปิด/ปิด (hamburger)
  // ======================================================================
  run('mobileNav', () => {
    const btn = $('.nav-toggle'), nav = $('#mainNav');
    if (!btn || !nav) return;
    const set = open => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
    };
    btn.addEventListener('click', () => set(!nav.classList.contains('is-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); } });
    document.addEventListener('click', e => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  });

  // ======================================================================
  // 14) ข้อความแจ้งช่องที่กรอกไม่ถูกต้อง "ใต้ช่อง" เป็นภาษาไทย (แทน bubble ของเบราว์เซอร์ที่หายเร็ว)
  // ======================================================================
  function thaiValidationMessage(el) {
    const v = el.validity;
    if (v.valueMissing) return el.type === 'checkbox' ? 'กรุณาทำเครื่องหมายในช่องนี้' : el.tagName === 'SELECT' ? 'กรุณาเลือกรายการ' : 'กรุณากรอกข้อมูลในช่องนี้';
    if (v.typeMismatch && el.type === 'email') return 'รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com';
    if (v.patternMismatch) return el.title || 'รูปแบบข้อมูลไม่ถูกต้อง';
    if (v.tooShort) return `ต้องมีอย่างน้อย ${el.minLength} ตัวอักษร (ตอนนี้ ${el.value.length})`;
    if (v.tooLong) return `ยาวได้ไม่เกิน ${el.maxLength} ตัวอักษร`;
    if (v.rangeUnderflow || v.rangeOverflow) return 'ค่าที่กรอกอยู่นอกช่วงที่กำหนด';
    return el.validationMessage || 'ข้อมูลไม่ถูกต้อง';
  }
  function errorAnchor(el) {
    const wrap = el.closest('.pw-wrap') || (el.type === 'checkbox' && el.closest('label')) || el;
    return wrap;
  }
  function showFieldError(el) {
    const anchor = errorAnchor(el);
    let msg = el._fxErr;
    if (!msg || !msg.isConnected) {
      msg = document.createElement('div');
      msg.className = 'field-error';
      msg.id = 'fx-err-' + ensureId(el);
      anchor.insertAdjacentElement('afterend', msg);
      el._fxErr = msg;
      const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (d.indexOf(msg.id) === -1) el.setAttribute('aria-describedby', d.concat(msg.id).join(' '));
    }
    msg.innerHTML = ICONS.info + '<span></span>';
    msg.lastChild.textContent = thaiValidationMessage(el);
    el.setAttribute('aria-invalid', 'true');
  }
  function clearFieldError(el) {
    if (el._fxErr) { el._fxErr.remove(); el._fxErr = null; }
    el.removeAttribute('aria-invalid');
  }
  run('inlineErrors', () => {
    let focusQueued = false;
    document.addEventListener('invalid', e => {
      const el = e.target;
      if (!el || !el.validity || el.id === 'adminOtpInput') return;
      e.preventDefault(); // ไม่แสดง bubble ของเบราว์เซอร์ — แสดงข้อความใต้ช่องแทน
      showFieldError(el);
      if (!focusQueued) {
        focusQueued = true;
        setTimeout(() => { // รอให้ wizard สลับไปขั้นที่มีช่องผิดก่อน แล้วค่อยโฟกัส
          focusQueued = false;
          if (el.offsetParent !== null) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        }, 30);
      }
    }, true);
    const recheck = e => { const el = e.target; if (el && el._fxErr && el.checkValidity && el.validity.valid) clearFieldError(el); };
    document.addEventListener('input', recheck, true);
    document.addEventListener('change', recheck, true);
  });

  // ======================================================================
  // 15) ตรวจเลขบัตรประชาชนด้วยหลักตรวจสอบ (หลักที่ 13) ขณะกรอก
  //     - หน้าลงทะเบียน: ห้ามไปขั้นถัดไป/ส่งฟอร์มถ้าไม่ผ่าน
  //     - หลังบ้าน (ฟอร์มข้อมูลผู้ปฏิบัติงาน): เตือนอย่างเดียว ไม่บล็อก (ข้อมูลเก่าของสภาฯ บางรายการอาจพิมพ์ผิดมาแต่ต้น)
  // ======================================================================
  run('idChecksum', () => {
    if (typeof isValidThaiId !== 'function') return;
    const reg = $('#regNationalId');
    if (reg) {
      const check = () => {
        const v = reg.value.trim();
        reg.setCustomValidity(/^\d{13}$/.test(v) && !isValidThaiId(v) ? 'เลขบัตรประชาชนไม่ถูกต้อง (หลักสุดท้ายไม่ตรงกับหลักตรวจสอบ) กรุณาตรวจสอบอีกครั้ง' : '');
        if (reg._fxErr) { if (reg.validity.valid) clearFieldError(reg); else showFieldError(reg); }
      };
      reg.addEventListener('input', check);
      reg.addEventListener('blur', () => { check(); if (reg.value && !reg.validity.valid) showFieldError(reg); });
      // ค่าที่ถูกเติมอัตโนมัติ (ดึงข้อมูลจากสภาฯ / ThaiD) ก็ต้องถูกตรวจด้วย
      const form = reg.form; if (form) form.addEventListener('submit', check, true);
      document.addEventListener('click', e => { if (e.target.closest('[data-go]')) check(); }, true);
    }
    $$('input[name="NationalID"]').filter(el => el !== reg).forEach(el => {
      const warn = () => {
        let w = el._fxWarn;
        const v = el.value.trim();
        const bad = v && (!/^\d{13}$/.test(v) || !isValidThaiId(v));
        if (bad && !w) { w = el._fxWarn = document.createElement('div'); w.className = 'field-warn'; w.setAttribute('role', 'status'); el.insertAdjacentElement('afterend', w); }
        if (w) w.textContent = bad ? 'โปรดตรวจสอบ: เลขบัตรประชาชนนี้ไม่ผ่านการตรวจหลักตรวจสอบ (ยังบันทึกได้ตามปกติ)' : '';
      };
      el.addEventListener('input', warn); el.addEventListener('change', warn);
    });
  });

  // ======================================================================
  // 16) ปุ่มแสดง/ซ่อนรหัสผ่าน
  // ======================================================================
  const EYE = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 4.1-5M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 0 1-4.2-4.2M2 2l20 20"/></svg>';
  function addPwToggles(root) {
    $$('input[type=password]:not([data-fx-pw])', root).forEach(inp => {
      inp.dataset.fxPw = '1';
      const wrap = document.createElement('span');
      wrap.className = 'pw-wrap';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pw-toggle'; b.innerHTML = EYE;
      b.setAttribute('aria-label', 'แสดงรหัสผ่าน'); b.setAttribute('aria-pressed', 'false');
      if (inp.id) b.setAttribute('aria-controls', inp.id);
      b.addEventListener('click', () => {
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        b.innerHTML = show ? EYE_OFF : EYE;
        b.setAttribute('aria-label', show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
        b.setAttribute('aria-pressed', show ? 'true' : 'false');
        inp.focus();
      });
      wrap.appendChild(b);
      // ซ่อนรหัสผ่านกลับเมื่อส่งฟอร์ม/ออกจากหน้า กันรหัสถูกบันทึกเป็นข้อความธรรมดา
      const hide = () => { if (inp.type === 'text') b.click(); };
      if (inp.form) inp.form.addEventListener('submit', hide, true);
      window.addEventListener('pagehide', hide);
    });
  }
  run('pwToggle', () => addPwToggles(document));

  // ======================================================================
  // 17) บันทึกร่างฟอร์มลงทะเบียนอัตโนมัติ (sessionStorage — ข้อมูลหายเองเมื่อปิดแท็บ)
  //     ไม่เก็บรหัสผ่าน และไม่เก็บการกดยินยอม PDPA (ต้องกดเองทุกครั้ง)
  // ======================================================================
  run('registerDraft', () => {
    const form = $('#registerForm');
    if (!form || !window.sessionStorage) return;
    const KEY = 'swdb_register_draft_v1';
    const skip = el => !el.name && !el.id || el.type === 'password' || el.type === 'file' || el.type === 'hidden' ||
      el.id === 'registerPdpaConsent' || el.closest('[id$="Rows"]');
    const fields = () => {
      const seen = {}, out = [];
      $$('input, select, textarea', form).forEach(el => {
        if (skip(el)) return;
        const k = el.id ? '#' + el.id : 'n:' + el.name;
        seen[k] = (seen[k] || 0) + 1;
        out.push([k, el]);
      });
      return out.filter(([k]) => seen[k] === 1);
    };
    const save = () => {
      try {
        const data = {};
        fields().forEach(([k, el]) => {
          const v = el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? '1' : '') : el.value;
          if (v) data[k] = v;
        });
        if (Object.keys(data).length) sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data }));
        else sessionStorage.removeItem(KEY);
      } catch (e) {}
    };
    let t = null;
    const queue = () => { clearTimeout(t); t = setTimeout(save, 500); };
    form.addEventListener('input', queue);
    form.addEventListener('change', queue);
    form.addEventListener('reset', () => { clearTimeout(t); try { sessionStorage.removeItem(KEY); } catch (e) {} const n = $('#fxDraftNote'); if (n) n.remove(); });

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!saved || !saved.data) return;
    let restored = 0;
    fields().forEach(([k, el]) => {
      if (!(k in saved.data)) return;
      const v = saved.data[k];
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = v === '1';
      else el.value = v;
      if (el.type === 'checkbox' || el.type === 'radio' || el.value === v) restored++;
      el.dispatchEvent(new Event('change', { bubbles: true })); // ให้ dropdown ที่อยู่/ช่อง "อื่นๆ" ทำงานต่อเนื่องตามลำดับ
    });
    if (!restored) return;
    const note = document.createElement('div');
    note.id = 'fxDraftNote';
    note.className = 'alert alert-info draft-note';
    note.innerHTML = '<span>กู้คืนข้อมูลที่ท่านกรอกค้างไว้ในแท็บนี้แล้ว (ไม่รวมรหัสผ่าน วุฒิการศึกษา/ประวัติการทำงานแบบหลายรายการ และการกดยินยอม PDPA)</span><button type="button" class="btn btn-ghost btn-sm">ล้างข้อมูลที่กรอก</button>';
    note.querySelector('button').addEventListener('click', async () => {
      const ok = typeof confirmDialog === 'function'
        ? await confirmDialog('ล้างข้อมูลทั้งหมดที่กรอกไว้ในฟอร์มลงทะเบียนหรือไม่?', { title: 'ล้างข้อมูลที่กรอก', okText: 'ล้างข้อมูล', danger: true })
        : window.confirm('ล้างข้อมูลทั้งหมดที่กรอกไว้หรือไม่?');
      if (ok) { form.reset(); if (typeof window.wizardReset === 'function') window.wizardReset(); }
    });
    form.parentNode.insertBefore(note, form);
  });
})();
