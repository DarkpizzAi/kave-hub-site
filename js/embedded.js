// The one place the site writes another app's storage. Spoon shares this
// browser origin, so its settings sit in localStorage under one key. Only the
// token, the user and the palette are written; every other field is kept. The
// token is copied inside this origin: never logged, never sent anywhere.

export const EMBEDDED = [
  { name: 'spoon', key: 'foodapp.settings', frameMatch: '/kave-food-app/' },
];

function parseObject(text) {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (e) { return {}; }
}

export function mergeSettings(existingText, { token, who, palette }) {
  return JSON.stringify({ ...parseObject(existingText), token, who, palette });
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
      storage.setItem(app.key, transform(storage.getItem(app.key)));
      reloadFrames(app, doc);
      return { name: app.name, ok: true };
    } catch (e) {
      return { name: app.name, ok: false };
    }
  });
}

export function applyToEmbeddedApps(values, deps) {
  return writeAll(text => mergeSettings(text, values), deps);
}

export function forgetInEmbeddedApps(deps) {
  return writeAll(clearTokenIn, deps);
}
