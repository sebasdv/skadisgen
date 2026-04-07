# SKADISGEN

A web-based tool for generating laser-cutting patterns compatible with IKEA SKADIS pegboards. Define custom board dimensions, preview the slot pattern in 2D or isometric 3D, and export a DXF file ready for your laser cutter or CNC.

**Live app:** https://sebasdv.github.io/skadisgen/

---

## Features

- Custom board dimensions (100–2000 mm)
- Real-time 2D SVG preview with zoom and pan
- Isometric 3D preview (Three.js, Sobel outlines)
- DXF export — R12 native format (compatible with Rhino, Illustrator, RDWorks, LightBurn)
- Correct dual-grid pattern (Grid A + Grid B, 40 mm step, 20 mm offset)
- Slot dimensions: 5 × 10 mm, 2.5 mm radius

---

## Pattern Specification

| Property | Value |
|---|---|
| Slot size | 5 × 10 mm |
| Corner radius | 2.5 mm |
| Grid step | 40 mm |
| Grid B offset | +20 mm (X and Y) |
| First slot center | 40 mm from each edge |
| Board corner radius | 9 mm |

---

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/) — isometric 3D preview
- DXF R12 export (no external library — hand-written POLYLINE/VERTEX/SEQEND)
- GitHub Actions — automatic deploy to GitHub Pages

---

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

---

## DXF Output

The exported DXF uses the AutoCAD R12 format (`AC1009`) with native `POLYLINE` / `VERTEX` / `SEQEND` entities — no `LWPOLYLINE`. This ensures maximum compatibility across CAD applications and laser cutter software.

Layers:
- `CONTORNO` — board outline with rounded corners (R=9 mm)
- `RANURAS` — slot pattern

---

## License

MIT — see [LICENSE](LICENSE)

---

## Disclaimer

SKADIS is a trademark of Inter IKEA Systems B.V. This project is an independent open-source tool for generating compatible pegboard patterns and is not affiliated with or endorsed by IKEA. The slot pattern dimensions are based on publicly available measurements of the SKADIS pegboard system.
