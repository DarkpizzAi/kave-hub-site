// The one place the site writes another app's storage. Spoon and Compass
// share this browser origin, so each app's settings sit in localStorage under
// one key. Only the token, the user and the palette are written; every other
// field is kept. The token is copied inside this origin: never logged, never
// sent anywhere. `who` names the field each app calls the person by.

export const EMBEDDED = [
  { name: 'spoon', key: 'foodapp.settings', frameMatch: '/kave-food-app/', who: 'who' },
  { name: 'compass', key: 'compass.settings', frameMatch: '/kave-compass-app/', who: 'me' },
];

function parseObject(text) {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (e) { return {}; }
}

export function mergeSettings(existingText, { token, who, palette }, whoField = 'who') {
  return JSON.stringify({ ...parseObject(existingText), token, [whoField]: who, palette });
}

export function clearTokenIn(existingText) {
  return JSON.stringify({ ...parseObject(existingText), token: '' });
}

// An app reads its settings when it loads, so a frame already showing it is reloaded.
function reloadFrames(app, doc) {
  for (const f of doc.querySelectorAll('iframe')) {
    if (!(f.src || '').includes(app.frameMatch)) continue;
    try { f.contentWindow.location.reload(); } catch (e) { f.src = f.src; }
  }
}

function writeAll(transform, { storage = localStorage, doc = document } = {}) {
  return EMBEDDED.map(app => {
    try {
      storage.setItem(app.key, transform(storage.getItem(app.key), app));
      reloadFrames(app, doc);
      return { name: app.name, ok: true };
    } catch (e) {
      return { name: app.name, ok: false };
    }
  });
}

export function applyToEmbeddedApps(values, deps) {
  return writeAll((text, app) => mergeSettings(text, values, app.who), deps);
}

export function forgetInEmbeddedApps(deps) {
  return writeAll(clearTokenIn, deps);
}
