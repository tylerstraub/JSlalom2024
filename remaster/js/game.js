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

// Tick interval that the game logic was designed for (matches original Java)
const TICK_MS = 55;

export class MainGame {
  constructor(canvas, scoreLabel, continueLabel, hiscoreLabel, lang) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreLabel = scoreLabel;
    this.continueLabel = continueLabel;
    this.hiscoreLabel = hiscoreLabel;
    this.lang = lang || 0;

    // Dimensions match actual canvas - updated by main.js on resize
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;

    this.env = new DrawEnv();

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

    this.hiScoreEntries = null;
    this.hiScoreInfoObj = null;

    this.onGameOver = null;

    this.audioCtx = null;
    this.bombBuffer = null;

    // Sin/cos lookup table (128 entries) — same as original
    this.si = new Float64Array(128);
    this.co = new Float64Array(128);
    for (let i = 0; i < 128; i++) {
      this.si[i] = Math.sin(Math.PI * i / 75 / 6);
      this.co[i] = Math.cos(Math.PI * i / 75 / 6);
    }

    // Rounds — identical to original
    this.rounds = [
      new NormalRound(8000,    { r: 0, g: 160, b: 255 },   { r: 0, g: 200, b: 64 }, 4),
      new NormalRound(12000,   { r: 240, g: 160, b: 160 }, { r: 64, g: 180, b: 64 }, 3),
      new NormalRound(25000,   { r: 0, g: 0, b: 0 },       { r: 0, g: 128, b: 64 }, 2),
      new RoadRound(40000,     { r: 0, g: 180, b: 240 },   { r: 0, g: 200, b: 64 }, false),
      new RoadRound(100000,    { r: 192, g: 192, b: 192 }, { r: 64, g: 180, b: 64 }, true),
      new NormalRound(1000000, { r: 0, g: 0, b: 0 },       { r: 0, g: 128, b: 64 }, 1)
    ];
    for (let i = 1; i < this.rounds.length; i++) {
      this.rounds[i].setPrevRound(this.rounds[i - 1]);
    }

    // Interpolation state
    this._prevVx = 0;
    this._prevShipCounter = 0;
    this._prevLogicScore = 0;
    this._prevDamaged = 0;
    this._prevSkyColor = { r: 0, g: 160, b: 255 };
    this._prevGroundColor = { r: 0, g: 200, b: 64 };
    this._prevSnapshots = new Map();

    // RAF / tick handles
    this._timerId = null;
    this._rafId = null;
    this.lastTickTime = 0;

    this._initUI();
  }

  _initUI() {
    const w = this.width;
    const h = this.height;
    const cx = this.centerX;
    const cy = this.centerY;

    // Scale fonts proportionally to canvas size
    const titleFontSize = Math.round(w * 36 / 320);
    const uiFontSize = Math.max(10, Math.round(w * 12 / 320));
    const titleFont = `bold ${titleFontSize}px "Times New Roman", serif`;
    const normalFont = `${uiFontSize}px "Courier New", Courier, monospace`;
    this.normalFont = normalFont;

    // mywidth2 — sprite half-width in canvas pixels
    this.mywidth2 = (w * this.mywidth * 120 / 1.6 / 320) | 0;

    const toStartMsg = [
      'Click this game screen or push [space] key!!',
      '\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u304B\u3001[space]key\u3092\u62BC\u3057\u3066\u4E0B\u3055\u3044'
    ];
    const contMsgStr = [
      'Push [C] key to start from this stage!!',
      '\u9014\u4E2D\u304B\u3089\u59CB\u3081\u308B\u5834\u5408\u306F [C]key \u3092\u62BC\u3057\u3066\u4E0B\u3055\u3044!!'
    ];

    this.title    = new StringObject(titleFont,  '#ffffff', 'Jet slalom',          cx, cy - 20 * h / 200);
    this.author   = new StringObject(normalFont, '#000000', 'Programed by MR-C',   cx, cy + 68 * h / 200);
    this.startMsg = new StringObject(normalFont, '#000000', toStartMsg[this.lang],  cx, cy + 24 * h / 200);
    this.contMsg  = new StringObject(normalFont, '#000000', contMsgStr[this.lang],  cx, cy + 44 * h / 200);
    this.hpage    = new StringObject(normalFont, '#000000', 'http://www.kdn.gr.jp/~shii/', cx, cy + 86 * h / 200);

    this.hiScoreInfoObj = null; // will be re-created lazily on next use
  }

  // Called by main.js when the canvas is resized
  onResize(w, h) {
    this.width = w;
    this.height = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this._initUI();
  }

  loadImages() {
    return new Promise((resolve) => {
      let loaded = 0;
      const check = () => { if (++loaded === 2) resolve(); };
      this.myImg = new Image();
      this.myImg.onload = check;
      this.myImg.onerror = check;
      this.myImg.src = '../jiki.gif';

      this.myImg2 = new Image();
      this.myImg2.onload = check;
      this.myImg2.onerror = check;
      this.myImg2.src = '../jiki2.gif';
    });
  }

  initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fetch('../audio/BOMB.wav')
        .then(r => r.arrayBuffer())
        .then(ab => this.audioCtx.decodeAudioData(ab))
        .then(buf => { this.bombBuffer = buf; })
        .catch(() => {});
    } catch (e) {}
  }

  playBombSound() {
    if (!this.audioCtx || !this.bombBuffer) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.bombBuffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch (e) {}
  }

  initHiScoreInfoObj() {
    const uiFontSize = Math.max(10, Math.round(this.width * 12 / 320));
    const normalFont = `${uiFontSize}px "Courier New", Courier, monospace`;
    this.hiScoreInfoObj = new Array(6);
    this.hiScoreInfoObj[0] = new StringObject(normalFont, '#ffffff', 'Ranking',
      this.width / 2, 24 * this.height / 200);
    for (let i = 1; i < 6; i++) {
      this.hiScoreInfoObj[i] = new StringObject(normalFont, '#ffffff', '',
        this.width / 8, (24 + 24 * i) * this.height / 200);
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
    } catch (e) {}
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
    const saved = localStorage.getItem('jslalom_hiscore');
    if (saved) {
      this.hiscore = parseInt(saved) || 0;
      this.hiscoreLabel.textContent = 'Hi-score:' + this.hiscore;
    }
    try {
      const recJson = localStorage.getItem('jslalom_hiscoreRec');
      if (recJson) this.hiscoreRec = GameRecorder.fromJSON(JSON.parse(recJson));
    } catch (e) {}
    try {
      const rankings = JSON.parse(localStorage.getItem('jslalom_rankings') || '[]');
      if (rankings.length > 0) this.loadRankingEntries(rankings);
    } catch (e) {}

    this.obstacles.removeAll();
    for (let i = 0; i < this.rounds.length; i++) this.rounds[i].init();
    this.damaged = 0;
    this.round = 0;
    this.score = 0;
    this.vx = 0;
    this.gameMode = TITLE_MODE;

    // Kick off the 60fps render loop and the 18fps logic loop independently
    this.lastTickTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this._rafLoop(t));
    this._timerId = setTimeout(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this._timerId !== null) { clearTimeout(this._timerId); this._timerId = null; }
    if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.gameMode = TITLE_MODE;
  }

  startGame(mode, isContinue) {
    if (this.gameMode === PLAY_MODE || this.gameMode === GAME_OVER_MODE) return;
    this.vx = 0;
    if (mode !== PLAY_MODE && mode !== DEMO_MODE) { this.gameMode = TITLE_MODE; return; }
    if (mode === DEMO_MODE && this.hiscoreRec === null) return;

    this.gameMode = mode;
    if (mode === PLAY_MODE) {
      this.initAudio();
      this.recorder = new GameRecorder();
    } else {
      this.hiscoreRec.toStart();
    }

    this.obstacles.removeAll();
    for (let i = 0; i < this.rounds.length; i++) this.rounds[i].init();
    this.damaged = 0;
    this.round = 0;
    this.score = 0;
    this.vx = 0;

    if (!isContinue) {
      this.contNum = 0;
    } else {
      while (this.prevScore >= this.rounds[this.round].getNextRoundScore()) this.round++;
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
    if (keyCode === 39 || keyCode === 76) this.rFlag = isDown;
    if (keyCode === 37 || keyCode === 74) this.lFlag = isDown;
    if (keyCode === 65) this.spcFlag = isDown;

    if (isDown) {
      if (this.gameMode !== PLAY_MODE && this.gameMode !== GAME_OVER_MODE && (keyCode === 32 || keyCode === 67)) {
        this.startGame(PLAY_MODE, keyCode === 67);
      }
      if (this.gameMode === TITLE_MODE && keyCode === 68 && this.hiscoreRec !== null) {
        this.startGame(DEMO_MODE, false);
      }
      if (this.gameMode !== PLAY_MODE && this.gameMode !== GAME_OVER_MODE && keyCode === 84) {
        this.prevScore = 110000;
        this.contNum = 100;
        this.startGame(PLAY_MODE, true);
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
      if (this.vx < 0) { this.vx += 0.025; if (this.vx > 0) this.vx = 0; }
      if (this.vx > 0) { this.vx -= 0.025; if (this.vx < 0) this.vx = 0; }
    }
  }

  moveObstacle() {
    let rec = this.recorder;
    if (this.gameMode === DEMO_MODE) rec = this.hiscoreRec;

    const absVx = (Math.abs(this.vx) * 100) | 0;
    this.env.nowSin = this.si[absVx];
    this.env.nowCos = this.co[absVx];
    if (this.vx > 0) this.env.nowSin = -this.env.nowSin;

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

  // ─── Interpolation helpers ───────────────────────────────────────────────

  _savePrevState() {
    this._prevVx = this.vx;
    this._prevShipCounter = this.shipCounter;
    this._prevLogicScore = this.score;
    this._prevDamaged = this.damaged;
    this._prevSkyColor = { ...this.rounds[this.round].getSkyColor() };
    this._prevGroundColor = { ...this.rounds[this.round].getGroundColor() };

    this._prevSnapshots = new Map();
    let ob = this.obstacles.head.next;
    while (ob !== this.obstacles.tail) {
      this._prevSnapshots.set(ob, [
        { x: ob.points[0].x, y: ob.points[0].y, z: ob.points[0].z },
        { x: ob.points[1].x, y: ob.points[1].y, z: ob.points[1].z },
        { x: ob.points[2].x, y: ob.points[2].y, z: ob.points[2].z },
        { x: ob.points[3].x, y: ob.points[3].y, z: ob.points[3].z },
      ]);
      ob = ob.next;
    }
  }

  _lerpColor(a, b, t) {
    return {
      r: Math.round(a.r + t * (b.r - a.r)),
      g: Math.round(a.g + t * (b.g - a.g)),
      b: Math.round(a.b + t * (b.b - a.b)),
    };
  }

  // ─── RAF render loop (60fps) ─────────────────────────────────────────────

  _rafLoop(timestamp) {
    if (this._rafId === null) return;
    const alpha = Math.min(1, (performance.now() - this.lastTickTime) / TICK_MS);
    this._renderFrame(alpha);
    this._rafId = requestAnimationFrame((t) => this._rafLoop(t));
  }

  _renderFrame(alpha) {
    if (this.gameMode === GAME_OVER_MODE) return; // canvas frozen under overlay

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.env.setCtx(ctx, w, h);

    // ── Sky ──
    const sky = this._lerpColor(this._prevSkyColor, this.rounds[this.round].getSkyColor(), alpha);
    this.env.clearBuffer(sky.r, sky.g, sky.b);

    // ── World rotation from interpolated vx (all modes) ──
    const interpVx = this._prevVx + alpha * (this.vx - this._prevVx);
    const idx = Math.min(127, (Math.abs(interpVx) * 100) | 0);
    this.env.nowSin = this.si[idx] * (interpVx > 0 ? -1 : 1);
    this.env.nowCos = this.co[idx];

    // ── Ground ──
    const gc = this._lerpColor(this._prevGroundColor, this.rounds[this.round].getGroundColor(), alpha);
    this.ground.color = gc;
    this.ground.draw(this.env);

    // ── Obstacles (all modes — title screen shows world scrolling behind it) ──
    this._drawObstaclesInterpolated(alpha);

    if (this.gameMode !== TITLE_MODE) {
      // ── Player ship ──
      this._drawShip(alpha, ctx);

      // ── Damage explosion ──
      if (this.damaged > 0) this._drawBomb(alpha, ctx);
    } else {
      this.showTitle();
    }
  }

  // Fade alpha based on obstacle's current (interpolated) z distance.
  // Obstacles spawn at z≈25.5 and are fully visible by z=17 — ~470ms of travel.
  _obstacleFogAlpha(interpZ) {
    const FAR  = 40.5; // spawn z — fully transparent here
    const NEAR = 36;   // fully opaque by here (~4 units = ~220ms of travel)
    if (interpZ >= FAR) return 0;
    if (interpZ <= NEAR) return 1;
    return (FAR - interpZ) / (FAR - NEAR);
  }

  _drawObstaclesInterpolated(alpha) {
    const ctx = this.ctx;
    let ob = this.obstacles.head.next;
    while (ob !== this.obstacles.tail) {
      const prev = this._prevSnapshots.get(ob);
      if (prev) {
        // Stash current positions
        const cur = [
          { x: ob.points[0].x, y: ob.points[0].y, z: ob.points[0].z },
          { x: ob.points[1].x, y: ob.points[1].y, z: ob.points[1].z },
          { x: ob.points[2].x, y: ob.points[2].y, z: ob.points[2].z },
          { x: ob.points[3].x, y: ob.points[3].y, z: ob.points[3].z },
        ];

        // The obstacle pool recycles objects. If the z-delta is much larger
        // than one tick's movement (~1 unit), this snapshot belongs to a
        // previous obstacle that occupied the same pool slot — skip interpolation.
        const zDelta = Math.abs(prev[0].z - cur[0].z);
        if (zDelta < 3) {
          // Safe: lerp into place
          for (let i = 0; i < 4; i++) {
            ob.points[i].x = prev[i].x + alpha * (cur[i].x - prev[i].x);
            ob.points[i].y = prev[i].y + alpha * (cur[i].y - prev[i].y);
            ob.points[i].z = prev[i].z + alpha * (cur[i].z - prev[i].z);
          }
          const interpZ = prev[0].z + alpha * (cur[0].z - prev[0].z);
          ctx.globalAlpha = this._obstacleFogAlpha(interpZ);
          ob.draw(this.env);
          // Restore
          for (let i = 0; i < 4; i++) {
            ob.points[i].x = cur[i].x;
            ob.points[i].y = cur[i].y;
            ob.points[i].z = cur[i].z;
          }
        } else {
          // Recycled slot — new obstacle at its spawn z, apply fog
          ctx.globalAlpha = this._obstacleFogAlpha(cur[0].z);
          ob.draw(this.env);
        }
      } else {
        // New obstacle this tick — apply fog at current z
        ctx.globalAlpha = this._obstacleFogAlpha(ob.points[0].z);
        ob.draw(this.env);
      }
      ob = ob.next;
    }
    ctx.globalAlpha = 1; // restore for everything drawn after
  }

  _drawShip(alpha, ctx) {
    const w = this.width;
    const h = this.height;

    // Smooth fractional shipCounter for bob
    const interpCounter = this._prevShipCounter + alpha * (this.shipCounter - this._prevShipCounter);

    // Smooth sinusoidal bob instead of the original step function
    const bobAmp = 2 * h / 200;
    const bobY = Math.sin(interpCounter * Math.PI / 6) * bobAmp;
    let shipY = (24 * h / 200) - bobY;

    // Rise from bottom at game start (interpolate score for smooth rise)
    const interpScore = this._prevLogicScore + alpha * (this.score - this._prevLogicScore);
    if (interpScore < 200) {
      shipY = (12 + interpScore / 20) * h / 200;
    }

    // Sprite frame alternation (discrete, every 4 ticks)
    const img = (this.shipCounter % 4 > 1) ? this.myImg2 : this.myImg;

    const spriteW = this.mywidth2 * 2;
    const spriteH = (this.mywidth2 * 16 / 52) | 0;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, this.centerX - this.mywidth2, h - shipY, spriteW, spriteH);
    }
  }

  _drawBomb(alpha, ctx) {
    const interpDamaged = this._prevDamaged + alpha * (this.damaged - this._prevDamaged);
    const r = 255;
    const g = Math.max(0, 255 - interpDamaged * 12);
    const b = Math.max(0, 240 - interpDamaged * 12);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const rx = interpDamaged * 8 * this.width / 320;
    const ry = interpDamaged * 4 * this.height / 200;
    const cy = 186 * this.height / 200;

    ctx.beginPath();
    ctx.ellipse(this.centerX, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  showTitle() {
    const ctx = this.ctx;
    this.vx = 0;
    const interval = 100;

    if (this.titleCounter >= interval && this.hiScoreEntries !== null) {
      let idx = ((this.titleCounter - interval) / interval | 0) * 5;
      if (idx > 5) { idx = 5; this.titleCounter = 0; }
      if (this.hiScoreInfoObj === null) this.initHiScoreInfoObj();
      this.updateHiScoreInfoObj(idx);
      for (let i = 0; i < 6; i++) this.hiScoreInfoObj[i].draw(ctx);
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

      if (this.rounds[0].isNextRound(this.prevScore)) this.contMsg.draw(ctx);
    }

  }

  endGame() {
    this.scoreLabel.setNum(this.score);

    const isPlay = this.gameMode === PLAY_MODE;
    if (isPlay) this.prevScore = this.score;

    let isNewRecord = false;
    const netScore = this.score - this.contNum * 1000;
    if (netScore > this.hiscore && isPlay) {
      isNewRecord = true;
      this.hiscore = netScore;
      this.hiscoreRec = this.recorder;
      localStorage.setItem('jslalom_hiscore', this.hiscore.toString());
      try {
        localStorage.setItem('jslalom_hiscoreRec', JSON.stringify(this.hiscoreRec.toJSON()));
      } catch (e) {}
    }

    this.hiscoreLabel.textContent = 'Hi-score:' + this.hiscore;

    if (isPlay) {
      this.gameMode = GAME_OVER_MODE;
      if (this.onGameOver) this.onGameOver(isNewRecord);
    } else {
      this.gameMode = TITLE_MODE;
    }
  }

  // ─── Logic tick (~18fps, 55ms) ────────────────────────────────────────────

  tick() {
    const tickStart = this.spcFlag ? 0 : performance.now();

    if (this.gameMode !== GAME_OVER_MODE) {
      // Snapshot current state for interpolation against this tick's result
      this._savePrevState();
      this.lastTickTime = performance.now();

      // Round advancement
      if (this.rounds[this.round].isNextRound(this.score)) this.round++;

      this.keyOperate();

      // Track damage before collision detection
      const damageBeforeMove = this.damaged;
      this.moveObstacle();

      if (damageBeforeMove === 0 && this.damaged > 0) {
        // Fresh collision this tick: start animation at 1, play sound
        this.damaged = 1;
        this.playBombSound();
      } else if (this.damaged > 0) {
        // Continue existing animation
        if (this.damaged > 20) {
          this.endGame();
        } else {
          this.damaged++;
        }
      }

      // Score increment (play mode only)
      if (this.gameMode === PLAY_MODE) {
        this.score += 20;
        if (this.scFlag) this.scoreLabel.setNum(this.score);
      }
      this.scFlag = !this.scFlag;

      this.shipCounter++;

      // titleCounter advances at logic rate; reset when not on title screen
      if (this.gameMode === TITLE_MODE) {
        this.titleCounter++;
      } else {
        this.titleCounter = 0;
      }
    }

    // Schedule next logic tick
    if (this.spcFlag) {
      this._timerId = setTimeout(() => this.tick(), 0);
    } else {
      const elapsed = performance.now() - tickStart;
      this._timerId = setTimeout(() => this.tick(), Math.max(0, TICK_MS - elapsed));
    }
  }
}
