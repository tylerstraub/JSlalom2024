# JSlalom — Project Guide

## What This Is
HTML5 Canvas restoration of **JSlalom** (1997 Java applet jet ski slalom game by MR-C). Vanilla JS, no build tools, no dependencies. The original decompiled Java source lives in `decomp/` for reference.

This repository contains **two variants**:

| Variant | Entry point | Goal |
|---------|-------------|------|
| **Original** | `index.html` | Pixel-exact restoration — every behavior matches the Java applet |
| **Remaster** | `remaster/index.html` | Fullscreen, 60 fps, anti-aliased — gameplay identical, presentation modernized |

The original is frozen — never modify it. The remaster is the active development target.

## Quick Start
```bash
# Windows
python -m http.server 8080

# macOS / Linux
python3 -m http.server 8080

# Original:  http://localhost:8080/
# Remaster:  http://localhost:8080/remaster/
```

## Repository Layout
```
index.html            Original entry (320×200, pixel-exact)
js/                   Original JS modules (do not modify)
remaster/
  index.html          Remaster entry (fullscreen, 16:10 letterboxed)
  js/                 Remaster JS modules (active development)
    main.js           Bootstrap, resize handling, focus overlay wiring
    game.js           Engine: dual loop (55ms logic + RAF render), interpolation
    drawEnv.js        Canvas 2D rendering — replaces pixel buffer
    ground.js         Ground plane (extended draw distance vs original)
    roundManager.js   Obstacle factory (spawn z pushed further than original)
    [others]          Copied from original — unchanged game logic
audio/
  BOMB.wav            Original explosion sound (recovered from gameplay footage)
jar/
  JSlalom.jar         Original JAR (18 classes + sprites)
decomp/               Decompiled Java source — authoritative behavioral reference
docs/
  architecture.md     Original restoration: full technical reference
  remaster.md         Remaster: rendering pipeline, interpolation, tuning guide
```

## Original — Key Technical Constraints
These apply to `js/` only. Do NOT change any of these in the original.

- **Frame rate**: `setTimeout`-based loop, 55ms delay (~18 FPS). Physics are frame-coupled.
- **Speed mode**: A key (`spcFlag=true`) schedules next tick at 0ms.
- **PRNG**: `Math.imul` for 32-bit integer math. Must stay deterministic for replay.
- **Resolution**: Native 320×200, 1:1 — no CSS scaling.
- **Polygon rendering**: Software scanline rasterizer → `ImageData`. Do NOT use `ctx.fill()` — Canvas 2D anti-aliases, Java's `fillPolygon()` did not.

## Remaster — Key Technical Constraints
These apply to `remaster/js/` only.

- **Game logic is untouched**: all physics, PRNG, collision, round system identical to original.
- **Dual loop**: `setTimeout` at 55ms drives logic; `requestAnimationFrame` drives rendering at 60fps.
- **Interpolation**: `_savePrevState()` snapshots obstacle positions before each tick; render lerps between prev and current using `alpha = (now - lastTickTime) / 55`.
- **Recycling guard**: obstacle pool reuses objects — detect recycled slots by z-delta > 3 units and skip interpolation for that frame.
- **Rendering**: Canvas 2D `ctx.fill()` paths — anti-aliased edges, no pixel buffer.
- **Asset paths**: remaster JS references `../jiki.gif`, `../jiki2.gif`, `../audio/BOMB.wav`.

## Game Flow
Title screen → Space to play → Dodge obstacles → 20 hits = game over → Title screen.
6 rounds at score thresholds: 8K → 12K → 25K → 40K → 100K → 1M.

## Detailed Documentation
- `docs/architecture.md` — Original restoration: full technical reference
- `docs/remaster.md` — Remaster: rendering pipeline, interpolation system, tunable constants

## Conventions
- All colors are `{r, g, b}` objects (0–255), converted to CSS strings at render time.
- Obstacle pool pattern: `Obstacle.newObstacle()` / `obstacle.release()`.
- Java source in `decomp/` is the authoritative reference for behavioral questions.
- In the **original**: `env.drawFace(face)` / `env.drawPolygon(color, points)` write to the pixel buffer; call `env.flush(ctx)` to blit.
- In the **remaster**: `env.setCtx(ctx, w, h)` binds the context each frame; `drawFace`/`drawPolygon` draw immediately; `flush()` is a no-op.
