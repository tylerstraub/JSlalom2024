import { MainGame } from './game.js';
import { NumberLabel } from './numberLabel.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score-display');
  const continueEl = document.getElementById('continue-display');
  const hiscoreEl = document.getElementById('hiscore-display');
  const overlay = document.getElementById('game-over-overlay');
  const playAgainBtn = document.getElementById('play-again-btn');
  const sendRecordBtn = document.getElementById('send-record-btn');
  const nameInput = document.getElementById('player-name');

  // Parse ?lang=JP from URL
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang') || params.get('LANG');
  const lang = (langParam === 'JP') ? 1 : 0;

  const scoreLabel = new NumberLabel(scoreEl);
  const game = new MainGame(canvas, scoreLabel, continueEl, hiscoreEl, lang);

  // Load sprite images
  await game.loadImages();

  // Game-over overlay logic
  game.onGameOver = (isNewRecord) => {
    nameInput.value = '';
    sendRecordBtn.disabled = false;
    overlay.style.display = 'block';
    nameInput.focus();
  };

  sendRecordBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'No name';
    game.saveRanking(game.prevScore, name);
    sendRecordBtn.disabled = true;
  });

  playAgainBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    game.returnToTitle();
    canvas.focus();
  });

  // Keyboard input — don't steal keystrokes when typing in the name field
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === nameInput) return;
    // Prevent arrow key / space scrolling
    if ([37, 39, 32].includes(e.keyCode)) {
      e.preventDefault();
    }
    game.keyEvent(e.keyCode, true);
  });
  document.addEventListener('keyup', (e) => {
    if (document.activeElement === nameInput) return;
    game.keyEvent(e.keyCode, false);
  });

  // Touch controls
  const touchLeft = document.getElementById('touch-left');
  const touchRight = document.getElementById('touch-right');

  if (touchLeft && touchRight) {
    touchLeft.addEventListener('touchstart', (e) => {
      e.preventDefault();
      game.keyEvent(37, true); // Left arrow
    });
    touchLeft.addEventListener('touchend', (e) => {
      e.preventDefault();
      game.keyEvent(37, false);
    });
    touchRight.addEventListener('touchstart', (e) => {
      e.preventDefault();
      game.keyEvent(39, true); // Right arrow
    });
    touchRight.addEventListener('touchend', (e) => {
      e.preventDefault();
      game.keyEvent(39, false);
    });
  }

  // Mouse steering — matches Java's mousePressed/mouseReleased
  // Java modifier bits: 4 = right button → rFlag, 16 = left button → lFlag
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      // Right click → steer right
      game.rFlag = true;
      game.lFlag = false;
    } else if (e.button === 0) {
      // Left click → steer left
      game.rFlag = false;
      game.lFlag = true;
    }

    if (game.gameMode !== 0) { // not PLAY_MODE
      if (!game.isFocus2) {
        game.isFocus2 = true;
      } else if (game.isInPage && game.gameMode === 1) { // TITLE_MODE
        window.open('http://www.kdn.gr.jp/~shii/', '_blank');
      } else {
        game.startGame(0, false); // PLAY_MODE (blocked by startGame if GAME_OVER_MODE)
      }
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    game.rFlag = false;
    game.lFlag = false;
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Track mouse position for hpage hitTest (CSS-to-canvas coordinate conversion)
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    game.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });

  // Focus/blur tracking for clickMsg display
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('focus', () => {
    game.isFocus = true;
  });
  canvas.addEventListener('blur', () => {
    game.isFocus = false;
    game.isFocus2 = false;
  });

  // Start game loop
  game.start();

  // Give canvas focus initially
  canvas.focus();
}

init();
