// The Food tab is the Spoon app itself, embedded full-bleed. Spoon lives in
// its own repo and keeps its own token inside its own origin.

const SPOON_URL = 'https://darkpizzai.github.io/kave-food-app/';

export default async function food(container) {
  container.classList.add('bleed');
  const frame = document.createElement('iframe');
  frame.className = 'embed';
  frame.title = 'Spoon';
  frame.src = SPOON_URL;
  container.append(frame);
}
