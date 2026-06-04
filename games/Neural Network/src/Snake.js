// src/Snake.js
// Pure-logic snake game. No rendering. Used by the trainer.

export const GRID = 20;   // cells per side
export const DIRS = [
  { x:  0, y: -1 },  // 0 = UP
  { x:  1, y:  0 },  // 1 = RIGHT
  { x:  0, y:  1 },  // 2 = DOWN
  { x: -1, y:  0 },  // 3 = LEFT
];

// Relative turn actions: 0=left, 1=straight, 2=right
const LEFT_OF  = [3, 0, 1, 2];
const RIGHT_OF = [1, 2, 3, 0];

// Proximity scoring constants
const PROXIMITY_BONUS       = 1.0;
const PROXIMITY_PENALTY     = 1.0;
const TIME_PENALTY_INTERVAL = 10;
const TIME_PENALTY_AMOUNT   = 1.0;
const PROXIMITY_CLOSE_BONUS = 3.0;

// Loop detection
const LOOP_HISTORY_SIZE = 16;
const LOOP_PENALTY      = 10.0;

// Efficiency reward
const EFFICIENCY_SCALE = 50;

export const INPUT_SIZE = 32;   // 8 rays × 4 signals

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export class SnakeGame {
  constructor() {
    this.reset();
  }

  reset() {
    const cx = Math.floor(GRID / 2);
    const cy = Math.floor(GRID / 2);
    this.body           = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    this.dir            = 1;
    this.alive          = true;
    this.score          = 0;
    this.steps          = 0;
    this.stepsSinceFood = 0;
    this.fitness        = 0;
    this._placeFood();

    this.virtualScore = 0;
    this._prevDist    = manhattan(this.body[0].x, this.body[0].y, this.food.x, this.food.y);
    this._distAtEat   = this._prevDist;

    this._posHistory  = [];
    this.loopPenalties = 0;
  }

  _placeFood() {
    const occupied = new Set(this.body.map(b => b.x + ',' + b.y));
    let fx, fy;
    do {
      fx = Math.floor(Math.random() * GRID);
      fy = Math.floor(Math.random() * GRID);
    } while (occupied.has(fx + ',' + fy));
    this.food = { x: fx, y: fy };
  }

  _inBounds(x, y) { return x >= 0 && x < GRID && y >= 0 && y < GRID; }

  _hitsBody(x, y, skipTail = true) {
    const limit = skipTail ? this.body.length - 1 : this.body.length;
    for (let i = 0; i < limit; i++) {
      if (this.body[i].x === x && this.body[i].y === y) return true;
    }
    return false;
  }

  step(action) {
    if (!this.alive) return false;

    if      (action === 0) this.dir = LEFT_OF[this.dir];
    else if (action === 2) this.dir = RIGHT_OF[this.dir];

    const head = this.body[0];
    const d    = DIRS[this.dir];
    const nx   = head.x + d.x;
    const ny   = head.y + d.y;

    if (!this._inBounds(nx, ny) || this._hitsBody(nx, ny)) {
      this.alive = false;
      this._calcFitness();
      return false;
    }

    this.body.unshift({ x: nx, y: ny });
    this.steps++;
    this.stepsSinceFood++;

    // Proximity scoring
    const newDist = manhattan(nx, ny, this.food.x, this.food.y);
    if (newDist < this._prevDist) {
      this.virtualScore += PROXIMITY_BONUS;
      if (newDist <= 2) this.virtualScore += PROXIMITY_CLOSE_BONUS;
    } else if (newDist > this._prevDist) {
      this.virtualScore -= PROXIMITY_PENALTY;
    }
    this._prevDist = newDist;

    // Time penalty
    if (this.stepsSinceFood > 0 && this.stepsSinceFood % TIME_PENALTY_INTERVAL === 0) {
      this.virtualScore -= TIME_PENALTY_AMOUNT;
    }

    // Loop detection
    const posKey = nx + ',' + ny;
    if (this._posHistory.includes(posKey)) {
      this.virtualScore -= LOOP_PENALTY;
      this.loopPenalties++;
    }
    this._posHistory.push(posKey);
    if (this._posHistory.length > LOOP_HISTORY_SIZE) this._posHistory.shift();

    // Eat
    if (nx === this.food.x && ny === this.food.y) {
      this.score++;
      const efficiency = Math.max(0, 1 - (this.stepsSinceFood - this._distAtEat) / (this._distAtEat * 3 + 1));
      this.virtualScore += 50 + efficiency * EFFICIENCY_SCALE;
      this.stepsSinceFood = 0;
      this._placeFood();
      this._prevDist  = manhattan(nx, ny, this.food.x, this.food.y);
      this._distAtEat = this._prevDist;
      this._posHistory = [];
    } else {
      this.body.pop();
    }

    // Starvation
    const maxSteps = GRID * GRID + this.score * GRID * 2;
    if (this.stepsSinceFood > maxSteps) {
      this.alive = false;
      this._calcFitness();
      return false;
    }

    return true;
  }

  _calcFitness() {
    const base = this.steps + (2 ** this.score + this.score * 500) - (this.score ** 1.2) * 0.25 * this.steps;
    this.fitness = Math.max(0, base + this.virtualScore * 0.5);
  }

  // 8 rays × 4 signals = 32 inputs
  // Per ray: [wall_danger, food_visible, body_proximity, 0]
  // body_proximity = 1/distance to nearest body segment (0 if none seen)
  getInputs() {
    const head = this.body[0];
    const rays = [
      { dx:  0, dy: -1 },  // N
      { dx:  1, dy: -1 },  // NE
      { dx:  1, dy:  0 },  // E
      { dx:  1, dy:  1 },  // SE
      { dx:  0, dy:  1 },  // S
      { dx: -1, dy:  1 },  // SW
      { dx: -1, dy:  0 },  // W
      { dx: -1, dy: -1 },  // NW
    ];

    const inputs = [];
    for (const { dx, dy } of rays) {
      let wallDist = 0;
      let seenFood = 0;
      let bodyDist = 0;
      let x = head.x + dx;
      let y = head.y + dy;
      wallDist++;

      while (this._inBounds(x, y)) {
        if (!seenFood && x === this.food.x && y === this.food.y) seenFood = 1;
        if (!bodyDist && this._hitsBody(x, y, false)) bodyDist = 1 / wallDist;
        x += dx; y += dy; wallDist++;
      }

      inputs.push(1 / wallDist);  // wall danger
      inputs.push(seenFood);       // food flag
      inputs.push(bodyDist);       // body proximity (0 = none, higher = closer)
      inputs.push(0);              // padding — reserved for future use
    }
    return inputs; // 32 floats
  }
}