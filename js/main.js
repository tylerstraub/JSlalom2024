import { MainGame } from './game.js';
import { NumberLabel } from './numberLabel.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score-display');
  const continueEl = document.getElementById('continue-display');
  const hiscoreEl = document.getElementById('hiscore-display');

  const scoreLabel = new NumberLabel(scoreEl);
  const game = new MainGame(canvas, scoreLabel, continueEl, hiscoreEl);

  // Load sprite images
  await game.loadImages();

  // Keyboard input
  document.addEventListener('keydown', (e) => {
    // Prevent arrow key scrolling
    if ([37, 39, 32].includes(e.keyCode)) {
      e.preventDefault();
    }
    game.keyEvent(e.keyCode, true);
  });
  document.addEventListener('keyup', (e) => {
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

  // Canvas click to start
  canvas.addEventListener('click', () => {
    if (game.gameMode !== 0) { // not PLAY_MODE
      game.startGame(0, false); // PLAY_MODE
    }
  });

  // Start game loop
  game.start();
}

init();
