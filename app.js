const BADGE_ICON = {
  ok: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  warn: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>',
  no: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 18 18 6"/></svg>'
};

// ข้อความ "เหลืออีก X วัน" / "หมดอายุมาแล้ว X วัน" ของใบอนุญาต (คืนค่าว่างถ้าไม่มีวันหมดอายุ)
function licenseDaysText(p) {
  if (!p.LicenseExpireDate) return '';
  const d = new Date(p.LicenseExpireDate);
  if (isNaN(d)) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  if (days < 0) return `<span class="lic-days lic-days-bad">หมดอายุมาแล้ว ${Math.abs(days).toLocaleString('th-TH')} วัน</span>`;
  if (days === 0) return '<span class="lic-days lic-days-warn">หมดอายุวันนี้</span>';
  if (days <= 90) return `<span class="lic-days lic-days-warn">เหลืออีก ${days.toLocaleString('th-TH')} วัน — ใกล้หมดอายุ</span>`;
  return `<span class="lic-days">เหลืออีก ${days.toLocaleString('th-TH')} วัน</span>`;
}

function statusBadge(status, kind) {
  if (kind === 'membership') {
    if (status === 'active') return '<span class="badge badge-green">สมาชิกภาพปกติ</span>';
    return '<span class="badge badge-gray">ไม่เป็นสมาชิก</span>';
  }
  if (kind === 'license') {
    // ไอคอน + ข้อความ (ไม่สื่อความหมายด้วยสีอย่างเดียว)
    if (status === 'active') return '<span class="badge badge-green">' + BADGE_ICON.ok + 'ใบอนุญาตปกติ</span>';
    if (status === 'expired') return '<span class="badge badge-amber">' + BADGE_ICON.warn + 'ใบอนุญาตหมดอายุ</span>';
    if (status === 'suspended') return '<span class="badge badge-red">' + BADGE_ICON.no + 'ถูกพักใช้</span>';
    if (status === 'revoked') return '<span class="badge badge-red">' + BADGE_ICON.no + 'ถูกเพิกถอน</span>';
    return '<span class="badge badge-gray">ไม่มีใบอนุญาต</span>';
  }
  return '';
}

function renderResults(results, info) {
  info = info || {};
  const wrap = document.getElementById('searchResultsWrap');
  const dash = document.getElementById('dashboardWrap');
  const list = document.getElementById('searchResults');
  const count = document.getElementById('searchResultCount');

  if (!results.length) {
    wrap.style.display = '';
    dash.style.display = 'none';
    // ค้นหาสาธารณะรับเฉพาะชื่อเต็ม + นามสกุล หรือเลขที่ใบอนุญาตทั้งเลข (ป้องกันการดึงรายชื่อทั้งฐาน)
    const msg = info.hint === 'need_full_name'
      ? { t: 'กรุณาพิมพ์ชื่อและนามสกุล', d: 'พิมพ์ชื่อเต็มเว้นวรรคตามด้วยนามสกุล (อย่างน้อย 2 ตัวอักษรแรก) เช่น “สมชาย ใจดี” หรือใช้เลขที่ใบอนุญาตทั้งเลข' }
      : { t: 'ไม่พบข้อมูลที่ตรงกับคำค้นหา', d: 'ตรวจสอบการสะกดชื่อ-นามสกุล หรือกรอกเลขที่ใบอนุญาตให้ครบทุกหลัก' };
    count.textContent = msg.t;
    list.innerHTML = `<div class="empty-state card"><div class="icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div><div>${msg.d}</div></div>`;
    return;
  }

  wrap.style.display = '';
  dash.style.display = 'none';
  count.textContent = `พบ ${results.length} รายการ` + (info.more ? ' (แสดง 10 รายการแรก — ระบุนามสกุลให้ครบเพื่อให้ผลแคบลง)' : '');
  // การ์ดสาธารณะแสดงเท่าที่จำเป็นต่อการตรวจสอบใบอนุญาต — member-ui.js
  list.innerHTML = results.map(p => MemberUI.resultCard(p)).join('');
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) {
    document.getElementById('searchResultsWrap').style.display = 'none';
    document.getElementById('dashboardWrap').style.display = '';
    return;
  }
  try {
    const res = await Api.search(q);
    renderResults(res.results || [], res);
  } catch (e) {
    toast('ค้นหาไม่สำเร็จ: ' + e.message, 'error');
  }
}

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

let provinceTotals = { total: 0, ranked: [] };
function showProvinceDetail(name, count) {
  const rank = provinceTotals.ranked.findIndex(([p]) => p === name);
  const share = provinceTotals.total ? (count / provinceTotals.total) * 100 : 0;
  document.getElementById('provinceDetailPanel').innerHTML = `
    <div class="province-detail" role="status" aria-live="polite">
      <div class="text-sm text-soft">จังหวัดที่เลือก</div>
      <div class="result-name">${escapeHtml(name)}</div>
      <div class="province-detail-num">${count.toLocaleString('th-TH')} <span>คน</span></div>
      <div class="result-meta">${count ? `คิดเป็น ${share.toFixed(1)}% ของทั้งประเทศ${rank >= 0 ? ` · อันดับที่ ${rank + 1} จาก ${provinceTotals.ranked.length} จังหวัด` : ''}` : 'ยังไม่มีผู้ปฏิบัติงานที่ลงทะเบียนในจังหวัดนี้'}</div>
    </div>`;
}

async function loadDashboard() {
  let stats;
  try {
    stats = await Api.stats();
  } catch (e) {
    document.getElementById('dashboardWrap').innerHTML =
      `<div class="alert alert-error">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้: ${escapeHtml(e.message)}<br>โปรดตรวจสอบว่าได้ตั้งค่า API_URL ใน js/api.js เรียบร้อยแล้ว</div>`;
    return;
  }

  const kpis = document.querySelectorAll('#kpiGrid .kpi .num');
  kpis[0].textContent = stats.total.toLocaleString('th-TH');
  kpis[1].textContent = stats.licenseRate + '%';
  kpis[2].textContent = stats.expiringLicensesCount.toLocaleString('th-TH');

  let byProvince = {};
  try {
    byProvince = (await Api.provinces()).byProvince;
  } catch (e) { /* ปล่อยผ่าน แผนที่จะแสดงเป็นสีอ่อนทั้งหมดแทน */ }

  const ranked = Object.entries(byProvince).sort((a, b) => b[1] - a[1]);
  provinceTotals = { total: ranked.reduce((s, [, n]) => s + Number(n || 0), 0), ranked };
  const topList = ranked.slice(0, 5);
  const topMax = topList.length ? topList[0][1] : 1;
  document.getElementById('topProvincesList').innerHTML = topList.length
    ? `<ol class="rank-list">${topList.map(([prov, n], i) => `<li>
        <button type="button" class="rank-row" data-prov="${escapeHtml(prov)}">
          <span class="rank-no">${i + 1}</span>
          <span class="rank-main"><span class="rank-name">${escapeHtml(prov)}</span>
            <span class="rank-bar"><i style="width:${Math.max(4, (n / topMax) * 100)}%"></i></span></span>
          <span class="rank-num">${n.toLocaleString('th-TH')} <small>คน</small></span>
        </button></li>`).join('')}</ol>
       <p class="text-sm text-soft mt-16 mb-0">คลิกจังหวัดในรายการหรือบนแผนที่เพื่อดูรายละเอียด</p>`
    : '<p class="text-sm text-soft">ยังไม่มีข้อมูล</p>';
  if (topList.length) showProvinceDetail(topList[0][0], topList[0][1]); // เริ่มต้นแสดงจังหวัดอันดับ 1 ให้แผงไม่ว่าง
  document.getElementById('topProvincesList').onclick = e => {
    const b = e.target.closest('[data-prov]');
    if (b) showProvinceDetail(b.dataset.prov, byProvince[b.dataset.prov] || 0);
  };

  const posEntries = Object.entries(stats.byPosition || {}).sort((a, b) => b[1] - a[1]);
  const posTotal = posEntries.reduce((sum, [, n]) => sum + n, 0);
  const posColors = ['#3d8b7d', '#8b7dd8', '#d8a13d', '#4f9bd8', '#c65f5f', '#5fa85f', '#a85f9b'];
  document.getElementById('positionTypeList').innerHTML = posEntries.length
    ? `
      <div class="pos-segmented-bar">
        ${posEntries.map(([pos, n], i) => {
          const pct = posTotal ? (n / posTotal) * 100 : 0;
          return `<div style="width:${pct}%; background:${posColors[i % posColors.length]};" title="${escapeHtml(pos)}: ${n.toLocaleString('th-TH')} คน (${Math.round(pct)}%)"></div>`;
        }).join('')}
      </div>
      <div class="pos-legend">
        ${posEntries.map(([pos, n], i) => {
          const pct = posTotal ? Math.round((n / posTotal) * 100) : 0;
          return `<div class="pos-legend-item">
            <span class="pos-legend-dot" style="background:${posColors[i % posColors.length]};"></span>
            <span>${escapeHtml(pos)}</span> <strong>${n.toLocaleString('th-TH')}</strong> คน <span class="text-soft">(${pct}%)</span>
          </div>`;
        }).join('')}
      </div>`
    : '<p class="text-sm text-soft">ยังไม่มีข้อมูล</p>';

  renderThailandMap('publicMap', byProvince, { height: 480, onProvinceClick: showProvinceDetail });
}

loadDashboard();
