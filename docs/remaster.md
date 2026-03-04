# JSlalom Remaster — Technical Reference

## Overview

`remaster/` is a modernised presentation layer built on top of the original restored engine. The goal is a fullscreen, 60 fps, anti-aliased experience that feels like a contemporary indie game while keeping gameplay behaviour bit-for-bit identical to the 1997 Java applet.

**What changes**: rendering pipeline, frame timing, canvas resolution, visual polish, continue system removed.
**What doesn't change**: physics, PRNG, collision detection, round system, replay recording — all untouched.

---

## Dual-Loop Architecture

The original uses a single `setTimeout`-based loop at ~18 fps where rendering and logic are coupled. The remaster separates them:

```
setTimeout (55ms)          requestAnimationFrame (60fps)
─────────────────          ─────────────────────────────
_savePrevState()      →    alpha = (now - lastTickTime) / 55
keyOperate()               _renderFrame(alpha)
moveObstacle()               clearBuffer (sky lerp)
score / damage update        ground draw
shipCounter++                _drawObstaclesInterpolated(alpha)
titleCounter++               _drawShip(alpha)
lastTickTime = now           _drawBomb(alpha)   [if hit]
schedule next tick           showTitle()        [if title mode]
```

The render loop reads `lastTickTime` (set at the start of each logic tick) to compute `alpha ∈ [0, 1]` — how far through the current 55ms window we are. All moving entities are drawn at their interpolated position.

---

## Interpolation System

### Snapshot (before each tick)
`_savePrevState()` is called at the top of `tick()`, before any state changes:
- `_prevVx` — player velocity (drives world rotation)
- `_prevShipCounter` — for smooth sprite bob
- `_prevLogicScore` — for smooth ship entry animation
- `_prevDamaged` — for smooth bomb expansion
- `_prevSkyColor`, `_prevGroundColor` — for sub-tick color lerp
- `_prevSnapshots` — `Map<obstacle, [{x,y,z}×4]>` of all active obstacle positions

### Rendering interpolated positions
```javascript
// Rotation from lerped velocity
const interpVx = prevVx + alpha * (vx - prevVx);
const idx = min(127, |interpVx| * 100 | 0);
env.nowSin = si[idx] * (interpVx > 0 ? -1 : 1);
env.nowCos = co[idx];

// Obstacle positions
for each point i of obstacle:
  points[i].xyz = prev[i].xyz + alpha * (cur[i].xyz - prev[i].xyz)
ob.draw(env)
// restore points
```

### Object pool recycling guard
The obstacle pool reuses JS objects. If a released slot is immediately allocated to a new obstacle, `_prevSnapshots` still holds the old obstacle's positions — lerping from z≈1 (release point) to z≈40 (spawn point) would produce a full-screen streak.

**Fix**: before interpolating, check `|prev[0].z - cur[0].z|`. Each tick moves z by exactly 1.0; any delta > 3 means the slot was recycled. Draw at current position with no interpolation.

---

## Rendering Pipeline

### Original (`js/drawEnv.js`)
```
clearBuffer(r,g,b)     → fill Uint8ClampedArray
drawPolygon / drawFace → scanline rasterizer → Uint8ClampedArray
flush(ctx)             → ctx.putImageData()
```
Hard-edged integer pixels, no anti-aliasing. Matches Java's `fillPolygon()` exactly.

### Remaster (`remaster/js/drawEnv.js`)
```
setCtx(ctx, w, h)      → bind context + dimensions for this frame
clearBuffer(r,g,b)     → ctx.fillRect (full canvas)
drawPolygon / drawFace → ctx.beginPath() / lineTo / fill()
flush()                → no-op
```
Canvas 2D anti-aliasing gives smooth polygon edges at any resolution.

### Projection scaling
The 3D→2D projection formula is unchanged. Output coordinates are scaled from virtual 320×200 space to actual canvas size:
```javascript
_project(p):
  scale = 120 / (1 + 0.6 * p.z)
  rotX  = cos * p.x + sin * (p.y - 2)
  rotY  = -sin * p.x + cos * (p.y - 2) + 2
  return {
    x: (rotX * scale + 160) * (canvasW / 320),
    y: (rotY * scale + 100) * (canvasH / 200)
  }
```

---

## Visual Enhancements

### Spike rise (obstacle emergence)
Obstacles spawn flush with the water surface and extend upward to full height over a short z window, like spikes rising from the water:
```javascript
_obstacleRiseT(z):
  FAR  = 40.5   // spawn z — apex squashed to ground plane (y=2.0)
  NEAR = 38     // fully risen by here (~2.5 units = ~137ms of travel)
  return clamp((FAR - z) / (FAR - NEAR), 0, 1)
```
Only `points[1]` (the apex, at y=−1.4) is affected — the three base points at y=2.0 stay planted. Apex y is lerped: `apexY = 2.0 + (realApexY - 2.0) * riseT`. Because the interpolated z is used (not the discrete per-tick value), the animation is perfectly smooth at 60fps.

### Extended ground plane
Original ground: z = 0.1 → 28. Remaster: z = 0.1 → 55. Gives more visible terrain depth toward the horizon, reducing the hard "floor edge" at the original draw distance.

### Extended obstacle spawn distance
Original spawn: z ≈ 25.5. Remaster spawn: z ≈ 40.5. Obstacles are visible for ~39 logic ticks (~2.1s) before reaching the player vs the original ~24 ticks (~1.3s). Combined with the spike-rise emergence, they visibly grow out of the water as they approach.

### Smooth ship bob
Original: step function (`shipCounter % 12 > 6` → 2px up). Remaster: continuous sine wave:
```javascript
const interpCounter = prevShipCounter + alpha * (shipCounter - prevShipCounter);
const bobY = Math.sin(interpCounter * Math.PI / 6) * bobAmplitude;
```

### Dynamic ship shadow
A blurred ellipse drawn on the water surface directly below the ship sprite (painted before the sprite so it sits underneath):
- Shifts laterally with `interpVx`: banking right moves the shadow right, selling the lean
- Pulses with the sine bob: when the ship crests up (`bobNorm ≈ 1`), the ellipse shrinks ~12% and dims; at the bottom of the bob it swells back
- Rendered with `ctx.filter = blur(Xpx)` where X = `5 * canvasWidth / 320`, for a feathered cast-shadow edge
- Color: `rgb(0, 20, 60)` at ~32% opacity

### Sprite scaling
`ctx.imageSmoothingEnabled = false` — nearest-neighbor scaling for the jet ski sprites, same as the original. Bilinear smoothing produced noticeable blur on the small pixel-art source images at high resolution.

### Pause system
When focus is lost the game fully pauses — the logic tick (`setTimeout`) is cleared so physics, score, and damage are frozen. A CSS overlay dims the scene and shows a pulsing `▶ Click to resume` prompt. Clicking the canvas (or any event that refocuses it) resumes the tick with a fresh `lastTickTime` to avoid interpolation glitches.

Pause triggers:
- **Tab switch / alt-tab**: `window.blur` event (fires regardless of which DOM element has focus within the page)
- **In-page focus loss**: canvas `blur` event (e.g. clicking outside the canvas while staying on the tab)
- **Escape key**: calls `triggerPause()` directly, then `canvas.blur()` to move DOM focus away

The game-over overlay takes priority — `triggerPause()` is a no-op while `overlay.style.display === 'flex'`.

### Canvas resize during game-over
`_renderFrame()` previously returned early in `GAME_OVER_MODE` as a minor optimisation. Resizing the canvas clears it to black, and the early return meant the scene was never redrawn while the game-over panel was up. The guard was removed; the game-over panel is a DOM element above the canvas so rendering underneath it is harmless.

---

## Tunable Constants

| Constant | File | Current value | Effect |
|----------|------|---------------|--------|
| Obstacle spawn z | `remaster/js/roundManager.js` `createObstacle()` | `40.5 / 40.0 / 39.5` | How far away obstacles first appear |
| Rise FAR | `remaster/js/game.js` `_obstacleRiseT()` | `40.5` | Should match spawn z — apex fully squashed here |
| Rise NEAR | `remaster/js/game.js` `_obstacleRiseT()` | `38` | Apex fully extended; raise toward FAR for a snappier rise |
| Ground depth | `remaster/js/ground.js` | `55` | How far the terrain plane extends into the horizon |
| Recycling guard | `remaster/js/game.js` `_drawObstaclesInterpolated()` | `zDelta < 3` | Threshold to detect pool-recycled obstacle slots |
| Spawn compensation | `remaster/js/roundManager.js` `createObstacleRandom()` | `39` ticks | Lead time used to offset spawn x by `−vx × 39`; matches z-travel from spawn (40.5) to collision zone (1.1) |

---

## Canvas & Layout

- Canvas is sized by JS to fill the viewport at **16:10 aspect ratio** (letterboxed with black bars if needed).
- All game positions use `x * (width/320)` and `y * (height/200)` scaling — the same proportional formulas as the original, just with actual canvas dimensions substituted for 320/200.
- Fonts scale: `Math.round(basePx * Math.sqrt(width / 320))` — square-root of the linear scale factor, so fonts grow with the canvas but not as aggressively as a direct proportion. At 1280 px wide (4× original) the title is 72 px rather than 144 px.
- `onResize(w, h)` is called by `main.js` on `window.resize` — updates `game.width/height/centerX/centerY` and recreates all StringObjects.

---

## Asset Paths

The remaster lives in `remaster/` but shares assets from the repository root:

| Asset | Path from remaster JS |
|-------|-----------------------|
| Sprite frame 1 | `../jiki.gif` |
| Sprite frame 2 | `../jiki2.gif` |
| Bomb sound | `../audio/BOMB.wav` |

---

## File Differences from Original

| File | Status | Notes |
|------|--------|-------|
| `index.html` | Rewritten | Fullscreen canvas, HUD overlay, modern game-over panel, focus overlay |
| `js/main.js` | Rewritten | Letterbox resize, focus overlay wiring |
| `js/game.js` | Rewritten | Dual loop, interpolation, separated render from tick logic |
| `js/drawEnv.js` | Rewritten | Canvas 2D paths, scale-aware projection, no pixel buffer |
| `js/ground.js` | Modified | Extended draw distance (z=55 vs z=28) |
| `js/roundManager.js` | Modified | Obstacle spawn z pushed from 25.5 → 40.5; velocity-compensated spawn x so obstacles always arrive at their random position regardless of banking angle |
| `js/stringObject.js` | Copied | Unchanged — StringObject API is the same |
| All other `js/` | Copied | Unchanged — game logic, PRNG, rounds, recorder, obstacle pool |

---

## Remaster-specific Gameplay Changes

### Continue system removed
The original allowed pressing **C** at the title screen to resume from the last reached round, applying a `contNum × 1000` penalty against the hi-score. The remaster removes this entirely:

- No C key continue
- Every run starts at round 1, score 0
- Hi-score is the raw score with no deduction
- The "Continue penalty" HUD field is gone
- The T-key debug cheat (jump to round 6) is also removed

**Rationale**: without a universal penalty formula, continue scores are not comparable to clean runs. Starting from scratch every time makes the leaderboard meaningful — rank reflects how far you got in a single run.

---

## Planned Work

- **Sprite upscaling**: the sprites are drawn nearest-neighbor from 104×16 source GIFs. A higher-resolution source (via AI upscaler, xBR algorithm, or hand-redraw) would give smoother results at large canvas sizes.
