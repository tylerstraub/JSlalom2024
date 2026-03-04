# JSlalom

A faithful HTML5 restoration of **Jet Slalom**, a 1997 Java applet jet ski slalom game by MR-C.

Dodge obstacles, weave through corridors, and survive as long as you can across 6 increasingly difficult rounds.

## Play

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

Or deploy to any static hosting (GitHub Pages, Netlify, etc.) — no build step required.

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / J | Steer left |
| Arrow Right / L | Steer right |
| Space | Start game |
| C | Continue from last reached stage |
| A | Speed up (hold) |
| D | Watch demo replay |

Touch controls appear on mobile devices.

## About

The original game was a Java applet that no longer runs in modern browsers. This project restores it as a vanilla JavaScript + HTML5 Canvas application, preserving the original physics, rendering, collision detection, and gameplay feel.

- **No dependencies** — vanilla JS with ES modules
- **No build step** — just serve and play
- **Original 320x200 resolution** — CSS-scaled with pixelated rendering

## Project Structure

```
index.html        Game page
js/               JavaScript source (ES modules)
jiki.gif          Player sprite frame 1
jiki2.gif         Player sprite frame 2
decomp/           Original decompiled Java source (18 files)
docs/             Technical documentation
```

## Credits

- **Original game**: MR-C (1997)
- **Restoration**: HTML5 port from decompiled Java source
