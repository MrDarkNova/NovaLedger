const KEY = 'novaledger-v3';
const $ = (id) => document.getElementById(id);
const naira = (n) => '₦' + Number(n || 0).toLocaleString();
const services = [
  { id: 'airtime', label: 'Airtime', hint: 'Any network' },
  { id: 'data', label: 'Data', hint: 'SIM only' },
  { id: 'cable', label: 'Cable TV', hint: 'DSTV / GOTV' },
  { id: 'power', label: 'Electricity', hint: 'Meter' },
  { id: 'send', label: 'Transfer', hint: 'Wallet to name' },
  { id: 'ajo', label: 'Ajo pot', hint: 'Save locally' },
];
let state = JSON.parse(localStorage.getItem(KEY) || 'null') || { name: '', bal: 0, log: [] };
const save = () => localStorage.setItem(KEY, JSON.stringify(state));

function showApp() {
  $('gate').classList.add('hide');
  $('app').classList.remove('hide');
  render();
}
function render() {
  $('avail').textContent = naira(state.bal);
  $('grid').innerHTML = services.map((s) =>
    `<button class="tile" data-svc="${s.id}">${s.label}<small>${s.hint}</small></button>`
  ).join('');
  $('log').innerHTML = (state.log.slice(0, 12).map((l) => `<li>${l}</li>`).join('')) || '<li>No activity yet.</li>';
}
function pay(label, amt) {
  const n = Number(amt);
  if (!n || n <= 0) return alert('Enter an amount');
  if (n > state.bal) return alert('Not enough demo funds');
  state.bal -= n;
  state.log.unshift(`${label} − ${naira(n)}`);
  save(); render();
  $('panel').classList.add('hide');
}

$('login').onsubmit = (e) => {
  e.preventDefault();
  state.name = new FormData(e.target).get('name');
  save(); showApp();
};
$('out').onclick = () => { $('app').classList.add('hide'); $('gate').classList.remove('hide'); };
$('fund').onsubmit = (e) => {
  e.preventDefault();
  const n = Number(new FormData(e.target).get('amount'));
  state.bal += n;
  state.log.unshift(`Funded ${naira(n)}`);
  save(); render(); e.target.reset();
};
$('grid').onclick = (e) => {
  const id = e.target.closest('[data-svc]')?.dataset.svc;
  if (!id) return;
  const s = services.find((x) => x.id === id);
  $('panel').classList.remove('hide');
  $('panel').innerHTML = `<h3>${s.label}</h3>
    <p>Demo only. Deducts from the local balance.</p>
    <form id="svc">
      <input name="ref" required placeholder="Phone / decoder / meter / name" />
      <input name="amount" type="number" min="50" required placeholder="Amount (₦)" />
      <button>Pay (simulate)</button>
    </form>`;
  $('svc').onsubmit = (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target));
    pay(`${s.label} · ${d.ref}`, d.amount);
  };
};
if (state.name) showApp();
