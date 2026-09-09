# 3D bull mascot

Drop a 3D bull model here as **`bull.glb`** (exact filename/path: `/models/bull.glb`).

As soon as it exists, the homepage guide (`vendor/mc-guide.js`) auto-detects it (HEAD check),
lazy-loads Google's `<model-viewer>`, and replaces the SVG bull with the rotatable 3D model —
**no code change needed**. Until then, the lightweight inline-SVG bull is shown and the guided
tour still works, so there is zero performance cost from 3D.

## Asset guidelines
- **Format:** `.glb` (binary glTF), single file.
- **Size:** keep it small — aim for **< 1.5 MB** (ideally < 800 KB). Decimate/compress with
  Draco or `gltf-transform optimize` before adding. It's lazy-loaded, but smaller = snappier.
- **Style:** friendly/cute bull, on-brand green (#34B350) if possible; centered, facing forward.
- **Orientation:** model should look good with `auto-rotate` (Y-up, centered at origin).

## Where to get one
- Commission a modeller (Fiverr/Upwork), or
- Free/licensed sources (check the licence!): Sketchfab (downloadable + CC), Poly Pizza, Quaternius.
- Convert/optimize: https://gltf.report or `npx @gltf-transform/cli optimize in.glb bull.glb`.

## Tune the look (optional)
`<model-viewer>` attributes are set in `vendor/mc-guide.js` (`camera-controls`, `auto-rotate`,
`disable-zoom`, `shadow-intensity`). Adjust there if you want zoom, a different camera, or AR.
