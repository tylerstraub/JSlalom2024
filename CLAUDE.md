# JSlalom — Project Guide

## What This Is
HTML5 Canvas restoration of **JSlalom** (1997 Java applet jet ski slalom game by MR-C). Vanilla JS, no build tools, no dependencies. The original decompiled Java source lives in `decomp/` for reference.

## Quick Start
```bash
# macOS / Linux
python3 -m http.server 8080

# Windows
python -m http.server 8080

# Open http://localhost:8080
```

## Architecture at a Glance
```
index.html          Entry page (320×200 canvas, CSS-scaled 2×)
js/
  main.js           Bootstrap: image loading, input binding, game init
  game.js           Core engine (game loop, physics, rendering, states)
  drawEnv.js        3D→2D projection (perspective + rotation + lighting)
  obstacle.js       Obstacle entity + object pool + linked list collection
  roundManager.js   Base round class (color transitions, obstacle factory)
  normalRound.js    Random obstacle spawning (4 difficulty intervals)
  roadRound.js      Corridor obstacles with moving boundaries
  gameRecorder.js   2-bit packed input recording for deterministic replay
  randomGenerator.js  Seeded PRNG (must match Java's 32-bit integer math)
  ground.js         Ground plane quad
  dpoint3.js        3D point (x, y, z)
  face.js           Triangle face with surface normal for lighting
  stringObject.js   Canvas text rendering with alignment
  numberLabel.js    6-digit score DOM display
audio/
  BOMB.wav          Original explosion sound (recovered from gameplay footage)
jar/
  JSlalom.jar       Original JAR (18 classes + sprites; no audio bundled)
decomp/             Decompiled Java source — authoritative behavioral reference
```

## Key Technical Constraints
- **Frame rate**: `setTimeout`-based loop, 55ms delay normally (~18 FPS). Physics are frame-coupled — do NOT decouple.
- **Speed mode**: When A is held (`spcFlag=true`), next tick is scheduled at 0ms — matching Java's "skip the wait" behavior for truly uncapped FPS.
- **PRNG**: Uses `Math.imul` for 32-bit integer math. Must stay deterministic for replay.
- **Resolution**: Native 320×200, CSS-scaled with `image-rendering: pixelated`.
- **No build tools**: ES modules loaded via `<script type="module">`. Must work with a static file server.
- **Polygon rendering**: Ground and obstacles use a software scanline rasterizer writing to an `ImageData` pixel buffer (`drawEnv.js`). Do NOT use `ctx.fill()` for game-world polygons — Canvas 2D anti-aliases edges, Java's `fillPolygon()` did not. Text and the bomb ellipse use Canvas 2D directly (AA is correct there, matching original Java AWT).

## Game Flow
Title screen → Space to play → Dodge obstacles → 20 hits = game over → Title screen.
6 rounds at score thresholds: 8K → 12K → 25K → 40K → 100K → 1M.

## Detailed Documentation
See `docs/architecture.md` for full technical reference (physics values, rendering pipeline, round system, collision math, recording format).

## Conventions
- All colors are `{r, g, b}` objects (0–255), converted to CSS strings at render time.
- Obstacle pool pattern: `Obstacle.newObstacle()` / `obstacle.release()`.
- Java source in `decomp/` is the authoritative reference for any behavioral questions.
- `env.drawFace(face)` and `env.drawPolygon(color, points)` do NOT take a `ctx` parameter — they write to the internal pixel buffer. Call `env.flush(ctx)` once per frame to blit.
