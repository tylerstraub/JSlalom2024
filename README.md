# JSlalom

A faithful HTML5 restoration of **Jet Slalom**, a 1997 Java applet jet ski slalom game by MR-C.

Dodge obstacles, weave through corridors, and survive as long as you can across 6 increasingly difficult rounds.

## Play

**[Play the Remaster on GitHub Pages](https://tylerstraub.github.io/JSlalom2024/)**

Or run locally:

```bash
# macOS / Linux
python3 -m http.server 8080

# Windows
python -m http.server 8080
```

- Remaster: http://localhost:8080/
- Original (archive): http://localhost:8080/original/

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / J | Steer left |
| Arrow Right / L | Steer right |
| Space | Start game |
| D | Watch hi-score demo replay |

Touch controls appear automatically on mobile devices.

### Original-only controls (archive version)

| Key | Action |
|-----|--------|
| C | Continue from last reached stage |
| A | Speed up (hold) |
| T | Jump to round 6 (test mode) |

## About

The original game was a Java applet that no longer runs in modern browsers. This project restores it as a vanilla JavaScript + HTML5 Canvas application, preserving the original physics, rendering, collision detection, gameplay feel, and audio.

- **No dependencies** — vanilla JS with ES modules
- **No build step** — just serve and play
- **Original audio** — explosion sound recovered from original gameplay footage

## Project Structure

```
index.html        Remaster entry (fullscreen, 60fps, anti-aliased)
js/               Remaster JavaScript source (ES modules)
original/
  index.html      Original entry (320×200, pixel-exact, ~18fps)
  js/             Original JavaScript source — frozen, archive only
audio/            Sound files (BOMB.wav)
jiki.gif          Player sprite frame 1
jiki2.gif         Player sprite frame 2
decomp/           Original decompiled Java source (18 files)
jar/              Original JAR file
docs/             Technical documentation
```

## Credits

- **Original game**: MR-C (1997)
- **Restoration**: HTML5 port from decompiled Java source
- **Remaster**: Tyler Straub (2024)
