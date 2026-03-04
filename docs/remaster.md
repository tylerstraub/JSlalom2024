# JSlalom Remaster — Technical Reference

## Overview

`remaster/` is a modernised presentation layer built on top of the original restored engine. The goal is a fullscreen, 60 fps, anti-aliased experience that feels like a contemporary indie game while keeping gameplay behaviour bit-for-bit identical to the 1997 Java applet.

**What changes**: rendering pipeline, frame timing, canvas resolution, visual polish.
**What doesn't change**: physics, PRNG, collision detection, round system, score math, replay recording — all untouched.

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

### Distance fog (obstacle fade-in)
Obstacles spawn at z≈40.5 and fade from transparent to fully opaque over a short z window, eliminating pop-in:
```javascript
_obstacleFogAlpha(interpZ):
  FAR  = 40.5   // fully transparent at spawn
  NEAR = 36     // fully opaque from here (~220ms of travel)
  return clamp((FAR - interpZ) / (FAR - NEAR), 0, 1)
```
Uses `ctx.globalAlpha` — perfectly smooth at 60fps because `interpZ` is the interpolated z, not the discrete per-tick z.

### Extended ground plane
Original ground: z = 0.1 → 28. Remaster: z = 0.1 → 55. Gives more visible terrain depth toward the horizon, reducing the hard "floor edge" at the original draw distance.

### Extended obstacle spawn distance
Original spawn: z ≈ 25.5. Remaster spawn: z ≈ 40.5. Obstacles are visible for ~39 logic ticks (~2.1s) before reaching the player vs the original ~24 ticks (~1.3s). Combined with fog fade-in, they materialize gradually from the distance.

### Smooth ship bob
Original: step function (`shipCounter % 12 > 6` → 2px up). Remaster: continuous sine wave:
```javascript
const interpCounter = prevShipCounter + alpha * (shipCounter - prevShipCounter);
const bobY = Math.sin(interpCounter * Math.PI / 6) * bobAmplitude;
```

### Sprite scaling
`ctx.imageSmoothingEnabled = true` with `imageSmoothingQuality = 'high'` for bilinear upscaling of the jet ski sprites. (Nearest-neighbor is used in the original.)

### Focus overlay
When the canvas loses focus, a CSS overlay dims the scene and shows a pulsing `▶ Click to resume` prompt — replacing the original in-canvas `"Click!!"` StringObject. Implemented entirely in CSS/DOM; the game render is unaffected.

---

## Tunable Constants

| Constant | File | Current value | Effect |
|----------|------|---------------|--------|
| Obstacle spawn z | `remaster/js/roundManager.js` `createObstacle()` | `40.5 / 40.0 / 39.5` | How far away obstacles first appear |
| Fog FAR | `remaster/js/game.js` `_obstacleFogAlpha()` | `40.5` | Should match spawn z — start of fade |
| Fog NEAR | `remaster/js/game.js` `_obstacleFogAlpha()` | `36` | End of fade; raise toward FAR for quicker fade |
| Ground depth | `remaster/js/ground.js` | `55` | How far the terrain plane extends into the horizon |
| Recycling guard | `remaster/js/game.js` `_drawObstaclesInterpolated()` | `zDelta < 3` | Threshold to detect pool-recycled obstacle slots |

---

## Canvas & Layout

- Canvas is sized by JS to fill the viewport at **16:10 aspect ratio** (letterboxed with black bars if needed).
- All game positions use `x * (width/320)` and `y * (height/200)` scaling — the same proportional formulas as the original, just with actual canvas dimensions substituted for 320/200.
- Fonts scale: `Math.round(basePx * width / 320)`.
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
| `js/roundManager.js` | Modified | Obstacle spawn z pushed from 25.5 → 40.5 |
| `js/stringObject.js` | Copied | Unchanged — StringObject API is the same |
| All other `js/` | Copied | Unchanged — game logic, PRNG, rounds, recorder, obstacle pool |

---

## Planned Work

- **Sprite upscaling**: replace `jiki.gif` / `jiki2.gif` with higher-resolution sprites. Research underway into upscaling approach (AI upscaling, hand-drawn redraw, or procedural recreation). The remaster already uses bilinear smoothing; a higher-res source image would eliminate the remaining blurriness.
