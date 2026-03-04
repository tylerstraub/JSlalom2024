import { DrawEnv } from './drawEnv.js';
import { Ground } from './ground.js';
import { GameRecorder } from './gameRecorder.js';
import { ObstacleCollection } from './obstacle.js';
import { NormalRound } from './normalRound.js';
import { RoadRound } from './roadRound.js';
import { StringObject, ALIGN_LEFT } from './stringObject.js';

const PLAY_MODE = 0;
const TITLE_MODE = 1;
const DEMO_MODE = 2;
const GAME_OVER_MODE = 3;

export class MainGame {
  constructor(canvas, scoreLabel, continueLabel, hiscoreLabel, lang) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreLabel = scoreLabel;
    this.continueLabel = continueLabel;
    this.hiscoreLabel = hiscoreLabel;
    this.lang = lang || 0;

    this.width = 320;
    this.height = 200;
    this.centerX = 160;
    this.centerY = 100;

    this.env = new DrawEnv();
    this.env.initBuffer();

    this.ground = new Ground();
    this.recorder = new GameRecorder();
    this.hiscoreRec = null;
    this.obstacles = new ObstacleCollection();

    this.vx = 0;
    this.mywidth = 0.7;
    this.mywidth2 = 0;
    this.score = 0;
    this.prevScore = 0;
    this.hiscore = 0;
    this.shipCounter = 0;
    this.contNum = 0;
    this.damaged = 0;
    this.round = 0;
    this.gameMode = TITLE_MODE;
    this.scFlag = true;

    this.rFlag = false;
    this.lFlag = false;
    this.spcFlag = false;
    this.isFocus = true;
    this.isFocus2 = true;
    this.isInPage = false;
    this.mouseX = 0;
    this.mouseY = 0;

    this.myImg = null;
    this.myImg2 = null;

    this.titleCounter = 0;

    // Ranking data
    this.hiScoreEntries = null;
    this.hiScoreInfoObj = null;

    // Called when a play-mode game ends: onGameOver(isNewRecord)
    this.onGameOver = null;

    // Bomb sound via Web Audio API
    this.audioCtx = null;
    this.bombBuffer = null;

    // Sin/cos lookup table (128 entries)
    this.si = new Float64Array(128);
    this.co = new Float64Array(128);
    for (let i = 0; i < 128; i++) {
      this.si[i] = Math.sin(Math.PI * i / 75 / 6);
      this.co[i] = Math.cos(Math.PI * i / 75 / 6);
    }

    // mywidth2 calculation matching original
    this.mywidth2 = (this.width * this.mywidth * 120 / 1.6 / 320) | 0;

    // Rounds - matches original exactly
    this.rounds = [
      new NormalRound(8000,    { r: 0, g: 160, b: 255 },   { r: 0, g: 200, b: 64 }, 4),
      new NormalRound(12000,   { r: 240, g: 160, b: 160 }, { r: 64, g: 180, b: 64 }, 3),
      new NormalRound(25000,   { r: 0, g: 0, b: 0 },       { r: 0, g: 128, b: 64 }, 2),
      new RoadRound(40000,     { r: 0, g: 180, b: 240 },   { r: 0, g: 200, b: 64 }, false),
      new RoadRound(100000,    { r: 192, g: 192, b: 192 }, { r: 64, g: 180, b: 64 }, true),
      new NormalRound(1000000, { r: 0, g: 0, b: 0 },       { r: 0, g: 128, b: 64 }, 1)
    ];

    // Link prev rounds
    for (let i = 1; i < this.rounds.length; i++) {
      this.rounds[i].setPrevRound(this.rounds[i - 1]);
    }

    // Dual-language string tables
    const toStartMsg = [
      'Click this game screen or push [space] key!!',
      '\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u304B\u3001[space]key\u3092\u62BC\u3057\u3066\u4E0B\u3055\u3044'
    ];
    const contMsgStr = [
      'Push [C] key to start from this stage!!',
      '\u9014\u4E2D\u304B\u3089\u59CB\u3081\u308B\u5834\u5408\u306F [C]key \u3092\u62BC\u3057\u3066\u4E0B\u3055\u3044!!'
    ];
    const clickMsgStr = [
      'Click!!',
      '\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u4E0B\u3055\u3044'
    ];

    // Title screen text objects
    const titleFont = `bold ${(this.width * 32 / 320 + 4)}px "Times New Roman", serif`;
    const normalFont = '12px "Courier New", Courier, monospace';
    this.normalFont = normalFont;

    this.title = new StringObject(titleFont, '#ffffff', 'Jet slalom',
      this.centerX, this.centerY - 20 * this.width / 320);
    this.author = new StringObject(normalFont, '#000000', 'Programed by MR-C',
      this.centerX, this.centerY + 68);
    this.startMsg = new StringObject(normalFont, '#000000',
      toStartMsg[this.lang],
      this.centerX, this.centerY + 24);
    this.contMsg = new StringObject(normalFont, '#000000',
      contMsgStr[this.lang],
      this.centerX, this.centerY + 44);
    this.clickMsg = new StringObject(normalFont, '#ff0000',
      clickMsgStr[this.lang],
      this.centerX, this.centerY);
    this.hpage = new StringObject(normalFont, '#000000',
      'http://www.kdn.gr.jp/~shii/',
      this.centerX, this.centerY + 86);

    // Timer handle
    this._timerId = null;
  }

  loadImages() {
    return new Promise((resolve) => {
      let loaded = 0;
      const check = () => { if (++loaded === 2) resolve(); };

      this.myImg = new Image();
      this.myImg.onload = check;
      this.myImg.onerror = check;
      this.myImg.src = 'jiki.gif';

      this.myImg2 = new Image();
      this.myImg2.onload = check;
      this.myImg2.onerror = check;
      this.myImg2.src = 'jiki2.gif';
    });
  }

  initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fetch('audio/BOMB.wav')
        .then(r => r.arrayBuffer())
        .then(ab => this.audioCtx.decodeAudioData(ab))
        .then(buf => { this.bombBuffer = buf; })
        .catch(() => {});
    } catch (e) {
      // Audio not available
    }
  }

  playBombSound() {
    if (!this.audioCtx || !this.bombBuffer) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.bombBuffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch (e) {
      // Ignore audio errors
    }
  }

  initHiScoreInfoObj() {
    this.hiScoreInfoObj = new Array(6);
    this.hiScoreInfoObj[0] = new StringObject(this.normalFont, '#ffffff', 'Ranking',
      this.width / 2, 24);
    for (let i = 1; i < 6; i++) {
      this.hiScoreInfoObj[i] = new StringObject(this.normalFont, '#ffffff', '',
        this.width / 8, 24 + 24 * i);
      this.hiScoreInfoObj[i].setAlign(ALIGN_LEFT);
    }
  }

  updateHiScoreInfoObj(idx) {
    for (let i = 0; i < 5; i++) {
      let num = ' ' + (idx + i + 1);
      num = num.substring(num.length - 2);
      this.hiScoreInfoObj[i + 1].setText(num + '.  ' + this.hiScoreEntries[idx + i]);
    }
  }

  saveRanking(score, name) {
    try {
      let rankings = JSON.parse(localStorage.getItem('jslalom_rankings') || '[]');
      rankings.push({ score, name: name || 'No name' });
      rankings.sort((a, b) => b.score - a.score);
      rankings = rankings.slice(0, 20);
      localStorage.setItem('jslalom_rankings', JSON.stringify(rankings));
      this.loadRankingEntries(rankings);
    } catch (e) {
      // localStorage may be unavailable
    }
  }

  returnToTitle() {
    this.gameMode = TITLE_MODE;
  }

  loadRankingEntries(rankings) {
    this.hiScoreEntries = new Array(20);
    for (let i = 0; i < 20; i++) {
      if (i < rankings.length) {
        let scoreStr = '000000' + rankings[i].score;
        scoreStr = scoreStr.substring(scoreStr.length - 6);
        this.hiScoreEntries[i] = scoreStr + ' : ' + rankings[i].name;
      } else {
        this.hiScoreEntries[i] = '';
      }
    }
  }

  start() {
    // Load hiscore from localStorage
    const saved = localStorage.getItem('jslalom_hiscore');
    if (saved) {
      this.hiscore = parseInt(saved) || 0;
      this.hiscoreLabel.textContent = 'Hi-score:' + this.hiscore;
    }

    // Load hiscore replay from localStorage
    try {
      const recJson = localStorage.getItem('jslalom_hiscoreRec');
      if (recJson) {
        this.hiscoreRec = GameRecorder.fromJSON(JSON.parse(recJson));
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Load rankings from localStorage
    try {
      const rankings = JSON.parse(localStorage.getItem('jslalom_rankings') || '[]');
      if (rankings.length > 0) {
        this.loadRankingEntries(rankings);
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Init state
    this.obstacles.removeAll();
    for (let i = 0; i < this.rounds.length; i++) {
      this.rounds[i].init();
    }
    this.damaged = 0;
    this.round = 0;
    this.score = 0;
    this.vx = 0;
    this.gameMode = TITLE_MODE;

    // Start game loop: setTimeout-based so speed mode can skip the wait
    this._timerId = setTimeout(() => this.tick(), 55);
  }

  stop() {
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    this.gameMode = TITLE_MODE;
  }

  startGame(mode, isContinue) {
    if (this.gameMode === PLAY_MODE || this.gameMode === GAME_OVER_MODE) return;

    this.vx = 0;
    if (mode !== PLAY_MODE && mode !== DEMO_MODE) {
      this.gameMode = TITLE_MODE;
      return;
    }

    if (mode === DEMO_MODE && this.hiscoreRec === null) {
      return;
    }

    this.gameMode = mode;

    if (mode === PLAY_MODE) {
      this.initAudio();
      this.recorder = new GameRecorder();
    } else {
      this.hiscoreRec.toStart();
    }

    this.obstacles.removeAll();
    for (let i = 0; i < this.rounds.length; i++) {
      this.rounds[i].init();
    }

    this.damaged = 0;
    this.round = 0;
    this.score = 0;
    this.vx = 0;

    if (!isContinue) {
      this.contNum = 0;
    } else {
      while (this.prevScore >= this.rounds[this.round].getNextRoundScore()) {
        this.round++;
      }
      if (this.round > 0) {
        this.score = this.rounds[this.round - 1].getNextRoundScore();
        this.contNum++;
      }
    }

    if (mode === DEMO_MODE) {
      this.round = this.hiscoreRec.startRound;
      this.score = this.hiscoreRec.startScore;
    } else {
      this.recorder.startRound = this.round;
      this.recorder.startScore = this.score;
    }

    this.continueLabel.textContent = '' + (this.contNum * 1000);
  }

  keyEvent(keyCode, isDown) {
    // Right arrow (39) or L (76)
    if (keyCode === 39 || keyCode === 76) {
      this.rFlag = isDown;
    }
    // Left arrow (37) or J (74)
    if (keyCode === 37 || keyCode === 74) {
      this.lFlag = isDown;
    }
    // A key (65) - speed up
    if (keyCode === 65) {
      this.spcFlag = isDown;
    }

    if (isDown) {
      // Space (32) or C (67) to start — not during game-over overlay
      if (this.gameMode !== PLAY_MODE && this.gameMode !== GAME_OVER_MODE && (keyCode === 32 || keyCode === 67)) {
        this.startGame(PLAY_MODE, keyCode === 67);
      }
      // D key - demo mode
      if (this.gameMode === TITLE_MODE && keyCode === 68 && this.hiscoreRec !== null) {
        this.startGame(DEMO_MODE, false);
      }
      // T key - test mode — not during game-over overlay
      if (this.gameMode !== PLAY_MODE && this.gameMode !== GAME_OVER_MODE && keyCode === 84) {
        this.prevScore = 110000;
        this.contNum = 100;
        this.startGame(PLAY_MODE, true);
      }
      // G key - GC hint (no-op in JS, mirrors Java's System.gc())
      if (keyCode === 71) {
        // no-op
      }
    }
  }

  keyOperate() {
    let rFlag = this.rFlag;
    let lFlag = this.lFlag;

    if (this.gameMode === PLAY_MODE) {
      let status = 0;
      if (rFlag) status |= 2;
      if (lFlag) status |= 1;
      this.recorder.writeStatus(status);
    } else if (this.gameMode === DEMO_MODE) {
      const status = this.hiscoreRec.readStatus();
      rFlag = (status & 2) !== 0;
      lFlag = (status & 1) !== 0;
    }

    if (this.damaged === 0 && (this.gameMode === PLAY_MODE || this.gameMode === DEMO_MODE)) {
      if (rFlag) this.vx -= 0.1;
      if (lFlag) this.vx += 0.1;
      if (this.vx < -0.6) this.vx = -0.6;
      if (this.vx > 0.6) this.vx = 0.6;
    }

    if (!lFlag && !rFlag) {
      if (this.vx < 0) {
        this.vx += 0.025;
        if (this.vx > 0) this.vx = 0;
      }
      if (this.vx > 0) {
        this.vx -= 0.025;
        if (this.vx < 0) this.vx = 0;
      }
    }
  }

  moveObstacle() {
    let rec = this.recorder;
    if (this.gameMode === DEMO_MODE) {
      rec = this.hiscoreRec;
    }

    // Set rotation based on velocity
    const absVx = (Math.abs(this.vx) * 100) | 0;
    this.env.nowSin = this.si[absVx];
    this.env.nowCos = this.co[absVx];
    if (this.vx > 0) {
      this.env.nowSin = -this.env.nowSin;
    }

    // Move and collide obstacles
    let ob = this.obstacles.head.next;
    while (ob !== this.obstacles.tail) {
      const nextOb = ob.next;
      ob.move(this.vx, 0, -1.0);

      if (ob.points[0].z <= 1.1) {
        const halfWidth = this.mywidth * this.env.nowCos;
        if (-halfWidth < ob.points[2].x && ob.points[0].x < halfWidth) {
          this.damaged++;
        }
        ob.release();
      }
      ob = nextOb;
    }

    this.rounds[this.round].move(this.vx);
    this.rounds[this.round].generateObstacle(this.obstacles, rec);
  }

  prt() {
    const ctx = this.ctx;

    // Draw sky into pixel buffer
    const sky = this.rounds[this.round].getSkyColor();
    this.env.clearBuffer(sky.r, sky.g, sky.b);

    // Score increment (every frame in play mode)
    if (this.gameMode === PLAY_MODE) {
      this.score += 20;
      if (this.scFlag) {
        this.scoreLabel.setNum(this.score);
      }
    }
    this.scFlag = !this.scFlag;

    // Draw ground and obstacles into pixel buffer (pixel-exact, no AA)
    this.ground.color = this.rounds[this.round].getGroundColor();
    this.ground.draw(this.env);
    this.obstacles.draw(this.env);

    // Blit pixel buffer to canvas
    this.env.flush(ctx);

    // Draw player ship
    this.shipCounter++;
    if (this.gameMode !== TITLE_MODE) {
      let shipY = (24 * this.height / 200) | 0;
      let img = this.myImg;

      // Alternate sprite every 4 frames
      if (this.shipCounter % 4 > 1) {
        img = this.myImg2;
      }

      // Bob up and down every 12 frames
      if (this.shipCounter % 12 > 6) {
        shipY = (22 * this.height / 200) | 0;
      }

      // Rise from bottom at game start
      if (this.score < 200) {
        shipY = ((12 + (this.score / 20 | 0)) * this.height / 200) | 0;
      }

      const spriteW = this.mywidth2 * 2;
      const spriteH = (this.mywidth2 * 16 / 52) | 0;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, this.centerX - this.mywidth2, this.height - shipY, spriteW, spriteH);
        ctx.imageSmoothingEnabled = true;
      }

      // Damage animation
      if (this.damaged > 0) {
        this.putbomb();
      }
    }

    // Title screen
    if (this.gameMode === TITLE_MODE) {
      this.showTitle();
    } else {
      this.titleCounter = 0;
    }
  }

  putbomb() {
    if (this.damaged > 20) {
      this.endGame();
      return;
    }

    if (this.damaged === 1) {
      this.playBombSound();
    }

    const ctx = this.ctx;
    const r = 255;
    const g = Math.max(0, 255 - this.damaged * 12);
    const b = Math.max(0, 240 - this.damaged * 12);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const rx = (this.damaged * 8 * this.width / 320) | 0;
    const ry = (this.damaged * 4 * this.height / 200) | 0;
    const cx = this.centerX;
    // Java fillOval(cx-rx, 186*h/200-ry, rx*2, ry*2) → center at (cx, 186*h/200)
    const cy = (186 * this.height / 200) | 0;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    this.damaged++;
  }

  showTitle() {
    const ctx = this.ctx;
    this.vx = 0;
    const interval = 100;

    if (this.titleCounter >= interval && this.hiScoreEntries !== null) {
      let idx = ((this.titleCounter - interval) / interval | 0) * 5;
      if (idx > 5) {
        idx = 5;
        this.titleCounter = 0;
      }
      if (this.hiScoreInfoObj === null) {
        this.initHiScoreInfoObj();
      }
      this.updateHiScoreInfoObj(idx);
      for (let i = 0; i < 6; i++) {
        this.hiScoreInfoObj[i].draw(ctx);
      }
    } else {
      this.title.draw(ctx);
      this.startMsg.draw(ctx);
      this.author.draw(ctx);

      if (this.hpage.hitTest(this.mouseX, this.mouseY)) {
        this.hpage.setColor('#ffffff');
        this.isInPage = true;
      } else {
        this.isInPage = false;
        this.hpage.setColor('#000000');
      }
      this.hpage.draw(ctx);

      if (this.rounds[0].isNextRound(this.prevScore)) {
        this.contMsg.draw(ctx);
      }
    }

    this.titleCounter++;
    if (!this.isFocus) {
      this.clickMsg.draw(ctx);
    }
  }

  endGame() {
    this.scoreLabel.setNum(this.score);

    const isPlay = this.gameMode === PLAY_MODE;
    if (isPlay) {
      this.prevScore = this.score;
    }

    let isNewRecord = false;
    const netScore = this.score - this.contNum * 1000;
    if (netScore > this.hiscore && isPlay) {
      isNewRecord = true;
      this.hiscore = netScore;
      this.hiscoreRec = this.recorder;
      localStorage.setItem('jslalom_hiscore', this.hiscore.toString());
      try {
        localStorage.setItem('jslalom_hiscoreRec', JSON.stringify(this.hiscoreRec.toJSON()));
      } catch (e) {
        // Ignore storage errors
      }
    }

    this.hiscoreLabel.textContent = 'Hi-score:' + this.hiscore;

    if (isPlay) {
      // Show game-over overlay; ranking saved when player dismisses it
      this.gameMode = GAME_OVER_MODE;
      if (this.onGameOver) this.onGameOver(isNewRecord);
    } else {
      // Demo mode ended — return to title silently
      this.gameMode = TITLE_MODE;
    }
  }

  tick() {
    // Java's TimerNotifier fires every 55ms from when it last fired,
    // independent of how long the game tick takes. To match that behaviour
    // we measure tick start time and subtract elapsed from the 55ms budget
    // so the next tick fires ~55ms after this one started, not after it ended.
    const tickStart = this.spcFlag ? 0 : performance.now();

    // GAME_OVER_MODE: canvas frozen, overlay visible — just keep timer ticking
    if (this.gameMode !== GAME_OVER_MODE) {
      // Round advancement
      if (this.rounds[this.round].isNextRound(this.score)) {
        this.round++;
      }

      this.keyOperate();
      this.moveObstacle();
      this.prt();
    }

    if (this.spcFlag) {
      // A held: run uncapped (0ms delay), matching Java's skip-the-wait behaviour
      this._timerId = setTimeout(() => this.tick(), 0);
    } else {
      const elapsed = performance.now() - tickStart;
      this._timerId = setTimeout(() => this.tick(), Math.max(0, 55 - elapsed));
    }
  }
}
