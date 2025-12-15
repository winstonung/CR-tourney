/* ===========================
   Data: your idplayers.json
   =========================== */

let playersById = {};

/* ===========================
   App state
   - games: object keyed by game id (string)
   - nextGameId: next numeric id to use
   =========================== */
let games = {}; // e.g. { "1": { player1: "6", player2:"1", datetime:"2025-11-30T18:00", score:"3-1", imageData:"data:image/...", imageName:"screenshot.png" } }
let nextGameId = 1;

/* ===========================
   DOM refs
   =========================== */
const player1Select = document.getElementById('player1Select');
const player2Select = document.getElementById('player2Select');
const gameForm = document.getElementById('gameForm');
const gameDatetime = document.getElementById('gameDatetime');
const finalScore = document.getElementById('finalScore');
const towersTakenDown = document.getElementById('towersTakenDown');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const editGameIdInput = document.getElementById('editGameId');
const gamesTableBody = document.querySelector('#gamesTable tbody');
const downloadBtn = document.getElementById('downloadBtn');
const uploadJson = document.getElementById('uploadJson');
const resetBtn = document.getElementById('resetBtn');
const formTitle = document.getElementById('formTitle');
const filterSelect = document.getElementById('filterSelect');
const searchInput = document.getElementById('searchInput');

/* ===========================
   Helpers
   =========================== */
function populatePlayerSelects(){
  const entries = Object.entries(playersById).sort((a,b)=> Number(a[0]) - Number(b[0]));
  player1Select.innerHTML = entries.map(([id, p]) => `<option value="${id}">${p.username} (${p.tag})</option>`).join('');
  player2Select.innerHTML = entries.map(([id, p]) => `<option value="${id}">${p.username} (${p.tag})</option>`).join('');
}

// Convert local datetime-local value to ISO string (no timezone adjustments)
function localToISO(localValue){
  // localValue is like "2025-11-29T18:30"
  const d = new Date(localValue);
  return d.toISOString();
}
// Format ISO to readable local string
function isoToLocalString(iso){
  if(!iso) return '';
  const d = new Date(iso);
  // show date/time in user's locale
  return d.toLocaleString();
}

function isUpcoming(iso){
  if(!iso) return false;
  return new Date(iso) > new Date();
}

/* ===========================
   Image handling
   =========================== */
let currentImageData = null;
let currentImageName = null;

imageInput.addEventListener('change', () => {
  const f = imageInput.files[0];
  if(!f) return clearImagePreview();
  if(!f.type.startsWith('image/')) { alert('Please pick an image file'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageData = e.target.result; // base64 data URL
    currentImageName = f.name;
    showImagePreview();
  };
  reader.readAsDataURL(f);
});

function showImagePreview(){
  if(!currentImageData){ imagePreview.classList.add('hidden'); removeImageBtn.classList.add('hidden'); return; }
  imagePreview.src = currentImageData;
  imagePreview.classList.remove('hidden');
  removeImageBtn.classList.remove('hidden');
}

function clearImagePreview(){
  currentImageData = null;
  currentImageName = null;
  imageInput.value = '';
  imagePreview.src = '';
  imagePreview.classList.add('hidden');
  removeImageBtn.classList.add('hidden');
}

removeImageBtn.addEventListener('click', () => {
  clearImagePreview();
});

/* ===========================
   Form: add / edit
   =========================== */
gameForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const p1 = player1Select.value;
  const p2 = player2Select.value;
  if(p1 === p2){ alert('Player 1 and Player 2 must be different'); return; }

  const dateOnly = gameDatetime.value; // YYYY-MM-DD from <input type="date">
  if (!dateOnly) {
      alert("Please choose a date");
      return;
  }
  const fixedTime = "12:30"; // 12:30 PM
  // Combine date + fixed time → "YYYY-MM-DDT12:30"
  const dtLocal = `${dateOnly}T${fixedTime}`;
  const iso = localToISO(dtLocal);
  const score = finalScore.value.trim();
  const towers = towersTakenDown.value.trim();

  const payload = {
    player1: p1,
    player2: p2,
    datetime: iso,
    score: score || null,
    towersTakenDown: towers || null,
    imageData: currentImageData || null,
    imageName: currentImageName || null
  };

  const editId = editGameIdInput.value;
  if(editId){
    games[editId] = payload;
  } else {
    const id = String(nextGameId++);
    games[id] = payload;
  }

  resetForm();
  renderGames();
});

resetBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetForm();
});

function resetForm(){
  gameForm.reset();
  clearImagePreview();
  editGameIdInput.value = '';
  formTitle.textContent = 'Add new game';
}

/* ===========================
   Render games table
   =========================== */
function renderGames(){
  const filter = filterSelect.value;
  const q = (searchInput.value || '').toLowerCase();

  const rows = [];
  const ids = Object.keys(games).sort((a,b)=> Number(a)-Number(b));
  ids.forEach(id => {
    const g = games[id];
    // filter upcoming/past
    const upcoming = isUpcoming(g.datetime);
    if(filter === 'upcoming' && !upcoming) return;
    if(filter === 'past' && upcoming) return;

    // search
    const p1 = playersById[g.player1];
    const p2 = playersById[g.player2];
    const score = g.score || '';
    const searchable = [
      p1.username, p1.tag,
      p2.username, p2.tag,
      score,
      id
    ].join(' ').toLowerCase();
    if(q && !searchable.includes(q)) return;

    const imageCell = g.imageData ? `<a href="${g.imageData}" target="_blank"><img src="${g.imageData}" class="thumb" alt="img"></a>` : '';

    const status = upcoming ? `<span class="status-upcoming">Upcoming</span>` : `<span class="status-past">Past</span>`;

    rows.push(`
      <tr>
        <td>${id}</td>
        <td title="${g.datetime}">${isoToLocalString(g.datetime)}</td>
        <td>${p1.username} ${!p1.isActive ? `<span class="inactive-tag">Inactive</span>` : ''}</td>
        <td>${p2.username} ${!p2.isActive ? `<span class="inactive-tag">Inactive</span>` : ''}</td>
        <td>${score || '—'}</td>
        <td>${g.towersTakenDown || '—'}</td>
        <td>${imageCell}</td>
        <td>${status}</td>
        <td class="actions-cell">
          <button class="small" data-action="edit" data-id="${id}">Edit</button>
          <button class="small danger" data-action="delete" data-id="${id}">Delete</button>
        </td>
      </tr>
    `);
  });

  gamesTableBody.innerHTML = rows.join('') || `<tr><td colspan="8" style="text-align:center;color:#777;padding:20px">No games found</td></tr>`;
}

/* ===========================
   Table actions (edit / delete)
   =========================== */
gamesTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if(action === 'edit') openEdit(id);
  if(action === 'delete') {
    if(!confirm('Delete game #' + id + '?')) return;
    delete games[id];
    renderGames();
  }
});

function openEdit(id){
  const g = games[id];
  if(!g) return alert('Game not found');
  editGameIdInput.value = id;
  formTitle.textContent = 'Edit game #' + id;
  player1Select.value = g.player1;
  player2Select.value = g.player2;
  // set datetime-local value from ISO
  const d = new Date(g.datetime);
  // create value like "YYYY-MM-DD"
  const pad = (n)=> String(n).padStart(2,'0');
  const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  gameDatetime.value = local;
  finalScore.value = g.score || '';
  towersTakenDown.value = g.towersTakenDown || '';
  currentImageData = g.imageData || null;
  currentImageName = g.imageName || null;
  showImagePreview();
  // scroll into view
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ===========================
   Save / Load JSON
   - downloadBtn: exports { games: {...}, nextGameId: N }
   - uploadJson: reads JSON and sets games/nextGameId
   =========================== */
downloadBtn.addEventListener('click', () => {
  const payload = { games, nextGameId };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'games.json';
  a.click();
  URL.revokeObjectURL(url);
});

uploadJson.addEventListener('change', () => {
  const f = uploadJson.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      // support two formats:
      // { games: {...}, nextGameId: n } OR raw games object
      if(parsed.games && typeof parsed.games === 'object'){
        games = parsed.games;
        nextGameId = parsed.nextGameId || (Math.max(0, ...Object.keys(games).map(n=>Number(n))) + 1);
      } else if(typeof parsed === 'object'){
        // interpret whole file as games map
        games = parsed;
        nextGameId = Math.max(0, ...Object.keys(games).map(n=>Number(n))) + 1;
      } else {
        throw new Error('Unexpected format');
      }
      resetForm();
      renderGames();
      alert('Loaded games JSON — ' + Object.keys(games).length + ' games');
    } catch(err) {
      console.error(err);
      alert('Invalid games JSON');
    }
  };
  reader.readAsText(f);
});

/* ===========================
   Filters & search wiring
   =========================== */
filterSelect.addEventListener('change', renderGames);
searchInput.addEventListener('input', renderGames);

/* ===========================
   Init
   =========================== */
async function init() {
  const response = await fetch("idplayers.json");
  playersById = await response.json();
  populatePlayerSelects();
  renderGames();
}
init();

