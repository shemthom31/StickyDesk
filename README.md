# 📌 StickyDesk

> A feature-rich sticky notes app with six hand-crafted desk environments — built with **zero runtime dependencies**.

## Overview

StickyDesk lets you scatter sticky notes across six beautifully themed surfaces — from a warm maple student desk to a brushed stainless fridge door. Each surface keeps its own independent set of notes and pages, with everything auto-saved locally.

Built entirely in **vanilla HTML, CSS, and JavaScript** to demonstrate what modern CSS alone can achieve: realistic wood grain, bevelled frames, and detailed decorative props.

---

## Features

**Notes**
- Add, drag, edit, and delete sticky notes freely
- Quick-entry toolbar: bullets `•`, numbered lists `1.`, and checkboxes `☐`
- Click any `☐` in your note to tick it `☑` — click again to untick
- Three font sizes: Small, Medium, Large

**Surfaces**
- 6 themed environments, each with its own independent notes and pages
- Hand-crafted CSS decorative props per surface (pencil, apple, laptop, pen, etc.)
- Drag the props around to customise your layout

**Layout**
- **Free Stick** — notes placed with a natural, slight random tilt
- **Grid Mode** — snap notes to a clean 4-column grid

**Appearance**
- 3 note colour palettes: Themed, Bright, Muted
- Note text colour toggle: Black or White
- All settings persist via `localStorage` — no account needed

---

## Environments

| Surface | Description |
|---------|-------------|
| 🎓 **Student Desk** | Honey maple grain with a carved pencil rest divet; draggable pencil & apple |
| 💼 **Work Desk** | Dark espresso walnut with a cross-hatched leather pad; draggable laptop & pen |
| 🎨 **Art Easel** | Fine linen canvas in a bevelled wood frame; artist palette & brush |
| 🟦 **Whiteboard** | Glossy white in an aluminium frame with a marker tray |
| 🟩 **Chalkboard** | Dark green slate in an oak frame with chalk sticks and a felt eraser |
| 🧲 **Fridge Door** | Brushed stainless steel with a door handle and coloured magnets |

---

## Getting Started

```bash
npm install
npm run dev        # Dev server → http://localhost:5173
```

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 |
| Styling | CSS3 — gradients, SVG noise textures, animations |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Build tool | [Vite](https://vitejs.dev/) |
| Storage | `localStorage` (no backend required) |

---

## Project Structure

```
StickyDesk/
├── index.html        # App shell & settings panel
├── app.js            # All application logic
├── styles.css        # All styles — environments, notes, UI
└── package.json      # Vite dev dependency only
```

---

## License

MIT — free to use, fork, and build upon.
