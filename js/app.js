import { store, DEMO } from './store.js';
import { iconSvg, paintIcons, CATEGORY_ICONS, CATEGORY_COLORS } from './icons.js';

const $ = (id) => document.getElementById(id);
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const TITLES = { home: 'Inicio', txns: 'Movimientos', stats: 'Resumen', profile: 'Perfil' };

const state = {
  user: null,
  profile: null,
  categories: [],
  txns: [],                 // ventana de 6 meses que termina en el mes visible
  month: firstOfMonth(new Date()),
  tab: 'home',
  filter: { kind: 'all', cat: null, q: '' },
};

// ─────────────────────────── utilidades ───────────────────────────
function firstOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function monthKey(d) { return ymd(d).slice(0, 7); }
function lastOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function nowHHMM() { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; }
function isCurrentMonth(d) { return monthKey(d) === monthKey(new Date()); }

const numFmt = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numFmt0 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
function money(n, compact) { return 'S/ ' + (compact ? numFmt0 : numFmt).format(Math.abs(n)); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function parseAmount(raw) {
  let s = String(raw || '').replace(/[^\d.,]/g, '');
  const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    // Con ambos signos, el último es el decimal y el otro separa miles: 1,234.50 o 1.234,50
    const dec = lastDot > lastComma ? '.' : ',';
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const parts = s.split(sep);
    const last = parts[parts.length - 1];
    // Varias veces el mismo signo, o exactamente 3 dígitos después (1,234 / 2.500), es separador de miles.
    const thousands = parts.length > 2 || (last.length === 3 && parts[0] !== '' && parts[0] !== '0');
    s = thousands ? parts.join('') : parts.join('.');
  }
  const n = Math.round(parseFloat(s) * 100) / 100;
  return Number.isFinite(n) ? n : NaN;
}

function dateLabel(str) {
  const d = new Date(str + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function friendlyError(err) {
  const m = (err && (err.message || err.error_description)) || String(err);
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered|already exists/i.test(m)) return 'Ese correo ya tiene una cuenta. Ingresa con tu contraseña.';
  if (/Email not confirmed/i.test(m)) return 'Primero confirma tu correo con el enlace que te enviamos.';
  if (/at least 6|Password should/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  if (/valid email|invalid format/i.test(m)) return 'Ese correo no parece válido.';
  return 'Algo salió mal: ' + m;
}

// ─────────────────────────── aviso (toast) ───────────────────────────
let toastTimer;
function toast(msg, action) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = action.label;
    b.addEventListener('click', () => { hideToast(); action.run(); });
    t.appendChild(b);
  }
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 5000 : 2800);
}
function hideToast() {
  const t = $('toast');
  t.classList.remove('show');
  setTimeout(() => { t.hidden = true; }, 260);
}

// ─────────────────────────── hojas ───────────────────────────
let openSheetEl = null, sheetReturnFocus = null;
function openSheet(el, focusEl) {
  if (openSheetEl && openSheetEl !== el) closeSheet(true);
  sheetReturnFocus = sheetReturnFocus || document.activeElement;
  openSheetEl = el;
  $('app').inert = true;
  $('scrim').hidden = false; el.hidden = false;
  requestAnimationFrame(() => { $('scrim').classList.add('open'); el.classList.add('open'); });
  if (focusEl) focusEl.focus({ preventScroll: true });
}
function closeSheet(swap) {
  const el = openSheetEl;
  if (!el) return;
  openSheetEl = null;
  el.classList.remove('open');
  if (!swap) { $('scrim').classList.remove('open'); $('app').inert = false; }
  setTimeout(() => {
    el.hidden = true;
    if (!openSheetEl) $('scrim').hidden = true;
  }, 300);
  if (!swap && sheetReturnFocus) { sheetReturnFocus.focus?.({ preventScroll: true }); sheetReturnFocus = null; }
}
$('scrim').addEventListener('click', () => closeSheet());
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeSheet()));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openSheetEl) closeSheet(); });

// ─────────────────────────── pantallas ───────────────────────────
function show(screen) {
  $('boot').hidden = true;
  $('authScreen').hidden = screen !== 'auth';
  $('recoveryScreen').hidden = screen !== 'recovery';
  $('app').hidden = screen !== 'app';
}

// ─────────────────────────── acceso ───────────────────────────
let authMode = 'login';
function setAuthMode(mode) {
  authMode = mode;
  $('tabLogin').setAttribute('aria-selected', String(mode === 'login'));
  $('tabSignup').setAttribute('aria-selected', String(mode === 'signup'));
  $('nameField').hidden = mode !== 'signup';
  $('passField').hidden = mode === 'forgot';
  $('forgotBtn').textContent = mode === 'forgot' ? 'Volver a ingresar' : '¿Olvidaste tu contraseña?';
  $('forgotBtn').hidden = mode === 'signup';
  $('authPass').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  $('authSubmit').textContent = { login: 'Ingresar', signup: 'Crear cuenta', forgot: 'Enviarme un enlace' }[mode];
  authMsg('');
}
function authMsg(text, ok) {
  const el = $('authMsg');
  el.hidden = !text; el.textContent = text || ''; el.classList.toggle('ok', !!ok);
}
$('tabLogin').addEventListener('click', () => setAuthMode('login'));
$('tabSignup').addEventListener('click', () => setAuthMode('signup'));
$('forgotBtn').addEventListener('click', () => setAuthMode(authMode === 'forgot' ? 'login' : 'forgot'));
$('demoNote').hidden = !DEMO;

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('authEmail').value.trim();
  const pass = $('authPass').value;
  const name = $('authName').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return authMsg('Escribe un correo válido.');
  if (authMode !== 'forgot' && pass.length < 6) return authMsg('La contraseña debe tener al menos 6 caracteres.');
  if (authMode === 'signup' && !name) return authMsg('Cuéntanos tu nombre.');

  const btn = $('authSubmit'); btn.disabled = true;
  try {
    if (authMode === 'login') {
      await store.signIn(email, pass);
    } else if (authMode === 'signup') {
      const { needsConfirmation } = await store.signUp(email, pass, name);
      if (needsConfirmation) authMsg(`Listo. Te enviamos un correo a ${email}: ábrelo para activar tu cuenta y luego ingresa.`, true);
    } else {
      await store.resetPassword(email);
      authMsg('Si el correo tiene cuenta, te llegará un enlace para crear una contraseña nueva.', true);
    }
  } catch (err) {
    authMsg(friendlyError(err));
  } finally {
    btn.disabled = false;
  }
});

$('recoveryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pass = $('newPass').value;
  const msg = $('recoveryMsg');
  if (pass.length < 6) { msg.hidden = false; msg.textContent = 'Mínimo 6 caracteres.'; return; }
  try {
    await store.updatePassword(pass);
    window.__LIBRETA_RECOVERY = false;
    history.replaceState(null, '', location.pathname);
    const user = await store.getUser();
    if (user) boot(user); else show('auth');
    toast('Contraseña actualizada.');
  } catch (err) { msg.hidden = false; msg.textContent = friendlyError(err); }
});

// ─────────────────────────── datos ───────────────────────────
const catById = (id) => state.categories.find(c => c.id === id);
const monthTxns = () => state.txns.filter(t => t.occurred_on.startsWith(monthKey(state.month)));

async function loadTxns() {
  const from = ymd(addMonths(state.month, -5));
  const to = ymd(lastOfMonth(state.month));
  const list = await store.listTransactions(from, to);
  // Más reciente primero: por fecha, luego por hora del movimiento.
  state.txns = list.sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)
    || String(b.occurred_at || '').localeCompare(String(a.occurred_at || ''))
    || String(b.created_at).localeCompare(String(a.created_at)));
}

let bootedId = null;
async function boot(user) {
  if (bootedId === user.id) return;
  bootedId = user.id;
  state.user = user;
  try {
    const [profile, categories] = await Promise.all([store.getProfile(), store.listCategories()]);
    state.profile = profile; state.categories = categories;
    await loadTxns();
  } catch (err) {
    bootedId = null;
    show('auth'); authMsg(friendlyError(err)); return;
  }
  show('app');
  switchTab('home', false);
  renderAll();
}

// ─────────────────────────── render ───────────────────────────
function renderAll() {
  renderMonthNav();
  renderHome();
  renderTxnList();
  renderStats();
  renderProfile();
}

function renderMonthNav() {
  const m = state.month;
  $('monthLabel').textContent = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
  $('nextMonth').disabled = isCurrentMonth(m);
  $('nextMonth').style.visibility = isCurrentMonth(m) ? 'hidden' : 'visible';
  $('monthNav').hidden = state.tab === 'profile';
}

function totals(list) {
  let income = 0, expense = 0;
  list.forEach(t => { if (t.kind === 'income') income += +t.amount; else expense += +t.amount; });
  return { income, expense, balance: income - expense };
}

function expenseByCategory(list) {
  const map = new Map();
  list.filter(t => t.kind === 'expense').forEach(t => {
    const key = t.category_id || 'none';
    map.set(key, (map.get(key) || 0) + +t.amount);
  });
  return [...map.entries()].map(([id, amount]) => {
    const c = catById(id) || { name: 'Sin categoría', color: '#8E8E93', icon: 'wallet' };
    return { id, name: c.name, color: c.color, icon: c.icon, amount };
  }).sort((a, b) => b.amount - a.amount);
}

function txnRow(t) {
  const c = catById(t.category_id);
  const color = c ? c.color : (t.kind === 'income' ? '#34C759' : '#8E8E93');
  const icon = c ? c.icon : (t.kind === 'income' ? 'arrowUp' : 'wallet');
  const meta = [c ? c.name : (t.kind === 'income' ? 'Ingreso' : 'Sin categoría'), t.occurred_at ? String(t.occurred_at).slice(0, 5) : '', t.note]
    .filter(Boolean).map(esc).join(' · ');
  const sign = t.kind === 'income' ? '+' : '−';
  return `<li><button type="button" class="txn" data-id="${esc(t.id)}">
    <span class="txn-icon" style="--c:${esc(color)}">${iconSvg(icon)}</span>
    <span class="txn-main"><span class="txn-merchant">${esc(t.merchant)}</span><span class="txn-meta">${meta}</span></span>
    <span class="txn-amount ${t.kind === 'income' ? 'is-income' : ''}">${sign} ${money(t.amount)}</span>
  </button></li>`;
}

function groupedHtml(list, withDayTotal) {
  const groups = [];
  list.forEach(t => {
    const last = groups[groups.length - 1];
    if (last && last.date === t.occurred_on) last.items.push(t);
    else groups.push({ date: t.occurred_on, items: [t] });
  });
  return groups.map(g => {
    const spent = g.items.filter(t => t.kind === 'expense').reduce((s, t) => s + +t.amount, 0);
    const right = withDayTotal && spent ? `<span>− ${money(spent)}</span>` : '';
    return `<li class="txn-group"><h3 class="txn-date"><span>${dateLabel(g.date)}</span>${right}</h3>
      <ul class="txn-list">${g.items.map(txnRow).join('')}</ul></li>`;
  }).join('');
}

function emptyHtml(text) {
  return `<li class="empty"><span class="icon">${iconSvg('wallet')}</span>${esc(text)}</li>`;
}

function renderHome() {
  const list = monthTxns();
  const { income, expense, balance } = totals(list);
  $('balanceAmount').textContent = (balance < 0 ? '− ' : '') + money(balance);
  $('balanceAmount').classList.toggle('neg', balance < 0);
  $('incomeAmount').textContent = money(income);
  $('expenseAmount').textContent = money(expense);

  // Presupuesto
  const budget = +state.profile.monthly_budget || 0;
  const fill = $('budgetFill');
  if (!budget) {
    $('budgetOf').textContent = '';
    fill.style.width = '0%';
    $('budgetNote').textContent = 'Toca para definir cuánto quieres gastar al mes.';
  } else {
    const pct = expense / budget * 100;
    fill.style.width = Math.min(pct, 100) + '%';
    fill.classList.toggle('warn', pct >= 75 && pct < 100);
    fill.classList.toggle('over', pct >= 100);
    $('budgetOf').textContent = `${money(expense, true)} de ${money(budget, true)}`;
    const left = budget - expense;
    if (left < 0) {
      $('budgetNote').textContent = `Te pasaste por ${money(left)} este mes.`;
    } else if (isCurrentMonth(state.month)) {
      const daysLeft = lastOfMonth(state.month).getDate() - new Date().getDate() + 1;
      $('budgetNote').textContent = `Te quedan ${money(left)} · ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} (${money(left / daysLeft)} por día).`;
    } else {
      $('budgetNote').textContent = `Usaste el ${Math.round(pct)}% del presupuesto.`;
    }
  }

  // Dona por categoría
  const cats = expenseByCategory(list);
  let acc = 0;
  const stops = cats.map(c => { const s = acc; acc += c.amount / expense * 100; return `${c.color} ${s}% ${acc}%`; });
  $('donutRing').style.background = expense ? `conic-gradient(${stops.join(',')})` : '';
  $('donutTotal').textContent = money(expense, true);
  const top = cats.slice(0, 5);
  const rest = cats.slice(5).reduce((s, c) => s + c.amount, 0);
  if (rest) top.push({ name: 'Otras', color: '#8E8E93', amount: rest });
  $('legendList').innerHTML = top.length
    ? top.map(c => `<li class="legend-row"><span class="legend-dot" style="background:${esc(c.color)}"></span>
        <span class="legend-label">${esc(c.name)}</span>
        <span class="legend-amount">${money(c.amount, true)}<span class="legend-pct">${Math.round(c.amount / expense * 100)}%</span></span></li>`).join('')
    : '<li class="muted small">Aún no hay gastos este mes.</li>';

  $('recentList').innerHTML = list.length ? groupedHtml(list.slice(0, 6), false) : emptyHtml('Sin movimientos este mes. Toca + para registrar el primero.');
}

function renderCatFilter() {
  const kind = state.filter.kind;
  const cats = state.categories.filter(c => !c.archived && (kind === 'all' || c.kind === kind));
  if (state.filter.cat && !cats.some(c => c.id === state.filter.cat)) state.filter.cat = null;
  $('catFilter').innerHTML = `<button type="button" class="chip" data-cat="" aria-pressed="${!state.filter.cat}">Todas</button>` +
    cats.map(c => `<button type="button" class="chip" data-cat="${esc(c.id)}" aria-pressed="${state.filter.cat === c.id}">
      <span class="legend-dot" style="background:${esc(c.color)}"></span>${esc(c.name)}</button>`).join('');
}

function renderTxnList() {
  renderCatFilter();
  const { kind, cat, q } = state.filter;
  const needle = q.trim().toLowerCase();
  const list = monthTxns().filter(t =>
    (kind === 'all' || t.kind === kind) &&
    (!cat || t.category_id === cat) &&
    (!needle || `${t.merchant} ${t.note || ''}`.toLowerCase().includes(needle)));
  $('txnList').innerHTML = list.length ? groupedHtml(list, true)
    : emptyHtml(monthTxns().length ? 'Nada coincide con el filtro.' : 'Sin movimientos este mes.');
}

function renderStats() {
  const list = monthTxns();
  const { income, expense } = totals(list);
  $('kpiSaving').textContent = income ? `${Math.round((income - expense) / income * 100)}%` : '—';
  const days = isCurrentMonth(state.month) ? new Date().getDate() : lastOfMonth(state.month).getDate();
  $('kpiDaily').textContent = expense ? money(expense / days, true) : '—';

  // Tendencia 6 meses
  const months = Array.from({ length: 6 }, (_, i) => addMonths(state.month, i - 5));
  const values = months.map(m => state.txns.filter(t => t.kind === 'expense' && t.occurred_on.startsWith(monthKey(m)))
    .reduce((s, t) => s + +t.amount, 0));
  const max = Math.max(...values) || 1;
  $('trendChart').innerHTML = values.map((v, i) => `<div class="trend-col">
      <span class="trend-val">${v ? numFmt0.format(v) : ''}</span>
      <div class="trend-bar${i === 5 ? ' is-current' : ''}" style="height:${Math.round(v / max * 78)}%"></div>
      <span class="trend-label">${MONTHS_SHORT[months[i].getMonth()]}</span></div>`).join('');
  const prev = values.slice(0, 5).filter(Boolean);
  const avg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
  $('trendNote').textContent = avg
    ? `Promedio de meses anteriores: ${money(avg, true)}. Este mes vas ${expense > avg ? 'por encima' : 'por debajo'} (${money(expense - avg, true)} ${expense > avg ? 'más' : 'menos'}).`
    : 'Cuando tengas más meses registrados verás la comparación aquí.';

  const cats = expenseByCategory(list);
  $('statsCategoryList').innerHTML = cats.length ? cats.map(c => {
    const pct = Math.round(c.amount / expense * 100);
    return `<li><button type="button" class="stat-cat-row" data-cat="${esc(c.id)}">
      <span class="stat-cat-top"><span class="legend-dot" style="background:${esc(c.color)}"></span>
        <span class="stat-cat-label">${esc(c.name)}</span><span class="muted small">${pct}%</span>
        <span class="stat-cat-amount">${money(c.amount)}</span></span>
      <span class="stat-bar-track"><span class="stat-bar-fill" style="display:block;width:${pct}%;background:${esc(c.color)}"></span></span>
    </button></li>`;
  }).join('') : '<li class="muted small">Aún no hay gastos este mes.</li>';
}

function renderProfile() {
  const p = state.profile;
  if (state.tab === 'home' && p.full_name) $('screenTitle').textContent = `Hola, ${p.full_name.split(' ')[0]}`;
  const name = p.full_name || state.user.email;
  $('avatarLg').textContent = initials(name);
  $('profileName').textContent = name;
  $('profileEmail').textContent = state.user.email + (DEMO ? ' · demo' : '');
  $('planBadge').textContent = p.plan === 'premium' ? 'Premium' : 'Gratis';
  $('nameValue').textContent = p.full_name || '';
  $('budgetValue').textContent = +p.monthly_budget ? money(p.monthly_budget) : 'Sin definir';
  $('catsCount').textContent = String(state.categories.filter(c => !c.archived).length);
}

// ─────────────────────────── pestañas y mes ───────────────────────────
function switchTab(tab, focus = true) {
  state.tab = tab;
  Object.keys(TITLES).forEach(k => { $('tab-' + k).hidden = k !== tab; });
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    const icon = b.querySelector('[data-icon]');
    const base = { home: 'home', txns: 'list', stats: 'chart', profile: 'user' }[b.dataset.tab];
    icon.dataset.icon = on ? base + 'Fill' : base;
    icon.innerHTML = iconSvg(icon.dataset.icon);
  });
  $('screenTitle').textContent = tab === 'home' && state.profile?.full_name
    ? `Hola, ${state.profile.full_name.split(' ')[0]}` : TITLES[tab];
  renderMonthNav();
  window.scrollTo({ top: 0 });
  if (focus) $('screenTitle').focus({ preventScroll: true });
}
document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.goto)));

async function changeMonth(delta) {
  const next = addMonths(state.month, delta);
  if (next > firstOfMonth(new Date())) return;
  const prev = state.month;
  state.month = next;
  renderMonthNav();
  try { await loadTxns(); } catch (err) {
    // Si no cargó, se vuelve al mes anterior para no mostrar sus datos bajo el mes nuevo.
    state.month = prev;
    renderMonthNav();
    toast(friendlyError(err));
    return;
  }
  renderAll();
}
$('prevMonth').addEventListener('click', () => changeMonth(-1));
$('nextMonth').addEventListener('click', () => changeMonth(1));

// Filtros de Movimientos
$('searchInput').addEventListener('input', e => { state.filter.q = e.target.value; renderTxnList(); });
document.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => {
  state.filter.kind = b.dataset.kind;
  document.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderTxnList();
}));
$('catFilter').addEventListener('click', e => {
  const chip = e.target.closest('[data-cat]');
  if (!chip) return;
  state.filter.cat = chip.dataset.cat || null;
  renderTxnList();
});
$('statsCategoryList').addEventListener('click', e => {
  const row = e.target.closest('[data-cat]');
  if (!row || row.dataset.cat === 'none') return;
  state.filter = { kind: 'expense', cat: row.dataset.cat, q: '' };
  $('searchInput').value = '';
  document.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.kind === 'expense')));
  renderTxnList();
  switchTab('txns');
});

// Tocar un movimiento abre la edición
document.addEventListener('click', e => {
  const row = e.target.closest('.txn[data-id]');
  if (!row) return;
  const t = state.txns.find(x => x.id === row.dataset.id);
  if (t) openTxnSheet(t);
});

// ─────────────────────────── alta / edición de movimiento ───────────────────────────
let editing = null, txKind = 'expense', txCat = null;

function renderCatGrid() {
  const cats = state.categories.filter(c => c.kind === txKind && (!c.archived || c.id === txCat));
  if (!cats.some(c => c.id === txCat)) txCat = cats[0]?.id ?? null;
  $('catGrid').innerHTML = cats.map(c => `<button type="button" class="cat-opt" role="radio" data-id="${esc(c.id)}" aria-checked="${c.id === txCat}">
    <span class="chip-icon" style="--c:${esc(c.color)}">${iconSvg(c.icon)}</span>${esc(c.name)}</button>`).join('');
}
$('catGrid').addEventListener('click', e => {
  const b = e.target.closest('.cat-opt'); if (!b) return;
  txCat = b.dataset.id;
  $('catGrid').querySelectorAll('.cat-opt').forEach(x => x.setAttribute('aria-checked', String(x === b)));
});
function setTxKind(kind) {
  txKind = kind;
  document.querySelectorAll('[data-txkind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.txkind === kind)));
  $('merchantInput').placeholder = kind === 'income' ? 'Ej. Sueldo de septiembre' : 'Ej. Mercado San Camilo';
  renderCatGrid();
}
document.querySelectorAll('[data-txkind]').forEach(b => b.addEventListener('click', () => { txCat = null; setTxKind(b.dataset.txkind); }));

function fieldError(inputId, errId, msg) {
  const el = $(errId); el.hidden = !msg; el.textContent = msg || '';
  if (msg) $(inputId).setAttribute('aria-invalid', 'true'); else $(inputId).removeAttribute('aria-invalid');
}

function openTxnSheet(t) {
  editing = t || null;
  fieldError('amountInput', 'errAmount'); fieldError('merchantInput', 'errMerchant');
  $('txnSheetTitle').textContent = t ? 'Editar movimiento' : 'Nuevo movimiento';
  $('txnSubmit').textContent = t ? 'Guardar cambios' : 'Guardar';
  $('txnDelete').hidden = !t;
  $('txnDelete').classList.remove('confirm');
  $('txnDelete').textContent = 'Eliminar movimiento';
  txCat = t ? t.category_id : null;
  setTxKind(t ? t.kind : 'expense');
  $('amountInput').value = t ? (+t.amount).toFixed(2) : '';
  $('merchantInput').value = t ? t.merchant : '';
  $('noteInput').value = t ? (t.note || '') : '';
  // Por defecto, hoy si se mira el mes actual; si no, el último día del mes visible.
  const defDate = isCurrentMonth(state.month) ? ymd(new Date()) : ymd(lastOfMonth(state.month));
  $('dateInput').value = t ? t.occurred_on : defDate;
  $('timeInput').value = t ? String(t.occurred_at || '').slice(0, 5) : nowHHMM();
  openSheet($('txnSheet'), t ? null : $('amountInput'));
}
$('fabAdd').addEventListener('click', () => openTxnSheet(null));

$('txnForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseAmount($('amountInput').value);
  const merchant = $('merchantInput').value.trim();
  let bad = null;
  if (!(amount > 0)) { fieldError('amountInput', 'errAmount', 'Ingresa un monto mayor a 0.'); bad = bad || $('amountInput'); }
  else fieldError('amountInput', 'errAmount');
  if (!merchant) { fieldError('merchantInput', 'errMerchant', txKind === 'income' ? '¿De dónde vino el ingreso?' : '¿En qué gastaste?'); bad = bad || $('merchantInput'); }
  else fieldError('merchantInput', 'errMerchant');
  if (bad) { bad.focus(); return; }

  const row = {
    kind: txKind, amount, merchant, category_id: txCat,
    note: $('noteInput').value.trim() || null,
    occurred_on: $('dateInput').value || ymd(new Date()),
    occurred_at: $('timeInput').value || null,
  };
  if (editing) row.id = editing.id;

  const btn = $('txnSubmit'); btn.disabled = true;
  try {
    await store.saveTransaction(row);
    await loadTxns();
    renderAll();
    closeSheet();
    const d = new Date(row.occurred_on + 'T00:00:00');
    const inView = monthKey(d) === monthKey(state.month);
    toast(editing ? 'Cambios guardados.' : inView
      ? (txKind === 'income' ? 'Ingreso registrado.' : 'Gasto registrado.')
      : `Guardado en ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`);
  } catch (err) {
    toast(friendlyError(err));
  } finally { btn.disabled = false; }
});

$('txnDelete').addEventListener('click', async () => {
  const b = $('txnDelete');
  if (!b.classList.contains('confirm')) {
    b.classList.add('confirm'); b.textContent = 'Toca otra vez para eliminar';
    setTimeout(() => { b.classList.remove('confirm'); b.textContent = 'Eliminar movimiento'; }, 3500);
    return;
  }
  const t = editing;
  try {
    await store.deleteTransaction(t.id);
    await loadTxns(); renderAll(); closeSheet();
    const { id, created_at, updated_at, user_id, ...rest } = t;
    toast('Movimiento eliminado.', {
      label: 'Deshacer',
      run: async () => { try { await store.saveTransaction(rest); await loadTxns(); renderAll(); } catch (err) { toast(friendlyError(err)); } },
    });
  } catch (err) { toast(friendlyError(err)); }
});

// ─────────────────────────── perfil: nombre y presupuesto ───────────────────────────
let valueTarget = null;
function openValueSheet(target) {
  valueTarget = target;
  const p = state.profile;
  const input = $('valueInput');
  fieldError('valueInput', 'errValue');
  if (target === 'budget') {
    $('valueSheetTitle').textContent = 'Presupuesto mensual';
    $('valueLabel').textContent = 'Cuánto quieres gastar como máximo al mes (S/)';
    input.inputMode = 'decimal'; input.placeholder = '2800.00';
    input.value = +p.monthly_budget ? (+p.monthly_budget).toFixed(2) : '';
  } else {
    $('valueSheetTitle').textContent = 'Tu nombre';
    $('valueLabel').textContent = 'Nombre';
    input.inputMode = 'text'; input.placeholder = 'Tu nombre';
    input.value = p.full_name || '';
  }
  openSheet($('valueSheet'), input);
}
$('budgetBtn').addEventListener('click', () => openValueSheet('budget'));
$('budgetCard').addEventListener('click', () => openValueSheet('budget'));
$('editNameBtn').addEventListener('click', () => openValueSheet('name'));
$('valueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = $('valueInput').value;
  let patch;
  if (valueTarget === 'budget') {
    const n = raw.trim() === '' ? 0 : parseAmount(raw);
    if (!(n >= 0)) return fieldError('valueInput', 'errValue', 'Escribe un monto válido (o déjalo vacío para quitarlo).');
    patch = { monthly_budget: n };
  } else {
    if (!raw.trim()) return fieldError('valueInput', 'errValue', 'Escribe tu nombre.');
    patch = { full_name: raw.trim() };
  }
  try {
    state.profile = await store.updateProfile(patch);
    renderAll(); closeSheet(); toast('Guardado.');
  } catch (err) { fieldError('valueInput', 'errValue', friendlyError(err)); }
});

// ─────────────────────────── categorías ───────────────────────────
let catKind = 'expense', catEditing = null, catColor = CATEGORY_COLORS[0], catIcon = CATEGORY_ICONS[0];

function renderCatManage() {
  document.querySelectorAll('[data-catkind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.catkind === catKind)));
  const cats = state.categories.filter(c => c.kind === catKind).sort((a, b) => (a.archived - b.archived) || (a.sort - b.sort));
  $('catManageList').innerHTML = cats.map(c => `<li><button type="button" class="settings-row-btn${c.archived ? ' is-archived' : ''}" data-editcat="${esc(c.id)}">
    <span class="chip-icon" style="--c:${esc(c.color)}">${iconSvg(c.icon)}</span>
    <span class="cat-name">${esc(c.name)}${c.archived ? ' <span class="muted small">(oculta)</span>' : ''}</span>
    <span class="settings-right"><span class="icon">${iconSvg('chevronRight')}</span></span></button></li>`).join('');
}
function openCatsSheet() { renderCatManage(); openSheet($('catsSheet')); }
$('catsBtn').addEventListener('click', openCatsSheet);
document.querySelectorAll('[data-catkind]').forEach(b => b.addEventListener('click', () => { catKind = b.dataset.catkind; renderCatManage(); }));
$('catManageList').addEventListener('click', e => {
  const b = e.target.closest('[data-editcat]'); if (!b) return;
  openCatEdit(state.categories.find(c => c.id === b.dataset.editcat));
});
$('newCatBtn').addEventListener('click', () => openCatEdit(null));

function renderCatPickers() {
  $('catPreview').style.setProperty('--c', catColor);
  $('catPreview').innerHTML = iconSvg(catIcon);
  $('colorPicker').innerHTML = CATEGORY_COLORS.map(c => `<button type="button" class="swatch" role="radio" style="--c:${c}" data-color="${c}" aria-checked="${c === catColor}" aria-label="Color ${c}"></button>`).join('');
  $('iconPicker').innerHTML = CATEGORY_ICONS.map(i => `<button type="button" class="swatch" role="radio" data-iconpick="${i}" aria-checked="${i === catIcon}" aria-label="Ícono ${i}">${iconSvg(i)}</button>`).join('');
}
$('colorPicker').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (b) { catColor = b.dataset.color; renderCatPickers(); } });
$('iconPicker').addEventListener('click', e => { const b = e.target.closest('[data-iconpick]'); if (b) { catIcon = b.dataset.iconpick; renderCatPickers(); } });

function openCatEdit(c) {
  catEditing = c;
  $('catEditTitle').textContent = c ? 'Editar categoría' : `Nueva categoría de ${catKind === 'income' ? 'ingreso' : 'gasto'}`;
  $('catName').value = c ? c.name : '';
  catColor = c ? c.color : CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
  catIcon = c ? c.icon : 'wallet';
  $('catArchived').checked = !!(c && c.archived);
  $('archivedRow').hidden = !c;
  fieldError('catName', 'errCat');
  renderCatPickers();
  openSheet($('catEditSheet'), c ? null : $('catName'));
}
$('catForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('catName').value.trim();
  if (!name) return fieldError('catName', 'errCat', 'Ponle un nombre.');
  const dup = state.categories.some(c => c.kind === catKind && c.name.toLowerCase() === name.toLowerCase() && c.id !== catEditing?.id);
  if (dup) return fieldError('catName', 'errCat', 'Ya tienes una categoría con ese nombre.');
  const row = { name, color: catColor, icon: catIcon, archived: $('catArchived').checked };
  if (catEditing) row.id = catEditing.id;
  else { row.kind = catKind; row.sort = state.categories.filter(c => c.kind === catKind).length + 1; }
  try {
    await store.saveCategory(row);
    state.categories = await store.listCategories();
    renderAll();
    openCatsSheet();
    toast(catEditing ? 'Categoría actualizada.' : 'Categoría creada.');
  } catch (err) { fieldError('catName', 'errCat', friendlyError(err)); }
});

// ─────────────────────────── apariencia ───────────────────────────
function applyAppearance(v) {
  if (v === 'light' || v === 'dark') document.documentElement.dataset.theme = v;
  else delete document.documentElement.dataset.theme;
  document.querySelectorAll('[data-appearance]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.appearance === v)));
  try { localStorage.setItem('libreta-appearance', v); } catch (e) {}
}
let savedAppearance = 'auto';
try { savedAppearance = localStorage.getItem('libreta-appearance') || 'auto'; } catch (e) {}
applyAppearance(savedAppearance);
document.querySelectorAll('[data-appearance]').forEach(b => b.addEventListener('click', () => applyAppearance(b.dataset.appearance)));

// ─────────────────────────── exportar a Excel ───────────────────────────
async function exportExcel(all) {
  toast('Preparando archivo…');
  try {
    const list = all ? await store.listTransactions('1900-01-01', '2999-12-31') : monthTxns();
    if (!list.length) return toast('No hay movimientos para exportar.');
    const rows = list.map(t => ({
      Fecha: t.occurred_on,
      Hora: t.occurred_at ? String(t.occurred_at).slice(0, 5) : '',
      Tipo: t.kind === 'income' ? 'Ingreso' : 'Gasto',
      Categoría: catById(t.category_id)?.name || '',
      Descripción: t.merchant,
      Nota: t.note || '',
      'Monto (S/)': (t.kind === 'income' ? 1 : -1) * +t.amount,
    }));
    const name = all ? 'solito-todo' : `solito-${monthKey(state.month)}`;
    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 11 }, { wch: 6 }, { wch: 8 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
      XLSX.writeFile(wb, name + '.xlsx');
    } catch (libErr) {
      // Sin la librería (p. ej. sin conexión), se exporta CSV que Excel también abre.
      const head = Object.keys(rows[0]);
      const csv = [head, ...rows.map(r => head.map(h => r[h]))]
        .map(line => line.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = name + '.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  } catch (err) { toast(friendlyError(err)); }
}
$('exportMonthBtn').addEventListener('click', () => exportExcel(false));
$('exportAllBtn').addEventListener('click', () => exportExcel(true));

// ─────────────────────────── sesión ───────────────────────────
$('logoutBtn').addEventListener('click', async () => {
  await store.signOut();
  state.user = null; bootedId = null;
  show('auth'); setAuthMode('login');
});

// Supabase recomienda no llamar a la base dentro de este callback: se difiere con setTimeout.
store.onAuthChange((event, user) => setTimeout(() => {
  if (event === 'PASSWORD_RECOVERY') { show('recovery'); return; }
  if (window.__LIBRETA_RECOVERY) return;
  if (user) boot(user);
  else if (event === 'SIGNED_OUT') { state.user = null; bootedId = null; show('auth'); }
}, 0));

paintIcons();
setAuthMode('login');
if (window.__LIBRETA_RECOVERY) {
  show('recovery');
} else {
  const user = await store.getUser();
  if (user) boot(user); else show('auth');
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
