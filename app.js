const pots = JSON.parse(localStorage.getItem('nl-pots') || '[]');
const list = document.getElementById('pots');
function draw() {
  list.innerHTML = pots.map((p) => `<li>${p.name} — ₦${Number(p.amount).toLocaleString()}</li>`).join('') || '<li>No pots yet</li>';
}
document.getElementById('pot').onsubmit = (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  pots.push(data);
  localStorage.setItem('nl-pots', JSON.stringify(pots));
  e.target.reset();
  draw();
};
draw();
