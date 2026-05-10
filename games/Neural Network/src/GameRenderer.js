// src/GameRenderer.js
// Renders a SnakeGame onto a PixiJS Application.
// Supports live resize — call resize(availablePx) whenever the panel changes size.

import * as PIXI from 'pixi.js';
import { GRID, DIRS } from './Snake.js';

const GAP        = 1;     // gap between cells (px)
const MIN_CELL   = 8;
const MAX_CELL   = 48;

// Colours
const C_BG    = 0x080810;
const C_GRID  = 0x0e0e1e;
const C_FOOD  = 0xff4466;
const C_HEAD  = 0x7c6ff7;
const C_BODY  = 0x4040b0;
const C_BODY2 = 0x2a2a7a;
const C_DEAD  = 0x333340;
const C_EYE   = 0xffffff;

export class GameRenderer {
  constructor(canvas) {
    this._canvas  = canvas;
    this._cell    = 22;           // current cell size in px
    this._size    = GRID * 22;   // current canvas size in px

    this.app = new PIXI.Application();
    this._ready = this.app.init({
      canvas,
      width:           this._size,
      height:          this._size,
      backgroundColor: C_BG,
      antialias:       false,
    });

    this._built   = false;
    this.graphics = null;
  }

  async ensureReady() {
    await this._ready;
    if (!this._built) {
      this.graphics = new PIXI.Graphics();
      this.app.stage.addChild(this.graphics);
      this._built = true;
    }
  }

  /**
   * Call this whenever the game panel changes size.
   * availablePx — the smaller of panel width and panel height (minus padding).
   */
  resize(availablePx) {
    const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(availablePx / GRID)));
    if (cell === this._cell) return;   // nothing changed
    this._cell = cell;
    this._size = GRID * cell;
    this.app.renderer.resize(this._size, this._size);
  }

  get currentSize() { return this._size; }

  // ── Internal helpers ────────────────────────────────────────

  get _cellDraw() { return this._cell - GAP; }

  _drawGrid(g) {
    const cell = this._cell;
    const draw = this._cellDraw;
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        g.rect(col * cell, row * cell, draw, draw);
        g.fill({ color: C_GRID });
      }
    }
  }

  /**
   * Render one frame from a SnakeGame instance.
   * @param {import('./Snake.js').SnakeGame} game
   */
  render(game) {
    if (!this.graphics) return;
    const g    = this.graphics;
    const cell = this._cell;
    const draw = this._cellDraw;

    g.clear();
    this._drawGrid(g);

    const alive = game.alive;
    const body  = game.body;

    // Body segments
    for (let i = body.length - 1; i >= 1; i--) {
      const seg = body[i];
      const t   = i / body.length;
      const col = alive ? lerpColor(C_BODY, C_BODY2, t) : C_DEAD;
      g.rect(seg.x * cell, seg.y * cell, draw, draw);
      g.fill({ color: col });
    }

    // Head
    const head    = body[0];
    const headCol = alive ? C_HEAD : C_DEAD;
    const radius  = Math.max(2, Math.floor(this._cell / 5));
    g.roundRect(head.x * cell, head.y * cell, draw, draw, radius);
    g.fill({ color: headCol });

    // Eyes (only when alive and cell big enough)
    if (alive && cell >= 10) {
      const d  = DIRS[game.dir];
      const ex = head.x * cell + draw / 2 + d.x * (cell * 0.22);
      const ey = head.y * cell + draw / 2 + d.y * (cell * 0.22);
      const px = -d.y, py = d.x;
      const er = Math.max(1, cell / 10);
      const ep = cell * 0.14;
      g.circle(ex + px * ep, ey + py * ep, er);
      g.fill({ color: C_EYE });
      g.circle(ex - px * ep, ey - py * ep, er);
      g.fill({ color: C_EYE });
    }

    // Food diamond
    const f  = game.food;
    const cx = f.x * cell + draw / 2;
    const cy = f.y * cell + draw / 2;
    const r  = Math.max(3, cell * 0.25);
    g.poly([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy]);
    g.fill({ color: C_FOOD });

    // Score dots along top edge
    if (game.score > 0) {
      const dotSz  = Math.max(2, Math.floor(cell / 8));
      const dotGap = dotSz + 1;
      const maxDots = Math.floor(this._size / dotGap);
      const dots = Math.min(game.score, maxDots);
      for (let i = 0; i < dots; i++) {
        g.rect(i * dotGap + 2, 2, dotSz, dotSz);
        g.fill({ color: C_FOOD });
      }
    }
  }
}

// Linearly interpolate between two hex colours
function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}