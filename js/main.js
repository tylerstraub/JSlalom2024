import { MainGame } from './game.js';
import { NumberLabel } from './numberLabel.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score-display');
  const hiscoreEl = document.getElementById('hiscore-display');
  const overlay = document.getElementById('game-over-overlay');
  const playAgainBtn = document.getElementById('play-again-btn');
  const sendRecordBtn = document.getElementById('send-record-btn');
  const nameInput = document.getElementById('player-name');
  const sendRecordRow = document.getElementById('send-record-row');
  const focusOverlay = document.getElementById('focus-overlay');

  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang') || params.get('LANG');
  const lang = (langParam === 'JP') ? 1 : 0;

  // Size canvas to fill the viewport at 16:10 aspect ratio (letterboxed)
  function resizeCanvas() {
    const aspect = 320 / 200; // 1.6
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    let cw, ch;
    if (ww / wh > aspect) {
      ch = wh;
      cw = Math.floor(ch * aspect);
    } else {
      cw = ww;
      ch = Math.floor(cw / aspect);
    }
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.left = Math.floor((ww - cw) / 2) + 'px';
    canvas.style.top  = Math.floor((wh - ch) / 2) + 'px';
    return { cw, ch };
  }

  resizeCanvas();

  const scoreLabel = new NumberLabel(scoreEl);
  const game = new MainGame(canvas, scoreLabel, hiscoreEl, lang);

  window.addEventListener('resize', () => {
    const { cw, ch } = resizeCanvas();
    game.onResize(cw, ch);
  });

  await game.loadImages();

  // ── Pause / resume ─────────────────────────────────────────────────────────

  function triggerPause() {
    if (overlay.style.display === 'flex') return; // game-over panel is up
    focusOverlay.classList.add('visible');
    game.pause();
  }

  // Window-level blur catches tab switches and alt-tab, regardless of which
  // element has focus within the page.
  window.addEventListener('blur', triggerPause);

  // ── Score submission ───────────────────────────────────────────────────────

  nameInput.addEventListener('input', () => {
    sendRecordBtn.disabled = nameInput.value.trim() === '';
  });

  game.onGameOver = () => {
    nameInput.value = '';
    sendRecordBtn.disabled = true;
    sendRecordRow.style.display = '';
    overlay.style.display = 'flex';
    nameInput.focus();
  };

  sendRecordBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) return;
    game.saveRanking(game.prevScore, name);
    sendRecordRow.style.display = 'none';
  });

  playAgainBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    focusOverlay.classList.remove('visible');
    game.returnToTitle();
    canvas.focus();
  });

  // ── Keyboard ───────────────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (document.activeElement === nameInput) return;
    if (e.keyCode === 27) { triggerPause(); canvas.blur(); return; }
    if ([37, 39, 32].includes(e.keyCode)) e.preventDefault();
    game.keyEvent(e.keyCode, true);
  });
  document.addEventListener('keyup', (e) => {
    if (document.activeElement === nameInput) return;
    game.keyEvent(e.keyCode, false);
  });

  // ── Touch (canvas — screen-half steering) ─────────────────────────────────

  // Recompute lFlag/rFlag from the set of currently active touches.
  // Left half of canvas → bank left, right half → bank right.
  // Multi-touch is supported: holding both sides steers both flags.
  function evaluateTouchFlags(touches) {
    const rect = canvas.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    game.lFlag = false;
    game.rFlag = false;
    for (const t of touches) {
      if (t.clientX < midX) game.lFlag = true;
      else                   game.rFlag = true;
    }
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // Resume if the pause overlay is up (e.g. came back from another app).
    if (focusOverlay.classList.contains('visible')) {
      focusOverlay.classList.remove('visible');
      game.resume();
      canvas.focus();
      return;
    }
    // Don't steal taps from the game-over overlay buttons.
    if (overlay.style.display === 'flex') return;
    if (game.gameMode === 0) {
      evaluateTouchFlags(e.touches);
    } else {
      // Title / demo: start the game immediately on first tap.
      game.isFocus2 = true;
      game.startGame(0);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    evaluateTouchFlags(e.touches); // e.touches = remaining active touches
  }, { passive: false });

  canvas.addEventListener('touchcancel', () => {
    game.lFlag = false;
    game.rFlag = false;
  });

  // ── Mouse ──────────────────────────────────────────────────────────────────

  canvas.addEventListener('mousedown', (e) => {
    // Only apply steering when already playing — prevents the start-click
    // from also registering as a bank input on the first tick.
    if (game.gameMode === 0) {
      if (e.button === 2) { game.rFlag = true;  game.lFlag = false; }
      else if (e.button === 0) { game.rFlag = false; game.lFlag = true; }
    }
    if (game.gameMode !== 0) {
      if (!game.isFocus2) { game.isFocus2 = true; }
      else if (game.isInPage && game.gameMode === 1) { window.open('http://www.kdn.gr.jp/~shii/', '_blank'); }
      else { game.startGame(0); }
    }
  });
  canvas.addEventListener('mouseup', () => { game.rFlag = false; game.lFlag = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouseX = (e.clientX - rect.left) * (canvas.width  / rect.width);
    game.mouseY = (e.clientY - rect.top)  * (canvas.height / rect.height);
  });

  // ── Canvas focus — resume on click-back-in ─────────────────────────────────

  canvas.setAttribute('tabindex', '0');

  canvas.addEventListener('focus', () => {
    game.isFocus = true;
    focusOverlay.classList.remove('visible');
    game.resume();
  });

  canvas.addEventListener('blur', () => {
    game.isFocus = false;
    game.isFocus2 = false;
    // In-page focus change (e.g. clicking outside the canvas but within the tab).
    // Window-level blur is handled separately above; this covers the remainder.
    if (document.activeElement !== nameInput) {
      triggerPause();
    }
  });

  game.start();
  canvas.focus();
}

init();
