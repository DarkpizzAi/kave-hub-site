import { test, eq } from './run.js';
import { showSetup, showGate } from '../js/gate.js';

function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}

test('setup asks who first, then the theme, and only then reports the choices', () => {
  const root = mount();
  let got = null;
  showSetup(root, c => { got = c; });
  eq([...root.querySelectorAll('.setup-choice')].map(b => b.textContent), ['Isa', 'Hugo']);
  root.querySelector('.setup-choice').click();
  eq(got, null);
  eq([...root.querySelectorAll('.setup-choice')].map(b => b.textContent), ['Cobalt', 'Chartreuse']);
  root.querySelectorAll('.setup-choice')[1].click();
  eq(got, { who: 'isa', palette: 'chartreuse' });
  root.remove();
});

test('the gate has no intro text: the mark, the title, the field and the button', () => {
  const root = mount();
  showGate(root, () => {});
  eq(root.querySelector('.gate .m3-headline-s').textContent, 'Kave hub');
  eq(root.querySelectorAll('.gate p, .gate .m3-body-l, .gate .m3-body-m').length, 0, 'no intro text');
  eq(!!root.querySelector('.gate input[type=password][aria-label]'), true);
  eq(!!root.querySelector('.gate .m3-btn--filled[aria-label="Connect"]'), true, 'the accent button');
  root.remove();
});
