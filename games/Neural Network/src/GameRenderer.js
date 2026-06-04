// src/GameRenderer.js
// Renders a SnakeGame onto a PixiJS Application.
import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@8.3.4/dist/pixi.min.mjs";
import { GRID, DIRS } from './Snake.js';

const GAP        = 1;
const MIN_CELL   = 8;
const MAX_CELL   = 48;

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
    this._cell    = 22;
    this._size    = GRID * 22;

    this.app = new PIXI.Application();
    this.graphics = null;
    this._built = false;

    // v8 uses an async init pattern
    this._ready = this.app.init({
      canvas:          this._canvas,
      width:           this._size,
      height:          this._size,
      backgroundColor: C_BG,
      antialias:       false,
      resolution:      window.devicePixelRatio || 1,
      autoDensity:     true,
    });
  }

  async ensureReady() {
    await this._ready;
    if (!this._built) {
      this.graphics = new PIXI.Graphics();
      this.app.stage.addChild(this.graphics);
      this._built = true;
    }
  }

  resize(availablePx) {
    const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(availablePx / GRID)));
    if (cell === this._cell) return;
    
    this._cell = cell;
    this._size = GRID * cell;
    
    // In v8, resize is called on the app directly or the renderer
    if (this.app.renderer) {
        this.app.renderer.resize(this._size, this._size);
    }
  }

  get currentSize() { return this._size; }
  get _cellDraw() { return this._cell - GAP; }

  _drawGrid(g) {
    const cell = this._cell;
    const draw = this._cellDraw;
    // v8 Optimization: Use a single fill call for the entire batch if possible,
    // but for simplicity, we'll keep your logic with the correct v8 syntax.
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        g.rect(col * cell, row * cell, draw, draw);
      }
    }
    g.fill(C_GRID);
  }

  render(game) {
    if (!this._built || !this.graphics) return;
    
    const g    = this.graphics;
    const cell = this._cell;
    const draw = this._cellDraw;

    g.clear();
    
    // 1. Grid
    this._drawGrid(g);

    const alive = game.alive;
    const body  = game.body;

    // 2. Body segments
    for (let i = body.length - 1; i >= 1; i--) {
      const seg = body[i];
      const t   = i / body.length;
      const col = alive ? lerpColor(C_BODY, C_BODY2, t) : C_DEAD;
      g.rect(seg.x * cell, seg.y * cell, draw, draw);
      g.fill(col); 
    }

    // 3. Head
    const head    = body[0];
    const headCol = alive ? C_HEAD : C_DEAD;
    const radius  = Math.max(2, Math.floor(this._cell / 5));
    g.roundRect(head.x * cell, head.y * cell, draw, draw, radius);
    g.fill(headCol);

    // 4. Eyes
    if (alive && cell >= 10) {
      const d  = DIRS[game.dir];
      const ex = head.x * cell + draw / 2 + d.x * (cell * 0.22);
      const ey = head.y * cell + draw / 2 + d.y * (cell * 0.22);
      const px = -d.y, py = d.x;
      const er = Math.max(1, cell / 10);
      const ep = cell * 0.14;
      
      g.circle(ex + px * ep, ey + py * ep, er);
      g.circle(ex - px * ep, ey - py * ep, er);
      g.fill(C_EYE);
    }

    // 5. Food
    const f  = game.food;
    const cx = f.x * cell + draw / 2;
    const cy = f.y * cell + draw / 2;
    const r  = Math.max(3, cell * 0.25);
    g.poly([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy]);
    g.fill(C_FOOD);

    // 6. Score
    if (game.score > 0) {
      const dotSz  = Math.max(2, Math.floor(cell / 8));
      const dotGap = dotSz + 1;
      const maxDots = Math.floor(this._size / dotGap);
      const dots = Math.min(game.score, maxDots);
      for (let i = 0; i < dots; i++) {
        g.rect(i * dotGap + 2, 2, dotSz, dotSz);
      }
      g.fill(C_FOOD);
    }
  }
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}