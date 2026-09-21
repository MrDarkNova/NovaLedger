const KEY = 'novaledger-v1';
const naira = (n) => '₦' + Number(n).toLocaleString();
const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') || {
  cash: 124500,
  pots: [{ name: 'Target', amount: 45000 }],
  log: [{ t: Date.now(), text: 'Starting balance loaded' }],
};
let state = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const push = (text) => { state.log.unshift({ t: Date.now(), text }); save(); draw(); };

function draw() {
  const potSum = state.pots.reduce((s, p) => s + Number(p.amount), 0);
  document.getElementById('avail').textContent = naira(state.cash);
  document.getElementById('inPots').textContent = naira(potSum);
  document.getElementById('total').textContent = naira(state.cash + potSum);
  document.getElementById('pots').innerHTML = state.pots.map((p, i) =>
    `<li>${p.name} — ${naira(p.amount)} <button data-back="${i}">Return</button></li>`
  ).join('') || '<li>No pots</li>';
  document.getElementById('log').innerHTML = state.log.slice(0, 12).map(
    (l) => `<li>${new Date(l.t).toLocaleString()} — ${l.text}</li>`
  ).join('');
}

document.getElementById('move').onsubmit = (e) => {
  e.preventDefault();
  const amt = Number(new FormData(e.target).get('amount'));
  const act = e.submitter.value;
  if (act === 'in') { state.cash += amt; push('Deposited ' + naira(amt)); }
  else if (amt > state.cash) { alert('Not enough available cash'); }
  else { state.cash -= amt; push('Withdrew ' + naira(amt)); }
};

document.getElementById('pot').onsubmit = (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const amt = Number(data.amount || 0);
  if (amt > state.cash) { alert('Not enough available cash'); return; }
  state.cash -= amt;
  const existing = state.pots.find((p) => p.name === data.name);
  if (existing) existing.amount += amt;
  else state.pots.push({ name: data.name, amount: amt });
  e.target.reset();
  push('Moved ' + naira(amt) + ' into ' + data.name);
};

document.getElementById('pots').onclick = (e) => {
  const i = e.target.dataset.back;
  if (i == null) return;
  const pot = state.pots[Number(i)];
  state.cash += Number(pot.amount);
  push('Returned ' + naira(pot.amount) + ' from ' + pot.name);
  state.pots.splice(Number(i), 1);
  save(); draw();
};

document.getElementById('reset').onclick = () => {
  localStorage.removeItem(KEY);
  state = load();
  draw();
};

draw();
