// app.js - handles multiple Excel uploads and renders tables
const expectedSheets = [
  'IW39','SUM57','DET','External Job','Planning','Equip Adm','Data1','Data2'
];

const uploadGrid = document.getElementById('upload-grid');
const tabs = document.getElementById('tabs');
const tables = document.getElementById('tables');
const clearAllBtn = document.getElementById('clear-all');

const state = {}; // store parsed data keyed by sheet name

function createUploadCards(){
  expectedSheets.forEach(name=>{
    const div = document.createElement('div');
    div.className = 'uploader';
    div.innerHTML = `
      <h3>${name}</h3>
      <input type="file" accept=".xlsx,.xls" data-name="${name}">
      <div class="info" id="info-${name}"></div>
    `;
    uploadGrid.appendChild(div);
    const input = div.querySelector('input[type=file]');
    input.addEventListener('change', onFileChange);
  });
}

function onFileChange(e){
  const file = e.target.files[0];
  const name = e.target.dataset.name;
  const infoEl = document.getElementById('info-' + name);
  if(!file){ infoEl.textContent='No file chosen'; return;}
  infoEl.textContent = 'Parsing... ' + file.name;
  const reader = new FileReader();
  reader.onload = (evt)=>{
    try{
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, {type:'array'});
      // Try to find the first sheet (or sheet with same name)
      let sheetName = workbook.SheetNames.find(n=>n.toLowerCase().includes(name.replace(/\\s+/g,'').toLowerCase()))
                    || workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, {defval:''});
      state[name] = {file:file.name, sheetName, rows:json};
      infoEl.textContent = Loaded ${json.length} rows (sheet: ${sheetName});
      renderTabs();
      renderActiveTable(name);
    }catch(err){
      console.error(err);
      infoEl.textContent = 'Error parsing file';
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderTabs(){
  tabs.innerHTML = '';
  Object.keys(state).forEach((k, idx)=>{
    const btn = document.createElement('div');
    btn.className='tab' + (idx===0?' active':'');
    btn.textContent = k;
    btn.dataset.name = k;
    btn.addEventListener('click', ()=> {
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      renderActiveTable(k);
    });
    tabs.appendChild(btn);
  });
}

function renderActiveTable(name){
  if(!state[name]) return;
  // highlight active tab
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.name===name));
  const rows = state[name].rows;
  tables.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className='table-wrap';
  if(rows.length===0){
    wrap.innerHTML = '<i>No rows parsed</i>';
    tables.appendChild(wrap);
    return;
  }
  // build table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const cols = Object.keys(rows[0]);
  cols.forEach(c=>{
    const th = document.createElement('th');
    th.textContent = c;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((r, i)=>{
    const tr = document.createElement('tr');
    cols.forEach(c=>{
      const td = document.createElement('td');
      td.textContent = r[c];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  // summary block
  const meta = document.createElement('div');
  meta.style.margin='8px 0';
  meta.innerHTML = <strong>${name}</strong> — file: ${state[name].file} — rows: ${rows.length};
  tables.appendChild(meta);
  tables.appendChild(wrap);
}

// Clear
clearAllBtn.addEventListener('click', ()=>{
  Object.keys(state).forEach(k=>delete state[k]);
  uploadGrid.querySelectorAll('input[type=file]').forEach(i=>i.value='');
  document.querySelectorAll('[id^=info-]').forEach(el=>el.textContent='');
  tabs.innerHTML=''; tables.innerHTML=''; 
});

createUploadCards();
