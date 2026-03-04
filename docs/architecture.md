# JSlalom — Architecture Reference

## Rendering Pipeline

Each frame (55ms):
1. Fill sky with current round's sky color (with 32-frame transition between rounds)
2. Draw ground quad (4 vertices projected through 3D pipeline)
3. Draw all active obstacles (each has 2 visible triangle faces)
4. Draw player sprite (alternates jiki.gif/jiki2.gif every 4 frames, bobs every 12)
5. Draw damage explosion oval if hit
6. Draw title screen overlay if in TITLE_MODE

### 3D Projection (drawEnv.js)
```
For each 3D point (x, y, z):
  scale = 120 / (1 + 0.6 * z)
  rotX = cos * x + sin * (y - 2.0)
  rotY = -sin * x + cos * (y - 2.0) + 2.0
  screenX = rotX * (width/320) * scale + width/2
  screenY = rotY * (height/200) * scale + height/2
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

## File Mapping (JS ← Java)
| JS Module | Java Source | Lines |
|-----------|------------|-------|
| game.js | MainGame.java | 632 |
| drawEnv.js | DrawEnv.java | 58 |
| obstacle.js | Obstacle.java + ObstacleCollection.java | 114 |
| roundManager.js | RoundManager.java | 70 |
| normalRound.js | NormalRound.java | 28 |
| roadRound.js | RoadRound.java | 94 |
| gameRecorder.js | GameRecorder.java | 79 |
| randomGenerator.js | RandomGenerator.java | 16 |
| ground.js | Ground.java | 12 |
| face.js | Face.java | 30 |
| dpoint3.js | DPoint3.java | 20 |
| stringObject.js | StringObject.java | 85 |
| numberLabel.js | NumberLabel.java | 50 |
| main.js | Game3D.java + AppFrame.java | 233 |
