# 🐍 Snake Neural Network

A genetic algorithm that trains a neural network to play Snake, built with **PixiJS 8**.  
The right panel shows the live neural network — neurons, connections, and activations updating every frame.

---

## Quick Start

### Option A — Scaffold with `npm create pixi.js` (recommended)

```bash
# 1. Scaffold a new PixiJS project
npm create pixi.js@latest snake-nn
# Choose: Vite + JavaScript (not TypeScript)

# 2. Replace the scaffolded files with this project's files:
#    Copy everything from this folder INTO the scaffolded snake-nn/ folder,
#    overwriting index.html, src/main.js, and adding the other src/ files.

# 3. Install deps and run
cd snake-nn
npm install
npm run dev
```

### Option B — Use this folder directly

```bash
cd snake-nn        # (this folder)
npm install
npm run dev
```

Open http://localhost:3000 — the simulation starts automatically.

---

## Project Structure

```
snake-nn/
├── index.html              ← App shell, layout, CSS
├── package.json
├── vite.config.js
└── src/
    ├── main.js             ← Entry point, game loop, UI wiring
    ├── Snake.js            ← Snake game logic (pure JS, no rendering)
    ├── NeuralNetwork.js    ← NN: forward pass, mutation, crossover
    ├── Trainer.js          ← Genetic algorithm (population, selection)
    ├── GameRenderer.js     ← PixiJS renderer for the snake game
    └── NNVisualizer.js     ← Canvas 2D live NN visualizer
```

---

## Architecture

### Neural Network  `[24 → 16 → 16 → 3]`

| Layer | Size | Notes |
|-------|------|-------|
| Input | 24 | 8 ray directions × 3 signals (wall distance, food, body) |
| Hidden 1 | 16 | ReLU activation |
| Hidden 2 | 16 | ReLU activation |
| Output | 3 | Softmax → Turn Left / Go Straight / Turn Right |

### Inputs (8 directional rays)
Each ray (N, NE, E, SE, S, SW, W, NW) emits 3 values:
- `1/distance_to_wall` — danger signal (higher = closer)
- `food_visible` — 1 if food is along this ray
- `body_visible` — 1 if a body segment is along this ray

### Training — Genetic Algorithm
- **Population:** 500 agents per generation
- **Selection:** fitness-proportionate from top 25%
- **Elites:** top 20 agents copied unchanged
- **Crossover:** uniform (gene picked randomly from either parent)
- **Mutation:** 8% rate, Gaussian noise σ=0.18, weights clamped ±5
- **Fitness:** `steps + 2^score + score×500` (rewards food and survival)
- **Starvation:** snake dies if it goes `grid² + score×grid×2` steps without eating

---

## Controls

| Control | Action |
|---------|--------|
| **▶ Run** | Start / resume the simulation |
| **⏸ Pause** | Freeze the simulation |
| **👁 Best** | Watch the all-time best brain play a demo game |
| **↺ Restart** | Reset everything and start fresh |
| **Speed slider** | Steps simulated per frame (1–120) |

---

## Performance Tips

- The simulation runs 500 agents in parallel (all off-screen)
- Increase speed slider to train faster (skips rendering intermediate steps)
- By generation ~50 the snake should reliably eat 5–10 apples
- By generation ~200+ it may loop the full board

---

## Tweaking

Edit `src/Trainer.js` to change:

```js
const POP_SIZE          = 500;   // agents per generation
const ELITES            = 20;    // top agents copied unchanged
const MUTATION_RATE     = 0.08;  // per-weight mutation probability
const MUTATION_STRENGTH = 0.18;  // Gaussian noise std-dev
const LAYER_SIZES       = [24, 16, 16, 3];  // network architecture
```

Edit `src/Snake.js` to change:

```js
export const GRID = 20;  // board size (cells per side)
```
