import { test, eq } from './run.js';
import { showSetup } from '../js/gate.js';

function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}

test('setup asks who first, then theme, and only then reports the choices', () => {
  const root = mount();
  let got = null;
  showSetup(root, c => { got = c; });

  eq([...root.querySelectorAll('.setup-choice')].map(b => b.textContent), ['isa', 'hugo']);
  eq(root.querySelectorAll('.setup-swatch').length, 0);
  eq(got, null);

  root.querySelector('.setup-choice').click();
  eq(got, null);
  eq(root.querySelectorAll('.setup-choice').length, 0);
  eq([...root.querySelectorAll('.setup-swatch')].map(b => b.getAttribute('data-palette')),
    ['cobalt', 'amber', 'chartreuse']);

  root.querySelectorAll('.setup-swatch')[1].click();
  eq(got, { who: 'isa', palette: 'amber' });
  root.remove();
});

test('the second person and the third theme come through as chosen', () => {
  const root = mount();
  let got = null;
  showSetup(root, c => { got = c; });
  root.querySelectorAll('.setup-choice')[1].click();
  root.querySelectorAll('.setup-swatch')[2].click();
  eq(got, { who: 'hugo', palette: 'chartreuse' });
  root.remove();
});

test('the wordmark shows on both steps and the controls have accessible names', () => {
  const root = mount();
  showSetup(root, () => {});
  eq(root.querySelector('.gate-mark').textContent, 'KAVE');
  root.querySelector('.setup-choice').click();
  eq(root.querySelector('.gate-mark').textContent, 'KAVE');
  eq([...root.querySelectorAll('.setup-swatch')].map(b => b.getAttribute('aria-label')),
    ['cobalt', 'amber', 'chartreuse']);
  root.remove();
});
