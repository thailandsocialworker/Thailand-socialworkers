// ส่วนแสดงผลข้อมูลสมาชิกภาพ/ใบอนุญาต และรูปประจำตัว (ใช้ร่วมกันหน้าแรก หน้าผู้ปฏิบัติงาน และหลังบ้าน)
// ต้องโหลดหลัง api.js (ใช้ escapeHtml / fmtDate)
(function () {
  const E = s => escapeHtml(s == null ? '' : String(s));
  const DAY = 86400000;

  function toDate(v) {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function daysUntil(v) {
    const d = toDate(v);
    if (!d) return null;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / DAY);
  }
  const n = x => Number(x).toLocaleString('th-TH');

  // สถานะใบอนุญาต "ที่มีผลจริง": ถ้าในระบบยังเป็น active แต่เลยวันหมดอายุแล้ว ให้แสดงว่าหมดอายุ (ไม่แสดงว่าปกติ)
  function licenseState(p) {
    const s = String(p.LicenseStatus || 'none');
    const days = daysUntil(p.LicenseExpireDate);
    if (s === 'suspended') return { key: s, tone: 'red', label: 'ถูกพักใช้', days };
    if (s === 'revoked') return { key: s, tone: 'red', label: 'ถูกเพิกถอน', days };
    if (s === 'expired' || (s === 'active' && days !== null && days < 0)) return { key: 'expired', tone: 'amber', label: 'หมดอายุ', days };
    if (s === 'active') return { key: 'active', tone: days !== null && days <= 90 ? 'amber' : 'green', label: days !== null && days <= 90 ? 'ใกล้หมดอายุ' : 'ใช้งานได้', days };
    return { key: 'none', tone: 'gray', label: 'ไม่มีใบอนุญาต', days: null };
  }
  function membershipState(p) {
    const s = String(p.MembershipStatus || 'none');
    const days = daysUntil(p.MembershipExpireDate);
    if (s === 'active' && days !== null && days < 0) return { key: 'expired', tone: 'amber', label: 'หมดอายุ', days };
    if (s === 'active') return { key: 'active', tone: days !== null && days <= 90 ? 'amber' : 'green', label: days !== null && days <= 90 ? 'ใกล้หมดอายุ' : (p.MembershipExpireDate === undefined ? 'เป็นสมาชิก' : 'สมาชิกภาพปกติ'), days };
    if (s === 'expired') return { key: 'expired', tone: 'amber', label: p.MembershipExpireDate === undefined ? 'สมาชิกภาพหมดอายุ' : 'หมดอายุ', days };
    if (s === 'suspended') return { key: s, tone: 'red', label: 'ถูกพัก', days };
    return { key: 'none', tone: 'gray', label: 'ไม่เป็นสมาชิก', days: null };
  }

  const ICON = {
    ok: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    warn: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>',
    no: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 18 18 6"/></svg>',
    member: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h4M14.5 13.5h3"/></svg>',
    license: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13l2 2 4-4"/></svg>'
  };
  const toneIcon = t => (t === 'green' ? ICON.ok : t === 'gray' ? '' : t === 'red' ? ICON.no : ICON.warn);
  const badge = st => `<span class="badge badge-${st.tone}">${toneIcon(st.tone)}${E(st.label)}</span>`;

  function daysNote(st) {
    if (st.days === null || st.key === 'none' || st.key === 'suspended' || st.key === 'revoked') return '';
    if (st.days < 0) return `<span class="mc-days bad">หมดอายุมาแล้ว ${n(-st.days)} วัน</span>`;
    if (st.days === 0) return '<span class="mc-days warn">หมดอายุวันนี้</span>';
    if (st.days <= 90) return `<span class="mc-days warn">เหลืออีก ${n(st.days)} วัน — ควรต่ออายุ</span>`;
    return `<span class="mc-days ok">เหลืออีก ${n(st.days)} วัน</span>`;
  }
  // แถบอายุคงเหลือ: คิดจากวันออก→วันหมดอายุ (ถ้าไม่มีวันออก ใช้รอบ 5 ปี)
  function meter(issue, expire, st) {
    const e = toDate(expire);
    if (!e || st.key === 'none') return '';
    const i = toDate(issue);
    const total = i && e > i ? (e - i) : 5 * 365 * DAY;
    const left = e - toDate(new Date());
    const pct = Math.max(0, Math.min(100, Math.round(left / total * 100)));
    return `<div class="mc-meter ${st.tone}" role="img" aria-label="อายุคงเหลือประมาณ ${pct}%"><i style="width:${pct}%"></i></div>`;
  }
  const row = (k, v, mono, wide) => `<div${wide ? ' class="wide"' : ''}><dt>${k}</dt><dd${mono ? ' class="mono"' : ''}>${v || '-'}</dd></div>`;

  function membershipPanel(p) {
    const st = membershipState(p);
    const has = st.key !== 'none' || p.MembershipNumber;
    return `<section class="mc-panel" aria-label="สมาชิกภาพ">
      <div class="mc-panel-h"><span class="mc-title">${ICON.member}สมาชิกภาพ</span>${badge(st)}</div>
      ${has ? `<dl class="mc-dl">
        ${row('เลขที่สมาชิก', E(p.MembershipNumber), true)}
        ${row('ประเภทสมาชิก', E(p.MembershipType))}
        ${row('วันที่ออกบัตร', p.MembershipIssueDate ? fmtDate(p.MembershipIssueDate) : '')}
        ${row('วันหมดอายุ', p.MembershipExpireDate ? fmtDate(p.MembershipExpireDate) : '')}
      </dl>${meter(p.MembershipIssueDate, p.MembershipExpireDate, st)}${daysNote(st)}` : '<p class="mc-empty">ยังไม่ได้เป็นสมาชิกสภาวิชาชีพสังคมสงเคราะห์</p>'}
    </section>`;
  }
  function licensePanel(p) {
    const st = licenseState(p);
    const has = st.key !== 'none' || p.LicenseNumber;
    return `<section class="mc-panel" aria-label="ใบอนุญาตประกอบวิชาชีพ">
      <div class="mc-panel-h"><span class="mc-title">${ICON.license}ใบอนุญาตประกอบวิชาชีพ</span>${badge(st)}</div>
      ${has ? `<dl class="mc-dl">
        ${row('เลขที่ใบอนุญาต', E(p.LicenseNumber), true, true)}
        ${row('วันที่ออกใบอนุญาต', p.LicenseIssueDate ? fmtDate(p.LicenseIssueDate) : '')}
        ${row('วันหมดอายุ', p.LicenseExpireDate ? fmtDate(p.LicenseExpireDate) : '')}
      </dl>${meter(p.LicenseIssueDate, p.LicenseExpireDate, st)}${daysNote(st)}
      ${st.key === 'expired' && String(p.LicenseStatus) === 'active' ? '<p class="mc-hint">วันหมดอายุผ่านไปแล้ว แต่สถานะในทะเบียนยังไม่ได้ปรับ — ตรวจสอบกับสภาฯ</p>' : ''}`
      : '<p class="mc-empty">ยังไม่มีใบอนุญาตประกอบวิชาชีพ</p>'}
    </section>`;
  }

  function initial(p) { return E((p.FirstName || 'ผ').trim().charAt(0) || 'ผ'); }
  function avatarHtml(p, cls) {
    const name = `${p.FirstName || ''} ${p.LastName || ''}`.trim();
    return p.Photo && /^data:image\/(jpeg|png|webp);base64,/.test(p.Photo)
      ? `<span class="${cls || 'mc-avatar'} has-photo"><img src="${p.Photo}" alt="รูปของ ${E(name)}" loading="lazy" decoding="async"></span>`
      : `<span class="${cls || 'mc-avatar'}" aria-hidden="true">${initial(p)}</span>`;
  }

  // การ์ดผลการค้นหาสาธารณะ — แสดงเท่าที่จำเป็นต่อการตรวจสอบใบอนุญาต (TOR 5.2.6.7)
  // ไม่มีเลขที่สมาชิก/วันที่บัตรสมาชิก/วันที่ออกใบอนุญาต/รหัสภายใน; หน่วยงานแสดงเฉพาะเมื่อเจ้าของเปิดเอง (เซิร์ฟเวอร์ส่งมาเฉพาะกรณีนั้น)
  function publicLicensePanel(p) {
    const st = licenseState(p);
    const has = st.key !== 'none' || p.LicenseNumber;
    return `<section class="mc-panel" aria-label="ใบอนุญาตประกอบวิชาชีพ">
      <div class="mc-panel-h"><span class="mc-title">${ICON.license}ใบอนุญาตประกอบวิชาชีพ</span>${badge(st)}</div>
      ${has ? `<dl class="mc-dl">
        ${row('เลขที่ใบอนุญาต', E(p.LicenseNumber), true)}
        ${row('วันหมดอายุ', p.LicenseExpireDate ? fmtDate(p.LicenseExpireDate) : '')}
      </dl>${daysNote(st)}` : '<p class="mc-empty">ไม่มีใบอนุญาตประกอบวิชาชีพในทะเบียน</p>'}
    </section>`;
  }
  function resultCard(p) {
    const name = `${E(p.Prefix || '')}${E(p.FirstName)} ${E(p.LastName)}`;
    const sub = [p.PositionType, p.Province].filter(Boolean).map(E).join(' · ') || '-';
    const specs = String(p.Specializations || '').split(/[,،、]\s*/).map(s => s.trim()).filter(Boolean);
    const ms = membershipState(p);
    return `<article class="mc-card">
      <header class="mc-head">
        ${avatarHtml(p)}
        <div class="mc-who">
          <h3 class="mc-name">${name}</h3>
          <div class="mc-sub">${sub}</div>
          ${p.AgencyName ? `<div class="mc-code">${E(p.AgencyName)}</div>` : ''}
        </div>
        <div class="mc-member"><span class="mc-member-h">${ICON.member}สมาชิกภาพ</span>${badge(ms)}</div>
      </header>
      <div class="mc-grid one">${publicLicensePanel(p)}</div>
      ${specs.length ? `<div class="mc-specs"><span class="mc-specs-h">ความเชี่ยวชาญ</span>${specs.map(s => `<span class="chip chip-blue">${E(s)}</span>`).join('')}</div>` : ''}
    </article>`;
  }

  // ---- รูปประจำตัว: ย่อ/ครอปเป็นสี่เหลี่ยมจัตุรัสในเบราว์เซอร์ก่อนส่ง (ไฟล์เล็ก ส่งเร็ว ไม่เก็บไฟล์ต้นฉบับ/ข้อมูล EXIF)
  const PHOTO_SIZE = 400, PHOTO_MAX = 380 * 1024, INPUT_MAX = 15 * 1024 * 1024;
  async function loadBitmap(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* ใช้ <img> แทน */ }
    }
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }
  async function preparePhoto(file) {
    if (!file) throw new Error('กรุณาเลือกไฟล์รูป');
    if (!/^image\//.test(file.type || '') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')) throw new Error('ไฟล์นี้ไม่ใช่รูปภาพ (รองรับ JPG, PNG, WEBP)');
    if (file.size > INPUT_MAX) throw new Error('ไฟล์ใหญ่เกิน 15 MB');
    let bmp;
    try { bmp = await loadBitmap(file); } catch (e) {
      throw new Error(/hei[cf]/i.test(file.type + file.name) ? 'เบราว์เซอร์นี้เปิดไฟล์ HEIC ไม่ได้ — กรุณาแปลงเป็น JPG ก่อน หรือตั้งกล้องให้บันทึกเป็น JPG' : 'เปิดไฟล์รูปไม่ได้ กรุณาลองไฟล์อื่น');
    }
    const w = bmp.width, h = bmp.height, side = Math.min(w, h);
    if (side < 120) throw new Error('รูปเล็กเกินไป (อย่างน้อย 120 × 120 พิกเซล)');
    const c = document.createElement('canvas');
    c.width = c.height = Math.min(PHOTO_SIZE, side);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); // พื้นขาวแทนส่วนโปร่งใสของ PNG
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, (w - side) / 2, (h - side) / 2, side, side, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    let dataUrl = '';
    for (const q of [0.86, 0.76, 0.64]) {
      dataUrl = c.toDataURL('image/jpeg', q);
      if (dataUrl.length * 0.75 < PHOTO_MAX) break;
    }
    return { dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
  }

  function pickFile(accept) {
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept || 'image/jpeg,image/png,image/webp,image/heic,image/heif';
      inp.addEventListener('change', () => resolve(inp.files && inp.files[0]), { once: true });
      inp.click();
    });
  }

  const PHOTO_ERR = {
    invalid_photo_type: 'ไฟล์ไม่ใช่รูปภาพที่รองรับ', photo_too_large: 'รูปใหญ่เกินไป', empty_file: 'ไฟล์ว่างเปล่า',
    no_photo: 'ยังไม่มีรูป', invalid_credentials: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', unauthorized: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    unknown_action: 'ระบบหลังบ้านยังไม่ได้อัปเดต (ต้อง Deploy Apps Script เวอร์ชันใหม่ที่มี Photo.gs)'
  };
  const photoErrText = m => PHOTO_ERR[m] || m;

  window.MemberUI = { licenseState, membershipState, daysUntil, membershipPanel, licensePanel, resultCard, avatarHtml, preparePhoto, pickFile, photoErrText, badge };
})();
