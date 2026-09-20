# kave-hub-site

A static, desktop-only shell. It holds no data. It reads its content at runtime
from a private repository using a read-only token that the visitor enters, and
embeds another app in one tab.

Run locally: `python dev_server.py`, then open http://localhost:8790/
Tests: open http://localhost:8790/tests/ and read the DONE line.

## Spike result (2026-09-20)

Spoon inside an iframe on a different origin: loads, no frame-blocking
console errors, token entered inside the frame works, list and price data
load, and the token survives a page reload. The frame fills the full window
width. Not checkable from the parent page: whether Spoon's service worker
registers inside the frame (cross-origin), though the app works normally.
Spoon lays itself out as a centred column at wide widths; that is Spoon's
own layout and the shell does not alter it.

