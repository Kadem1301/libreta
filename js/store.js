// Capa de datos: la misma interfaz sirve para Supabase y para el modo demo local.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const DEMO = !(SUPABASE_URL && SUPABASE_ANON_KEY);

const DEFAULT_CATS = [
  ['expense', 'Alimentación', 'food', '#FF9500'],
  ['expense', 'Transporte', 'transport', '#007AFF'],
  ['expense', 'Vivienda', 'house', '#AF52DE'],
  ['expense', 'Entretenimiento', 'fun', '#FF2D55'],
  ['expense', 'Salud', 'health', '#30B0C7'],
  ['expense', 'Compras', 'shopping', '#FFCC00'],
  ['expense', 'Servicios', 'services', '#5856D6'],
  ['expense', 'Otros', 'wallet', '#8E8E93'],
  ['income', 'Sueldo', 'briefcase', '#34C759'],
  ['income', 'Freelance', 'spark', '#30D158'],
  ['income', 'Otros ingresos', 'arrowUp', '#00C7BE'],
];

// ───────────────────────── Supabase ─────────────────────────
async function supabaseStore() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const ok = ({ data, error }) => { if (error) throw error; return data; };

  return {
    async getUser() { return (await sb.auth.getSession()).data.session?.user ?? null; },
    onAuthChange(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, session?.user ?? null)); },
    async signUp(email, password, fullName) {
      const res = ok(await sb.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: location.origin + location.pathname },
      }));
      return { needsConfirmation: !res.session };
    },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async resetPassword(email) {
      ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async updatePassword(password) { ok(await sb.auth.updateUser({ password })); },
    async signOut() { await sb.auth.signOut(); },

    async getProfile() { return ok(await sb.from('profiles').select('*').single()); },
    async updateProfile(patch) {
      const user = await this.getUser();
      return ok(await sb.from('profiles').update(patch).eq('id', user.id).select().single());
    },

    async listCategories() { return ok(await sb.from('categories').select('*').order('kind').order('sort')); },
    async saveCategory(c) {
      const { id, ...fields } = c;
      return id
        ? ok(await sb.from('categories').update(fields).eq('id', id).select().single())
        : ok(await sb.from('categories').insert(fields).select().single());
    },

    // Movimientos entre dos fechas (inclusive), más recientes primero.
    async listTransactions(from, to) {
      return ok(await sb.from('transactions').select('*')
        .gte('occurred_on', from).lte('occurred_on', to)
        .order('occurred_on', { ascending: false }).order('created_at', { ascending: false }));
    },
    async saveTransaction(t) {
      const { id, ...fields } = t;
      return id
        ? ok(await sb.from('transactions').update(fields).eq('id', id).select().single())
        : ok(await sb.from('transactions').insert(fields).select().single());
    },
    async deleteTransaction(id) { ok(await sb.from('transactions').delete().eq('id', id)); },
  };
}

// ───────────────────────── Demo local ─────────────────────────
function demoStore() {
  const KEY = 'libreta-demo-v2';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  let listeners = [];

  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return d; } catch (e) {}
    return null;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function seed(fullName, email) {
    const categories = DEFAULT_CATS.map(([kind, name, icon, color], i) => ({ id: uid(), kind, name, icon, color, sort: i, archived: false }));
    const byName = Object.fromEntries(categories.map(c => [c.name, c.id]));
    const today = new Date();
    const day = (offset) => {
      const d = new Date(today); d.setDate(d.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const sample = [
      [0, 'expense', 18.5, 'Alimentación', 'Café Altomayo', '08:05'],
      [0, 'expense', 22.9, 'Transporte', 'Uber', '08:40'],
      [1, 'expense', 145, 'Alimentación', 'Mercado San Camilo', '17:20'],
      [1, 'expense', 58, 'Entretenimiento', 'Cineplanet', '20:10'],
      [2, 'expense', 980, 'Vivienda', 'Alquiler', '09:00'],
      [3, 'expense', 120, 'Transporte', 'Grifo Primax', '18:45'],
      [4, 'expense', 42.3, 'Salud', 'Inkafarma', '12:15'],
      [5, 'expense', 189.9, 'Compras', 'Saga Falabella', '16:30'],
      [7, 'income', 400, 'Freelance', 'Diseño de logo', '14:00'],
      [7, 'expense', 44.9, 'Servicios', 'Netflix', '00:03'],
      [9, 'expense', 256.8, 'Alimentación', 'Wong', '11:00'],
      [12, 'expense', 75.2, 'Servicios', 'Claro', '09:30'],
      [15, 'income', 3800, 'Sueldo', 'Planilla', '08:00'],
      [33, 'expense', 1890, 'Vivienda', 'Alquiler y servicios', '09:00'],
      [36, 'income', 3800, 'Sueldo', 'Planilla', '08:00'],
      [40, 'expense', 610, 'Alimentación', 'Supermercado', '11:00'],
      [64, 'expense', 2150, 'Vivienda', 'Gastos del mes', '09:00'],
      [95, 'expense', 1980, 'Vivienda', 'Gastos del mes', '09:00'],
    ];
    const transactions = sample.map(([off, kind, amount, cat, merchant, time]) => ({
      id: uid(), kind, amount, category_id: byName[cat], merchant, note: '', occurred_on: day(off),
      occurred_at: time, source: 'manual', created_at: new Date().toISOString(),
    }));
    return {
      user: { id: 'demo', email },
      profile: { id: 'demo', full_name: fullName, currency: 'PEN', monthly_budget: 2800, plan: 'free' },
      categories, transactions, loggedIn: true,
    };
  }

  let db = load();
  const emit = (event) => listeners.forEach(cb => cb(event, db && db.loggedIn ? db.user : null));
  const need = () => { if (!db || !db.loggedIn) throw new Error('Sesión cerrada'); };

  return {
    async getUser() { return db && db.loggedIn ? db.user : null; },
    onAuthChange(cb) { listeners.push(cb); },
    async signUp(email, password, fullName) {
      db = seed(fullName || email.split('@')[0], email); save(db); emit('SIGNED_IN');
      return { needsConfirmation: false };
    },
    async signIn(email) {
      if (!db) db = seed(email.split('@')[0], email);
      db.loggedIn = true; save(db); emit('SIGNED_IN');
    },
    async resetPassword() {},
    async updatePassword() {},
    async signOut() { if (db) { db.loggedIn = false; save(db); } emit('SIGNED_OUT'); },

    async getProfile() { need(); return { ...db.profile }; },
    async updateProfile(patch) { need(); Object.assign(db.profile, patch); save(db); return { ...db.profile }; },

    async listCategories() { need(); return db.categories.map(c => ({ ...c })); },
    async saveCategory(c) {
      need();
      if (c.id) { const cur = db.categories.find(x => x.id === c.id); Object.assign(cur, c); save(db); return { ...cur }; }
      const row = { id: uid(), sort: db.categories.length, archived: false, ...c };
      db.categories.push(row); save(db); return { ...row };
    },

    async listTransactions(from, to) {
      need();
      return db.transactions
        .filter(t => t.occurred_on >= from && t.occurred_on <= to)
        .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.created_at.localeCompare(a.created_at))
        .map(t => ({ ...t }));
    },
    async saveTransaction(t) {
      need();
      if (t.id) { const cur = db.transactions.find(x => x.id === t.id); Object.assign(cur, t); save(db); return { ...cur }; }
      const row = { id: uid(), source: 'manual', created_at: new Date().toISOString(), ...t };
      db.transactions.push(row); save(db); return { ...row };
    },
    async deleteTransaction(id) { need(); db.transactions = db.transactions.filter(t => t.id !== id); save(db); },
  };
}

export const store = DEMO ? demoStore() : await supabaseStore();
