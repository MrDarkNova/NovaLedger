const KEY = 'novaledger-v4';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Money is stored in kobo (whole numbers), so 0.1 + 0.2 never goes wrong.
const nf = (k) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', currencyDisplay: 'narrowSymbol', minimumFractionDigits: k % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(k / 100);
const when = (t) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t);

const phone = (v) => (/^(\+?234|0)\d{10}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a Nigerian phone number, like 0803 123 4567.');
const digits = (w) => (v) => (/^\d{10,13}$/.test(v.replace(/\s/g, '')) ? '' : `Enter the 10 to 13 digit ${w} number.`);
const person = (v) => (v.trim().length >= 2 ? '' : 'Enter who you are sending to.');
const SERVICES = [
  { id: 'airtime', label: 'Airtime', hint: 'Any network', ref: 'Phone number', check: phone, presets: [100, 200, 500, 1000] },
  { id: 'data', label: 'Data', hint: 'SIM only', ref: 'Phone number', check: phone, presets: [500, 1000, 2000, 5000] },
  { id: 'cable', label: 'Cable TV', hint: 'DSTV / GOTV', ref: 'Decoder number', check: digits('decoder'), presets: [2000, 4500, 9000] },
  { id: 'power', label: 'Electricity', hint: 'Meter', ref: 'Meter number', check: digits('meter'), presets: [2000, 5000, 10000] },
  { id: 'send', label: 'Transfer', hint: 'Wallet to name', ref: 'Recipient name', check: person, presets: [1000, 5000, 10000] },
  { id: 'ajo', label: 'Ajo pot', hint: 'Save locally', presets: [1000, 5000, 10000] },
];
const FUND = { id: 'fund', label: 'Add demo funds', fund: true, presets: [1000, 5000, 20000] };

let S = { name: '', bal: 0, pot: 0, log: [] };
try {
  const old = JSON.parse(localStorage.getItem('novaledger-v3') || 'null'); // carry over name and balance from the old version
  S = { ...S, name: old?.name || '', bal: Math.round((old?.bal || 0) * 100), ...JSON.parse(localStorage.getItem(KEY) || 'null') };
} catch { /* start fresh */ }
if (!Array.isArray(S.log)) S.log = [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ } };
const say = (m) => { $('#live').textContent = m; };

function render() {
  $('#hi').textContent = S.name ? `Hi, ${S.name.trim().split(/\s+/)[0]}` : 'Hi';
  $('#avail').textContent = nf(S.bal);
  $('#pot').textContent = nf(S.pot);
  $('#log').innerHTML = S.log.slice(0, 12).map((l) =>
    `<li><div><b>${esc(l.title)}</b><small>${l.sub ? esc(l.sub) + ' · ' : ''}${when(l.ts)}</small></div><span class="${l.d > 0 ? 'pos' : ''}">${l.d > 0 ? '+' : '−'}${nf(Math.abs(l.d))}</span></li>`).join('')
    || '<li class="empty">No activity yet. Add demo funds or pay a bill and it shows up here.</li>';
}
function flash() { const a = $('#avail'); a.classList.remove('flash'); void a.offsetWidth; a.classList.add('flash'); }
$('#grid').innerHTML = SERVICES.map((s) => `<button class="tile" data-svc="${s.id}"><b>${s.label}</b><small>${s.hint}</small></button>`).join('');

function showApp() { $('#gate').hidden = true; $('#app').hidden = false; render(); }
$('#login').onsubmit = (e) => { e.preventDefault(); S.name = new FormData(e.target).get('name').trim(); save(); showApp(); $('#hi').focus(); };
$('#out').onclick = () => { $('#app').hidden = true; $('#gate').hidden = false; $('#login input').value = S.name; $('#login input').focus(); };

// ---- the sheet: form -> review -> receipt ----
const sheet = $('#sheet'), body = $('#sheetBody');
let d; // the draft payment
const open = (id) => { const s = id === 'fund' ? FUND : SERVICES.find((x) => x.id === id); d = { s, ref: '', amt: '', dir: 'in', err: {} }; form(); sheet.showModal(); };

function form() {
  const { s, ref, amt, dir, err } = d;
  const bad = (k) => (err[k] ? ` aria-invalid="true" aria-describedby="e-${k}"` : '');
  const msg = (k) => (err[k] ? `<span class="err" id="e-${k}" role="alert">${err[k]}</span>` : '');
  body.innerHTML = `<h2 id="sheetTitle">${s.id === 'ajo' ? 'Ajo pot' : s.label}</h2>
    <p class="muted">${s.id === 'ajo' ? `In the pot: ${nf(S.pot)}. Moves money between your wallet and the pot.` : s.fund ? 'Demo naira only. No real money is added.' : `Demo only. Takes money from your demo wallet.`}</p>
    <form id="f" novalidate>
      ${s.id === 'ajo' ? `<div class="seg" role="group" aria-label="Direction"><button type="button" aria-pressed="${dir === 'in'}" data-dir="in">Save to pot</button><button type="button" aria-pressed="${dir === 'out'}" data-dir="out">Take out</button></div>` : ''}
      ${s.ref ? `<label>${s.ref}<input name="ref" value="${esc(ref)}" autocomplete="off" inputmode="${s.check === person ? 'text' : 'numeric'}"${bad('ref')}>${msg('ref')}</label>` : ''}
      <label>Amount (₦)<input name="amt" type="number" inputmode="decimal" min="0" step="any" value="${esc(amt)}"${bad('amt')}>${msg('amt')}</label>
      <div class="presets">${s.presets.map((p) => `<button type="button" data-p="${p}">${nf(p * 100)}</button>`).join('')}</div>
      <div class="actions"><button class="primary" type="submit">Review</button><button class="ghost" type="button" data-close>Cancel</button></div>
    </form>`;
  (body.querySelector('[aria-invalid]') || body.querySelector('input'))?.focus();
}

function review() {
  const f = new FormData($('#f'));
  d.ref = (f.get('ref') || '').toString(); d.amt = f.get('amt').toString();
  const { s } = d, n = parseFloat(d.amt), k = Math.round(n * 100), min = s.fund ? 100 : 50;
  d.err = {};
  if (s.check && s.check(d.ref)) d.err.ref = s.check(d.ref);
  if (!(n > 0)) d.err.amt = 'Enter an amount.';
  else if (n < min) d.err.amt = `The minimum is ${nf(min * 100)}.`;
  else if (n > 1e7) d.err.amt = 'The most you can enter is ₦10,000,000.';
  else if (!s.fund && !(s.id === 'ajo' && d.dir === 'out') && k > S.bal) d.err.amt = `You have ${nf(S.bal)}. Add demo funds or enter less.`;
  else if (s.id === 'ajo' && d.dir === 'out' && k > S.pot) d.err.amt = `The pot has ${nf(S.pot)}.`;
  if (Object.keys(d.err).length) return form();
  d.k = k;
  const after = s.fund ? S.bal + k : s.id === 'ajo' && d.dir === 'out' ? S.bal + k : S.bal - k;
  const verb = s.fund ? 'Add' : s.id === 'ajo' ? (d.dir === 'in' ? 'Save' : 'Take out') : 'Pay';
  body.innerHTML = `<h2 id="sheetTitle" tabindex="-1">Check and confirm</h2><p class="muted">Nothing happens until you confirm.</p>
    <dl>${s.ref ? `<div><dt>${s.label}</dt><dd>${esc(d.ref.trim())}</dd></div>` : `<div><dt>Action</dt><dd>${s.fund ? 'Add demo funds' : d.dir === 'in' ? 'Save to Ajo pot' : 'Take out of Ajo pot'}</dd></div>`}
    <div><dt>Amount</dt><dd>${nf(k)}</dd></div><div><dt>Wallet after</dt><dd>${nf(after)}</dd></div></dl>
    <div class="actions"><button class="primary" id="ok" type="button">${verb} ${nf(k)} (simulated)</button><button class="ghost" type="button" data-back>Edit</button></div>`;
  $('#sheetTitle').focus();
}

function commit() {
  const { s, k, dir, ref } = d; let delta, title, sub = '';
  if (s.fund) { delta = k; title = 'Demo funds added'; S.bal += k; }
  else if (s.id === 'ajo') { if (dir === 'in') { delta = -k; title = 'Saved to Ajo pot'; S.bal -= k; S.pot += k; } else { delta = k; title = 'Taken out of Ajo pot'; S.pot -= k; S.bal += k; } }
  else { delta = -k; title = s.label; sub = ref.trim(); S.bal -= k; }
  const entry = { id: 'NL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), ts: Date.now(), title, sub, d: delta };
  S.log.unshift(entry); S.log.length = Math.min(S.log.length, 50);
  save(); render(); flash(); say(`${title}. Wallet balance ${nf(S.bal)}.`);
  body.innerHTML = `<h2 id="sheetTitle" tabindex="-1">${esc(title)}</h2><p class="muted">Simulated. No real money moved.</p>
    <dl>${sub ? `<div><dt>${esc(s.label)}</dt><dd>${esc(sub)}</dd></div>` : ''}<div><dt>Amount</dt><dd>${nf(k)}</dd></div><div><dt>Wallet now</dt><dd>${nf(S.bal)}</dd></div><div><dt>Reference</dt><dd>${entry.id}</dd></div><div><dt>Time</dt><dd>${when(entry.ts)}</dd></div></dl>
    <div class="actions"><button class="primary" type="button" data-close>Done</button></div>`;
  $('#sheetTitle').focus();
}

sheet.addEventListener('click', (e) => {
  const t = e.target;
  if (t === sheet || t.closest('[data-close]')) return sheet.close();
  if (t.closest('[data-back]')) return form();
  if (t.closest('#ok')) return commit();
  if (t.closest('#doReset')) { S = { name: S.name, bal: 0, pot: 0, log: [] }; save(); render(); say('Demo wallet reset.'); return sheet.close(); }
  const dir = t.closest('[data-dir]'); if (dir) { d.dir = dir.dataset.dir; d.amt = $('#f [name=amt]').value; return form(); }
  const p = t.closest('[data-p]'); if (p) { const i = $('#f [name=amt]'); i.value = p.dataset.p; i.focus(); }
});
sheet.addEventListener('submit', (e) => { e.preventDefault(); review(); });

$('#app').addEventListener('click', (e) => {
  const svc = e.target.closest('[data-svc]'); if (svc) return open(svc.dataset.svc);
  const fund = e.target.closest('[data-fund]');
  if (fund) { const k = +fund.dataset.fund; S.bal += k; S.log.unshift({ id: 'NL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), ts: Date.now(), title: 'Demo funds added', sub: '', d: k }); save(); render(); flash(); say(`Added ${nf(k)} demo funds. Wallet balance ${nf(S.bal)}.`); }
});
$('#reset').onclick = () => {
  d = {}; body.innerHTML = `<h2 id="sheetTitle">Reset the demo?</h2><p class="muted">This clears your balance, Ajo pot and activity on this device.</p>
    <div class="actions"><button class="primary danger" id="doReset" type="button">Reset wallet</button><button class="ghost" type="button" data-close>Keep my wallet</button></div>`;
  sheet.showModal();
};
if (S.name) showApp();
