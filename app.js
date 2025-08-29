/* ========= Simple SPA Tabs ========= */
document.querySelectorAll('.tablink').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tablink').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tabcontent').forEach(s=>s.style.display='none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).style.display='block';
  });
});

/* ========= Global State =========
   Menyimpan hasil parsing Excel per dataset */
const state = {
  IW39: null,
  SUM57: null,
  DET: null,
  EXTERNAL: null,
  PLANNING: null,
  EQUIP: null,
  DATA1: null,
  DATA2: null
};

/* ========= Helpers ========= */
const q = (sel) => document.querySelector(sel);
const el = (tag, attrs={}) => Object.assign(document.createElement(tag), attrs);
const norm = s => String(s||'').trim();
const toNum = v => {
  const n = Number(String(v).replace(/[^0-9.-]/g,''));
  return isNaN(n) ? 0 : n;
};

/* Baca file excel -> JSON */
async function parseExcel(file){
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, {type:'array'});
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
  return {sheetName, rows};
}

/* Render tabel generik */
function renderTable(container, rows){
  container.innerHTML = '';
  if(!rows || rows.length===0){ container.innerHTML = '<div class="meta">No rows.</div>'; return; }
  const table = el('table');
  const thead = el('thead');
  const headRow = el('tr');
  const cols = Object.keys(rows[0]);
  cols.forEach(c => headRow.appendChild(el('th',{textContent:c})));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  rows.forEach(r=>{
    const tr = el('tr');
    cols.forEach(c=> tr.appendChild(el('td',{textContent: r[c]})));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

/* ========= MENU 1: file inputs ========= */
const fileInputs = {
  IW39: q('#f-iw39'),
  SUM57: q('#f-sum57'),
  DET: q('#f-det'),
  EXTERNAL: q('#f-external'),
  PLANNING: q('#f-planning'),
  EQUIP: q('#f-equip'),
  DATA1: q('#f-data1'),
  DATA2: q('#f-data2')
};

Object.entries(fileInputs).forEach(([key, input])=>{
  input.addEventListener('change', async (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const parsed = await parseExcel(f);
    state[key] = parsed;
    q('#upload-status').textContent = ${key} loaded: sheet "${parsed.sheetName}" — ${parsed.rows.length} rows;
    // preview
    q('#preview-meta').textContent = ${key} / ${parsed.sheetName};
    renderTable(q('#preview-table'), parsed.rows.slice(0,100));
  });
});

q('#btn-clear').addEventListener('click', ()=>{
  Object.keys(state).forEach(k=>state[k]=null);
  Object.values(fileInputs).forEach(i=>i.value='');
  q('#upload-status').textContent = 'Cleared.';
  q('#preview-meta').textContent = '';
  q('#preview-table').innerHTML = '';
});

/* ========= JOIN LOGIC for MENU 2 =========
   - Sumber utama: IW39 (Order list)
   - Enrich:
     SUM57: Status Part, Aging (by Order)
     DATA1: Section (by Room)
     DATA2: CPH (by Room)
     PLANNING: Event Start, Status AMT, Target Date (by Order)
     EQUIP: End Date (by Room)
   - Include = (Plan - Actual)/16500  (angka aman jika kolom ada)
   - Exclude = kosong jika Order Type = PM38, kalau tidak = Include
*/
function buildMenu2Rows(){
  const iw = state.IW39?.rows || [];
  const sum = indexBy(state.SUM57?.rows, 'Order') || {};
  const data1ByRoom = indexBy(state.DATA1?.rows, 'Room') || {};
  const data2ByRoom = indexBy(state.DATA2?.rows, 'Room') || {};
  const planningByOrder = indexBy(state.PLANNING?.rows, 'Order') || {};
  const equipByRoom = indexBy(state.EQUIP?.rows, 'Room') || {};

  const out = iw.map(r=>{
    const order = norm(r['Order']||r['Order Number']||r['WO']);
    const room = norm(r['Room']);
    const orderType = norm(r['Order Type']||r['Type']);
    const plan = toNum(r['Total sum (plan)']||r['Plan']||r['Total Plan']);
    const actual = toNum(r['Total sum (actual)']||r['Actual']||r['Total Actual']);
    const include = (plan - actual)/16500 || '';
    const isPM38 = orderType.toUpperCase()==='PM38';
    const exclude = isPM38 ? '' : include;

    const sumRow = sum[order] || {};
    const secRow = data1ByRoom[room] || {};
    const cphRow = data2ByRoom[room] || {};
    const planRow = planningByOrder[order] || {};
    const eqRow = equipByRoom[room] || {};

    return {
      'Room': room,
      'Order Type': orderType,
      'Order': order,
      'Description': r['Description']||'',
      'Created On': r['Created On']||r['CreatedOn']||'',
      'User Status': r['User Status']||r['Status']||'',
      'MAT': r['MAT']||'',
      'CPH': cphRow['CPH']||cphRow['Value']||'',
      'Section': secRow['Section']||secRow['Value']||'',
      'Status Part': sumRow['Status Part']||sumRow['Status']||'',
      'Aging': sumRow['Aging']||sumRow['Aging WO']||'',
      'Include': include,
      'Exclude': exclude,
      'Event Start': planRow['Event Start']||planRow['Start Date']||'',
      'Status AMT': planRow['Status AMT']||planRow['Status']||'',
      'Target Date': planRow['Target Date']||planRow['Plan Start']||'',
      'End Date': eqRow['End Date']||eqRow['Finish Date']||''
    };
  });
  return out;
}

function indexBy(rows, key){
  if(!rows) return null;
  const k = key;
  const out = {};
  rows.forEach(r=>{
    const val = norm(r[k]);
    if(val) out[val] = r;
  });
  return out;
}

/* Render Menu 2 */
function renderMenu2(){
  const rows = buildMenu2Rows();
  // filtering
  const fl = {
    room: norm(q('#fl-room').value).toLowerCase(),
    order: norm(q('#fl-order').value).toLowerCase(),
    mat: norm(q('#fl-mat').value).toLowerCase(),
    cph: norm(q('#fl-cph').value).toLowerCase(),
    section: norm(q('#fl-section').value).toLowerCase(),
    statuspart: norm(q('#fl-statuspart').value).toLowerCase()
  };
  const filtered = rows.filter(r=>{
    return (!fl.room || String(r['Room']).toLowerCase().includes(fl.room))
        && (!fl.order || String(r['Order']).toLowerCase().includes(fl.order))
        && (!fl.mat || String(r['MAT']).toLowerCase().includes(fl.mat))
        && (!fl.cph || String(r['CPH']).toLowerCase().includes(fl.cph))
        && (!fl.section || String(r['Section']).toLowerCase().includes(fl.section))
        && (!fl.statuspart || String(r['Status Part']).toLowerCase().includes(fl.statuspart));
  });
  mountTable('#table-menu2', filtered, [
    'Room','Order Type','Order','Description','Created On','User Status','MAT',
    'CPH','Section','Status Part','Aging','Include','Exclude','Event Start',
    'Status AMT','Target Date','End Date'
  ]);
}
q('#btn-apply2').addEventListener('click', renderMenu2);
q('#btn-reset2').addEventListener('click', ()=>{
  ['#fl-room','#fl-order','#fl-mat','#fl-cph','#fl-section','#fl-statuspart'].forEach(id=>q(id).value='');
  renderMenu2();
});

/* ========= MENU 3 (DET filter) ========= */
function renderMenu3(){
  const rows = state.DET?.rows || [];
  const flOrder = norm(q('#m3-order').value).toLowerCase();
  const flMatNo = norm(q('#m3-matno').value).toLowerCase();
  const flMatDesc = norm(q('#m3-matdesc').value).toLowerCase();

  const mapped = rows.map(r=>({
    'Room': r['Room']||'',
    'Order': r['Order']||r['WO']||'',
    'Description': r['Description']||'',
    'WO User Status': r['WO User Status']||r['User Status']||'',
    'Material Number': r['Material Number']||r['Material']||'',
    'Material Description': r['Material Description']||'',
    'Requirement Quantity': r['Requirement Quantity']||r['Req Qty']||'',
    'Total Stock': r['Total Stock']||'',
    'Quantity withdrawn': r['Quantity withdrawn']||'',
    'Outstanding Withdrawn qty': r['Outstanding Withdrawn qty']||'',
    'Aging': r['Aging']||r['Aging WO']||''
  }));

  const filtered = mapped.filter(r=>{
    return (!flOrder || String(r['Order']).toLowerCase().includes(flOrder))
        && (!flMatNo || String(r['Material Number']).toLowerCase().includes(flMatNo))
        && (!flMatDesc || String(r['Material Description']).toLowerCase().includes(flMatDesc));
  });

  mountTable('#table-menu3', filtered, [
    'Room','Order','Description','WO User Status','Material Number',
    'Material Description','Requirement Quantity','Total Stock',
    'Quantity withdrawn','Outstanding Withdrawn qty','Aging'
  ]);
}
q('#btn-apply3').addEventListener('click', renderMenu3);
q('#btn-reset3').addEventListener('click', ()=>{
  ['#m3-order','#m3-matno','#m3-matdesc'].forEach(id=>q(id).value='');
  renderMenu3();
});

/* ========= MENU 4 (External Job filter) ========= */
function renderMenu4(){
  const rows = state.EXTERNAL?.rows || [];
  const flRoom = norm(q('#m4-room').value).toLowerCase();
  const flOrder = norm(q('#m4-order').value).toLowerCase();
  const flPO = norm(q('#m4-po').value).toLowerCase();

  const mapped = rows.map(r=>({
    'Room': r['Room']||'',
    'Manufacturer model number': r['Manufacturer model number']||r['Model']||'',
    'Order Number': r['Order Number']||r['Order']||'',
    'Maintenance activity type': r['Maintenance activity type']||'',
    'Field displaying user status': r['Field displaying user status']||r['User Status']||'',
    'Description': r['Description']||'',
    'Aging WO': r['Aging WO']||r['Aging']||'',
    'Net Price in PO USD': r['Net Price in PO USD']||r['Net Price in USD']||'',
    'Cost Element': r['Cost Element']||'',
    'Service number': r['Service number']||'',
    'Service Short Text': r['Service Short Text']||'',
    'Name': r['Name']||'',
    'Purchase Requisition Number': r['Purchase Requisition Number']||'',
    'Purchasing Document Number': r['Purchasing Document Number']||'',
    'Entry Sheet Number': r['Entry Sheet Number']||''
  }));

  const filtered = mapped.filter(r=>{
    return (!flRoom || String(r['Room']).toLowerCase().includes(flRoom))
        && (!flOrder || String(r['Order Number']).toLowerCase().includes(flOrder))
        && (!flPO || String(r['Purchasing Document Number']).toLowerCase().includes(flPO));
  });

  mountTable('#table-menu4', filtered, [
    'Room','Manufacturer model number','Order Number','Maintenance activity type',
    'Field displaying user status','Description','Aging WO','Net Price in PO USD',
    'Cost Element','Service number','Service Short Text','Name',
    'Purchase Requisition Number','Purchasing Document Number','Entry Sheet Number'
  ]);
}
q('#btn-apply4').addEventListener('click', renderMenu4);
q('#btn-reset4').addEventListener('click', ()=>{
  ['#m4-room','#m4-order','#m4-po'].forEach(id=>q(id).value='');
  renderMenu4();
});

/* Helper untuk mount table dengan kolom terurut */
function mountTable(selector, rows, order){
  const cont = q(selector);
  if(!rows || rows.length===0){ cont.innerHTML = '<div class="meta">No data. Pastikan file Excel sudah di-upload di Menu 1.</div>'; return; }
  // urutkan kolom sesuai "order" jika ada
  const normalized = rows.map(r=>{
    const obj = {};
    order.forEach(k => obj[k] = r[k] ?? '');
    return obj;
  });
  renderTable(cont, normalized);
}

/* ==== Auto-render saat berpindah tab (kalau sudah ada data) ==== */
document.querySelector('[data-tab="menu2"]').addEventListener('click', renderMenu2);
document.querySelector('[data-tab="menu3"]').addEventListener('click', renderMenu3);
document.querySelector('[data-tab="menu4"]').addEventListener('click', renderMenu4);
