# JSlalom — Architecture Reference

## Game Loop

The loop uses `setTimeout`-based self-scheduling (not `setInterval`) so that speed mode can truly skip the wait. Timing is compensated to match Java's `TimerNotifier` semantics: the timer fired every 55ms from when it *last fired* (independent of tick cost), so we subtract elapsed tick time from the budget:

```javascript
tick() {
  const tickStart = performance.now();
  // ... game logic ...
  const elapsed = performance.now() - tickStart;
  this._timerId = setTimeout(() => this.tick(), Math.max(0, 55 - elapsed));
}
```

- **Normal**: ~55ms per frame measured from tick *start* → ~18 FPS, matching Java's `TimerNotifier` interval behaviour
- **Speed mode (A held)**: 0ms delay → browser fires ASAP, matching Java's uncapped loop when `spcFlag` is true

## Rendering Pipeline

Each frame (55ms nominal):
1. Clear `ImageData` pixel buffer with sky color
2. Draw ground quad into pixel buffer (scanline fill)
3. Draw all active obstacles into pixel buffer (scanline fill, each has 2 triangle faces)
4. Blit pixel buffer to canvas via `ctx.putImageData()`
5. Draw player sprite with `imageSmoothingEnabled = false` (nearest-neighbor, matches Java's pixel-level rendering; alternates jiki.gif/jiki2.gif every 4 frames, bobs every 12)
6. Draw damage explosion oval if hit (`ctx.ellipse`)
7. Draw title screen text overlay if in TITLE_MODE (`ctx.fillText`)

### Pixel-Exact Polygon Rendering (drawEnv.js)
All polygon fills (ground, obstacles) write directly to a `Uint8ClampedArray` (`ImageData`) using a software scanline rasterizer, then blit the whole buffer at once with `ctx.putImageData()`. This matches Java's `fillPolygon()` behavior — hard-edged integer pixels, no anti-aliasing.

Text and the bomb ellipse use Canvas 2D directly (AA retained, matching the original Java AWT rendering).

### Scanline Rasterizer
```
For each polygon (n vertices, integer screen coords):
  yMin = min(v.y), yMax = max(v.y)
  For y = yMin to yMax:
    For each non-horizontal edge (v1, v2):
      if yLo <= y <= yHi: x = v1.x + (y - v1.y) * (v2.x - v1.x) / (v2.y - v1.y)
    Fill pixel buffer from xLeft to xRight at row y
```

### 3D Projection (drawEnv.js)
```
For each 3D point (x, y, z):
  scale = 120 / (1 + 0.6 * z)
  rotX = cos * x + sin * (y - 2.0)
  rotY = -sin * x + cos * (y - 2.0) + 2.0
  screenX = (rotX * scale | 0) + 160
  screenY = (rotY * scale | 0) + 100
```
Rotation is driven by player velocity (sin/cos lookup from 128-entry table).

### Face Lighting
```
brightness = |cross_product_of_edges| / face.maxZ
finalColor = baseColor * brightness
```

## Physics Constants

| Property | Value | Notes |
|----------|-------|-------|
| Acceleration | ±0.1/frame | When arrow key held |
| Max velocity | ±0.6 | Clamped |
| Friction | 0.025/frame | When no input |
| Obstacle speed | -1.0 z/frame | Constant approach speed |
| Collision z | ≤ 1.1 | When obstacle reaches player |
| Player width | 0.7 | Half-width for collision |
| Score rate | +20/frame | Every frame in PLAY_MODE |
| Damage limit | 20 hits | Game over |

## Round System

| Round | Type | Score Threshold | Sky Color | Ground Color | Param |
|-------|------|----------------|-----------|--------------|-------|
| 1 | Normal | 8,000 | (0,160,255) | (0,200,64) | interval=4 |
| 2 | Normal | 12,000 | (240,160,160) | (64,180,64) | interval=3 |
| 3 | Normal | 25,000 | black | (0,128,64) | interval=2 |
| 4 | Road | 40,000 | (0,180,240) | (0,200,64) | solid road |
| 5 | Road | 100,000 | lightGray | (64,180,64) | broken road |
| 6 | Normal | 1,000,000 | black | (0,128,64) | interval=1 |

### NormalRound
Spawns one obstacle every `interval` frames at a random x position (range: -16 to +16 world units).

### RoadRound
Two boundary walls (OX1, OX2) that move together. Road narrows from width 34 to ~9 units, then snakes left/right. Broken road mode has random gaps where safe passage exists outside the corridor.

## Obstacle System

### Geometry
4 vertices forming a diamond shape:
- p[0]: (x-w, 2.0, 25.5) — left
- p[1]: (x, -1.4, 25.0) — top
- p[2]: (x+w, 2.0, 25.5) — right
- p[3]: (x, 2.0, 24.5) — bottom/front

2 visible faces (triangles): front (brighter) and back (normal color).

### Object Pool
Pre-allocates 16 obstacles. `newObstacle()` pulls from pool, `release()` returns to pool and unlinks from active list.

### Obstacle Colors
Randomly chosen from: lightGray, (96,160,240), (200,128,0), (240,210,100).

## Collision Detection
```
if obstacle.points[0].z <= 1.1:
  halfWidth = playerWidth * cos(rotation)
  if -halfWidth < obstacle.points[2].x AND obstacle.points[0].x < halfWidth:
    HIT
```

## Input Recording (gameRecorder.js)
- 2 bits per frame: bit 0 = left, bit 1 = right
- Packed 16 inputs per 32-bit integer
- Buffer: 2048 ints = 32,768 frames max
- Deterministic replay: same seed → same PRNG → same obstacles

## PRNG (randomGenerator.js)
```
seed = (seed * 1593227 + 13) as 32-bit signed integer
return seed >>> 16  (upper 16 bits, unsigned)
```
Uses `Math.imul()` for exact 32-bit multiplication matching Java.

## Game States
- **TITLE_MODE (1)**: Shows title, author, start instructions. Background obstacles still render.
- **PLAY_MODE (0)**: Active gameplay. Score increments. Input recorded.
- **DEMO_MODE (2)**: Replays recorded input from hi-score run.
- **GAME_OVER_MODE (3)**: Post-crash interstitial. Game loop keeps ticking but `keyOperate / moveObstacle / prt` are skipped, so the canvas is frozen on the last rendered frame. The game-over overlay (Play Again / Send Record) is shown by `main.js` via the `onGameOver(isNewRecord)` callback. Transitions to TITLE_MODE when Play Again is clicked.

## Leaderboard

The original applet used a server-side CGI (`regist.cgi`) and a flat file (`rank.dat`) for a shared online leaderboard. That infrastructure is long gone. This restoration uses `localStorage` instead.

### Storage keys
| Key | Contents |
|-----|----------|
| `jslalom_hiscore` | Personal best score (integer string) |
| `jslalom_hiscoreRec` | JSON-serialised `GameRecorder` for the hi-score run (used by demo mode) |
| `jslalom_rankings` | JSON array of `{ score, name }` objects, up to 20 entries, sorted descending |

### Game-over overlay
After a play-mode crash, `GAME_OVER_MODE` activates and `main.js` shows an overlay with:
- **Play Again** — returns to title without saving a ranking entry
- **Send Record** + name input — saves `{ score, name }` to `jslalom_rankings`. The button is disabled until the player types a non-empty name; after a successful submission the entire row (button + input) is hidden, leaving only Play Again.

### Title screen ranking display
The top 10 submitted scores are shown in two pages of 5 during the title screen animation (pages cycle every 100 frames). Up to 20 scores are retained in storage; only the top 10 are displayed.

## Deliberate divergences from original Java source

The decompiled `Game3D.java` contains a `TextField` ("No name") and `Button` ("Ok") that are **instantiated but never added to any AWT panel** and never wired with listeners — dead code in the version we have. The game always submitted scores as "No name" to the server.

This restoration intentionally improves on that behaviour:
- A **game-over interstitial screen** (not present in the decompiled source, but visible in archived gameplay footage of a different build) lets the player name their score before it is recorded.
- The hi-score footer label reads **"Hi-score:"** rather than the original **"Your Hi-score:"** to reflect that multiple players may share the same browser profile.

## Audio
`BOMB.wav` is preloaded into a Web Audio API buffer at `initAudio()` time (called when the player first starts a game). `playBombSound()` plays the buffer on every collision hit (damaged === 1).

The original `bomb.au` was not bundled in the JAR — it was served separately from the 1997 web server. The WAV in `audio/` was recovered from original gameplay footage.

## Damage Animation
Expanding ellipse centered at (centerX, 186*h/200). Each frame: `damaged++`, radius grows by 8px×4px. Color fades from white to red over 20 frames. At damaged > 20 → game over.

## Continue System
- Press C at title to continue from last reached round
- Score starts at that round's threshold
- Continue counter increments; penalty = contNum × 1000 subtracted from hi-score

## Sprite Animation
- `jiki.gif` / `jiki2.gif` alternate every 4 frames
- Vertical bob: y oscillates between 22–24 pixels from bottom every 12 frames
- Entry animation: sprite rises from bottom during first 200 score points (10 frames)

## Key Mappings
| Key | Code | Behavior |
|-----|------|----------|
| Arrow Left / J | 37 / 74 | Steer left |
| Arrow Right / L | 39 / 76 | Steer right |
| A | 65 | Speed mode (hold) — uncapped FPS |
| Space / C | 32 / 67 | Start / continue game |
| D | 68 | Start demo replay |
| T | 84 | Test mode (jump to round 6) |
| G | 71 | No-op — mirrors Java's `System.gc()` call |

## File Mapping (JS ← Java)
| JS Module | Java Source |
|-----------|------------|
| game.js | MainGame.java |
| drawEnv.js | DrawEnv.java |
| obstacle.js | Obstacle.java + ObstacleCollection.java |
| roundManager.js | RoundManager.java |
| normalRound.js | NormalRound.java |
| roadRound.js | RoadRound.java |
| gameRecorder.js | GameRecorder.java |
| randomGenerator.js | RandomGenerator.java |
| ground.js | Ground.java |
| face.js | Face.java |
| dpoint3.js | DPoint3.java |
| stringObject.js | StringObject.java |
| numberLabel.js | NumberLabel.java |
| main.js | Game3D.java + AppFrame.java |

Not ported (infrastructure only):
- `TimerNotifier.java` → replaced by `setTimeout`
- `DrawObject.java` → empty abstract base class; JS uses duck typing
