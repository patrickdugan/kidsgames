// Moonmeadow Ranch — entry point.
'use strict';

if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
  window.claude.hot.snapshot(() => ({ state: Game.running ? state : null }));
}
if (document.fonts) document.fonts.load('600 16px "Pixelify Sans"').catch(() => {});
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
