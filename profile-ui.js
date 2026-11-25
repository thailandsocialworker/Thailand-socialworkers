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

  const form = document.getElementById('profileForm');
  const open = () => { form.style.display = ''; form.scrollIntoView({ behavior: 'smooth' }); };
  document.getElementById('profEditAllBtn').addEventListener('click', open);
  document.getElementById('profEditCloseBtn').addEventListener('click', () => { form.style.display = 'none'; });
  document.getElementById('profSummary').addEventListener('click', e => { if (e.target.closest('[data-edit]')) open(); });
})();
