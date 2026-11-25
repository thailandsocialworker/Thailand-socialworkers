// แสดงผลหน้าโปรไฟล์เป็นการ์ดสรุป + ปุ่มแก้ไข (ฟอร์มเดิม profileForm ยังทำงานเหมือนเดิม)
(function () {
  const orig = window.fillProfile;
  const E = s => escapeHtml(s == null ? '' : String(s));
  const addr = (p, g) => {
    const parts = [p[g + '_No'] && 'เลขที่ ' + p[g + '_No'], p[g + '_Village'], p[g + '_Building'], p[g + '_Soi'] && 'ซอย ' + p[g + '_Soi'], p[g + '_Road'] && 'ถนน ' + p[g + '_Road'],
      p[g + '_Subdistrict'] && 'ต.' + p[g + '_Subdistrict'], p[g + '_District'] && 'อ.' + p[g + '_District'], p[g + '_Province'] && 'จ.' + p[g + '_Province'], p[g + '_Zipcode']].filter(Boolean);
    return parts.join(' ') || '-';
  };
  const card = (title, rows) => `<div class="sum-card"><h3>${title}</h3><dl>${rows.map(([k, v, w]) => `<div${w ? ' class="wide-wrap" style="grid-column:1/-1"' : ''}><dt>${k}</dt><dd>${v || '-'}</dd></div>`).join('')}</dl><button type="button" class="edit-btn" data-edit>แก้ไข</button></div>`;

  window.fillProfile = function (person, work, edu) {
    orig.apply(this, arguments);
    try {
      const name = `${person.Prefix || ''}${person.FirstName || ''} ${person.LastName || ''}`.trim();
      document.getElementById('profName').textContent = name;
      document.getElementById('profAvatar').textContent = (person.FirstName || 'ผ').charAt(0);
      renderMemberExtras(person);
      document.getElementById('profPid').textContent = person.PersonID || '';
      const m = document.getElementById('profMeter'), n = document.getElementById('profLicNote');
      m.className = ''; n.className = 'lic-note'; n.textContent = ''; m.style.width = '0%';
      if (person.LicenseExpireDate) {
        const days = Math.ceil((new Date(person.LicenseExpireDate) - new Date()) / 86400000);
        if (!isNaN(days)) {
          const pct = Math.max(0, Math.min(100, days / 1825 * 100));
          m.style.width = pct + '%';
          if (days < 0) { m.classList.add('bad'); n.textContent = 'ใบอนุญาตหมดอายุแล้ว'; }
          else if (days <= 90) { n.textContent = `เหลืออีก ${days} วัน — ควรต่ออายุ`; }
          else { m.classList.add('ok'); n.classList.add('ok'); n.textContent = `เหลืออีก ${days} วัน`; }
        }
      }
      const w = (work || []).map(x => `${E(x.Position || '')} ${E(x.AgencyName || '')}`.trim()).filter(Boolean).join('<br>');
      const e = (edu || []).map(x => [x.EducationLevel, x.EducationField, x.EducationInstitute].filter(Boolean).map(E).join(' · ')).filter(Boolean).join('<br>');
      document.getElementById('profSummary').innerHTML =
        card('ข้อมูลติดต่อ', [['โทรศัพท์', E(person.Phone)], ['อีเมล', E(person.Email)], ['สถานะการปฏิบัติงาน', E(person.PracticeStatus)]]) +
        card('ที่อยู่', [['ตามทะเบียนบ้าน', E(addr(person, 'House')), 1], ['ปัจจุบัน', E(addr(person, 'Current')), 1]]) +
        card('การทำงาน', [['ประเภทตำแหน่ง', E(person.PositionType)], ['ระดับ', E(person.PositionLevel)], ['ประวัติการทำงาน', w, 1], ['ที่อยู่ที่ทำงาน', E(addr(person, 'Work')), 1]]) +
        card('วุฒิการศึกษา', [['ประวัติ', e, 1]]) +
        card('ความเชี่ยวชาญ', [['สาขา', E(person.Specializations), 1]]);
    } catch (err) { console.error(err); }
  };

  // ---- สถานะที่มีผลจริง + บัตรสมาชิก/ใบอนุญาต + รูปประจำตัว (member-ui.js)
  let cur = null;
  function renderAvatar() {
    const av = document.getElementById('profAvatar');
    if (!cur || !av) return;
    av.classList.toggle('has-photo', !!cur.Photo);
    av.innerHTML = cur.Photo ? `<img src="${cur.Photo}" alt="รูปประจำตัว">` : E((cur.FirstName || 'ผ').charAt(0));
  }
  function renderPhotoCard() {
    const has = !!(cur && cur.Photo);
    const pub = has && (cur.PhotoPublic === true || cur.PhotoPublic === 'TRUE' || cur.PhotoPublic === 'true');
    document.getElementById('profPhotoUpload').textContent = has ? 'เปลี่ยนรูป' : 'อัปโหลดรูป';
    document.getElementById('profPhotoDelete').hidden = !has;
    const cb = document.getElementById('profPhotoPublic');
    cb.checked = pub; cb.disabled = !has;
    document.getElementById('profPhotoState').textContent = !has ? 'ยังไม่มีรูป' : pub ? 'แสดงต่อสาธารณะ' : 'เฉพาะท่านและเจ้าหน้าที่';
    const ag = document.getElementById('profAgencyPublic');
    if (ag) ag.checked = !!cur && (cur.AgencyPublic === true || cur.AgencyPublic === 'TRUE' || cur.AgencyPublic === 'true');
    renderAvatar();
  }
  function renderMemberExtras(person) {
    cur = person;
    if (!window.MemberUI) return;
    const ms = MemberUI.membershipState(person), ls = MemberUI.licenseState(person);
    document.getElementById('profMembership').textContent = ms.label;
    document.getElementById('profLicense').textContent = ls.key === 'none' ? 'ไม่มี' : ls.label;
    document.getElementById('profCards').innerHTML = MemberUI.membershipPanel(person) + MemberUI.licensePanel(person);
    renderPhotoCard();
  }
  const photoAlert = (msg, kind) => {
    document.getElementById('profPhotoAlert').innerHTML = msg ? `<div class="alert alert-${kind || 'error'}" style="margin:8px 0 0;">${E(msg)}</div>` : '';
  };
  async function photoCall(btn, fn) {
    photoAlert('');
    const old = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
    try { await fn(); } catch (err) { photoAlert(MemberUI.photoErrText(err.message)); }
    finally { if (btn) { btn.disabled = false; btn.textContent = old; } renderPhotoCard(); }
  }
  document.getElementById('profPhotoUpload').addEventListener('click', async e => {
    const btn = e.currentTarget;
    const file = await MemberUI.pickFile();
    if (!file) return;
    await photoCall(btn, async () => {
      const img = await MemberUI.preparePhoto(file);
      const r = await Api.selfPhoto(currentSession, 'upload', { base64: img.base64, mimeType: img.mimeType });
      cur.Photo = r.Photo || img.dataUrl; cur.PhotoPublic = r.PhotoPublic;
      toast('บันทึกรูปประจำตัวแล้ว');
    });
  });
  document.getElementById('profPhotoDelete').addEventListener('click', async e => {
    const btn = e.currentTarget;
    if (!(await confirmDialog('ลบรูปประจำตัวออกจากระบบหรือไม่?', { title: 'ลบรูป', okText: 'ลบรูป' }))) return;
    await photoCall(btn, async () => {
      await Api.selfPhoto(currentSession, 'delete');
      cur.Photo = ''; cur.PhotoPublic = false;
      toast('ลบรูปแล้ว');
    });
  });
  document.getElementById('profAgencyPublic').addEventListener('change', async e => {
    const want = e.target.checked;
    await photoCall(null, async () => {
      const r = await Api.selfPrivacy(currentSession, want);
      cur.AgencyPublic = r.AgencyPublic;
      toast(want ? 'ชื่อหน่วยงานจะแสดงในผลการค้นหาสาธารณะ' : 'ซ่อนชื่อหน่วยงานจากผลการค้นหาสาธารณะแล้ว');
    });
  });
  document.getElementById('profPhotoPublic').addEventListener('change', async e => {
    const want = e.target.checked;
    await photoCall(null, async () => {
      const r = await Api.selfPhoto(currentSession, 'visibility', { public: want });
      cur.PhotoPublic = r.PhotoPublic;
      toast(want ? 'รูปจะแสดงในผลการค้นหาสาธารณะ' : 'ซ่อนรูปจากผลการค้นหาสาธารณะแล้ว');
    });
  });

  const form = document.getElementById('profileForm');
  const open = () => { form.style.display = ''; form.scrollIntoView({ behavior: 'smooth' }); };
  document.getElementById('profEditAllBtn').addEventListener('click', open);
  document.getElementById('profEditCloseBtn').addEventListener('click', () => { form.style.display = 'none'; });
  document.getElementById('profSummary').addEventListener('click', e => { if (e.target.closest('[data-edit]')) open(); });
})();
