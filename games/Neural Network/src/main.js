// src/main.js
// Entry point. Wires PixiJS renderer, trainer, NN visualizer and UI together.

import { Trainer, POP_SIZE, LAYER_SIZES } from './Trainer.js';
import { GameRenderer }                    from './GameRenderer.js';
import { NNVisualizer }                    from './NNVisualizer.js';
import { SnakeGame, GRID as GRID_CELLS }   from './Snake.js';
import { exportBrain, importBrain }        from './BrainIO.js';

// ── DOM refs ─────────────────────────────────────────────────
const gameCanvas  = document.getElementById('game-canvas');
const gamePanel   = document.getElementById('game-panel');
const divider     = document.getElementById('divider');
const nnCanvas    = document.getElementById('nn-canvas');
const nnWrap      = document.getElementById('nn-canvas-wrap');

const elGen   = document.getElementById('s-gen');
const elScore = document.getElementById('s-score');
const elBest  = document.getElementById('s-best');
const elAlive = document.getElementById('s-alive');
const elSteps = document.getElementById('s-steps');
const elProx  = document.getElementById('s-prox');
const elBar   = document.getElementById('gen-bar');

const btnRun     = document.getElementById('btn-run');
const btnPause   = document.getElementById('btn-pause');
const btnBest    = document.getElementById('btn-best');
const btnRestart = document.getElementById('btn-restart');
const btnSave    = document.getElementById('btn-save');
const btnLoad    = document.getElementById('btn-load');
const btnHuman   = document.getElementById('btn-human');
const speedSlider = document.getElementById('speed-slider');
const speedVal   = document.getElementById('speed-val');

// ── Speed model ───────────────────────────────────────────────
function sliderToSPS(v) {
  return Math.round(Math.exp((v / 100) * Math.log(2000)));
}

// ── State ─────────────────────────────────────────────────────
let trainer      = new Trainer();
let renderer     = new GameRenderer(gameCanvas);
let viz          = null;
let running      = false;
let showBest     = false;
let targetSPS    = sliderToSPS(parseInt(speedSlider.value));
let rafId        = null;
let lastStepTime = 0;
let stepDebt     = 0;

// ── WASD Human mode ───────────────────────────────────────────
// WASD maps to absolute directions: W=UP(0), D=RIGHT(1), S=DOWN(2), A=LEFT(3)
// The held key sets a desired absolute direction which is applied each tick.
// We store it as an absolute DIRS index and convert to relative action in the loop.

const WASD_DIR = { w: 0, a: 3, s: 2, d: 1 };   // key → absolute dir index
const OPPOSITE = [2, 3, 0, 1];                    // opposite of each dir (can't 180)

let humanMode    = false;         // true when player is controlling
let humanGame    = null;          // the game the human is playing
let humanDir     = -1;            // currently held direction (-1 = none yet)
let humanStepMs  = 120;           // ms per step in human mode (≈8 steps/sec)
let humanLastStep = 0;

// Key held tracking
const keysHeld = new Set();

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (!WASD_DIR.hasOwnProperty(key)) return;
  e.preventDefault();
  keysHeld.add(key);

  // Find the most-recently-pressed WASD key that is still held
  // (last one pressed wins — natural for held keys)
  const newDir = WASD_DIR[key];

  // Activate human mode on first WASD press if not already in it
  if (!humanMode) {
    activateHumanMode();
  }

  // Only change direction if it's not a 180 reverse (would kill instantly)
  if (humanGame && newDir !== OPPOSITE[humanGame.dir]) {
    humanDir = newDir;
  }
});

document.addEventListener('keyup', e => {
  keysHeld.delete(e.key.toLowerCase());
});

function activateHumanMode() {
  humanMode  = true;
  humanGame  = new SnakeGame();
  humanDir   = humanGame.dir;  // start facing right (matches spawn dir)
  humanLastStep = 0;
  btnHuman.classList.add('active');

  // Make sure the sim is running so the rAF loop ticks
  if (!running) {
    running = true;
    btnRun.classList.add('active');
    btnPause.classList.remove('active');
    if (!rafId) rafId = requestAnimationFrame(loop);
  }
}

function deactivateHumanMode() {
  humanMode = false;
  humanGame = null;
  humanDir  = -1;
  btnHuman.classList.remove('active');
}

// Convert absolute target direction → relative action for SnakeGame.step()
function absoluteToRelative(currentDir, targetDir) {
  if (targetDir === currentDir) return 1;  // straight
  // LEFT_OF and RIGHT_OF from Snake.js (mirrored here for conversion):
  // LEFT_OF  = [3, 0, 1, 2]
  // RIGHT_OF = [1, 2, 3, 0]
  const LEFT_OF  = [3, 0, 1, 2];
  const RIGHT_OF = [1, 2, 3, 0];
  if (LEFT_OF[currentDir]  === targetDir) return 0;  // turn left
  if (RIGHT_OF[currentDir] === targetDir) return 2;  // turn right
  return 1;  // fallback straight (handles opposite — blocked by caller)
}

// ── Panel resize system ───────────────────────────────────────
const PANEL_PAD = 24;

function applyGamePanelWidth(px) {
  const minW = GRID_CELLS * 8 + PANEL_PAD;
  const maxW = window.innerWidth * 0.9;
  const w    = Math.max(minW, Math.min(maxW, px));
  gamePanel.style.width = w + 'px';
  return w;
}

function syncGameCanvas() {
  const panelW    = gamePanel.clientWidth  - PANEL_PAD;
  const panelH    = gamePanel.clientHeight - PANEL_PAD;
  const available = Math.min(panelW, panelH);
  renderer.resize(available);
  const sz = renderer.currentSize;
  gameCanvas.style.width  = sz + 'px';
  gameCanvas.style.height = sz + 'px';
}

let dragging   = false;
let dragStartX = 0;
let dragStartW = 0;

divider.addEventListener('mousedown', e => {
  dragging   = true;
  dragStartX = e.clientX;
  dragStartW = gamePanel.clientWidth;
  divider.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!dragging) return;
  applyGamePanelWidth(dragStartW + (e.clientX - dragStartX));
  syncGameCanvas(); resizeNN();
});
document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  divider.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});
divider.addEventListener('touchstart', e => {
  dragging   = true;
  dragStartX = e.touches[0].clientX;
  dragStartW = gamePanel.clientWidth;
  divider.classList.add('dragging');
  e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', e => {
  if (!dragging) return;
  applyGamePanelWidth(dragStartW + (e.touches[0].clientX - dragStartX));
  syncGameCanvas(); resizeNN();
}, { passive: true });
document.addEventListener('touchend', () => { dragging = false; divider.classList.remove('dragging'); });

// ── NN canvas resize ─────────────────────────────────────────
function resizeNN() {
  const w = nnWrap.clientWidth;
  const h = nnWrap.clientHeight;
  if (w < 10 || h < 10) return;
  if (!viz) viz = new NNVisualizer(nnCanvas, LAYER_SIZES);
  viz.resize(w, h);
}

const ro = new ResizeObserver(() => { syncGameCanvas(); resizeNN(); });
ro.observe(gamePanel);
ro.observe(nnWrap);

applyGamePanelWidth(window.innerWidth * 0.45);

// ── PixiJS init ───────────────────────────────────────────────
await renderer.ensureReady();
syncGameCanvas();
resizeNN();

// ── Update UI stats ───────────────────────────────────────────
function updateStats() {
  const s = trainer.getStats();
  elGen.textContent   = s.generation;
  elBest.textContent  = s.bestScore;
  elAlive.textContent = humanMode ? '—' : s.aliveCount;

  const agent = humanMode
    ? { game: humanGame }
    : showBest && trainer.bestBrain
      ? { game: { score: trainer.bestScore, steps: 0, virtualScore: 0 } }
      : trainer.getBestLiving();

  elScore.textContent = agent?.game.score ?? 0;
  elSteps.textContent = agent?.game.steps ?? 0;

  const vs = agent?.game.virtualScore ?? 0;
  const vsRounded = Math.round(vs);
  if (elProx) {
    elProx.textContent = (vsRounded >= 0 ? '+' : '') + vsRounded;
    elProx.style.color = vsRounded >= 0 ? '#4dff8a' : '#ff5566';
  }

  if (humanMode) {
    elBar.textContent = humanGame?.alive
      ? `🎮 Human mode — WASD to steer (hold a key to keep going) | Score: ${humanGame.score}`
      : `💀 Game over! Score: ${humanGame?.score ?? 0} — Press WASD to play again`;
  } else {
    elBar.textContent = `Gen ${s.generation} | Pop ${POP_SIZE} | Best fitness ${s.bestFitness.toFixed(0)} | Avg fitness ${s.avgFitness.toFixed(0)}`;
  }
}

// ── Simulation step helper ────────────────────────────────────
function simStep() {
  const alive = trainer.tick();
  if (alive === 0) {
    trainer.evolve();
    trainer.resetGames();
  }
}

// ── Main loop ─────────────────────────────────────────────────
function loop(ts) {
  if (!running) return;
  rafId = requestAnimationFrame(loop);

  if (lastStepTime === 0) lastStepTime = ts;
  const elapsed = ts - lastStepTime;

  if (humanMode) {
    // Human game tick — time-gated at humanStepMs
    if (humanLastStep === 0) humanLastStep = ts;
    if (ts - humanLastStep >= humanStepMs) {
      humanLastStep = ts;

      if (humanGame && humanGame.alive && humanDir !== -1) {
        const action = absoluteToRelative(humanGame.dir, humanDir);
        humanGame.step(action);
      } else if (humanGame && !humanGame.alive) {
        // Dead — wait for next WASD press (activateHumanMode will reset)
        // Check if any WASD key is held to restart
        if (keysHeld.size > 0) {
          humanGame = new SnakeGame();
          humanDir  = humanGame.dir;
          humanLastStep = ts;
        }
      }
    }

    // Always render human game
    if (humanGame) renderer.render(humanGame);
    updateStats();
    lastStepTime = ts;
    return;
  }

  // ── Normal NN training mode ───────────────────────────────
  const msPerStep = 1000 / targetSPS;
  if (targetSPS <= 60) {
    stepDebt += elapsed;
    const stepsThisFrame = Math.floor(stepDebt / msPerStep);
    if (stepsThisFrame > 0) {
      stepDebt -= stepsThisFrame * msPerStep;
      for (let i = 0; i < stepsThisFrame; i++) simStep();
    } else {
      lastStepTime = ts;
      renderFrame();
      return;
    }
  } else {
    const stepsThisFrame = Math.min(Math.round(targetSPS / 60), 2000);
    for (let i = 0; i < stepsThisFrame; i++) simStep();
  }

  lastStepTime = ts;
  renderFrame();
}

function renderFrame() {
  let displayAgent;
  if (showBest && trainer.bestBrain) {
    displayAgent = demoBestAgent();
  } else {
    displayAgent = trainer.getBestLiving();
  }

  renderer.render(displayAgent.game);

  if (viz) {
    const brain = showBest && trainer.bestBrain ? trainer.bestBrain : displayAgent.brain;
    brain.forward(displayAgent.game.getInputs());
    viz.draw(brain);
  }

  updateStats();
}

// Demo mode — champion brain plays a standalone game
let _demoGame = null;
let _demoStep = 0;

function demoBestAgent() {
  if (!_demoGame || !_demoGame.alive) {
    _demoGame = new SnakeGame();
    _demoStep = 0;
  }
  const inputs = _demoGame.getInputs();
  const action = trainer.bestBrain.decide(inputs);
  _demoGame.step(action);
  _demoStep++;
  return { game: _demoGame, brain: trainer.bestBrain };
}

// ── Controls ─────────────────────────────────────────────────
btnRun.addEventListener('click', () => {
  deactivateHumanMode();
  running = true;
  btnRun.classList.add('active');
  btnPause.classList.remove('active');
  if (!rafId) rafId = requestAnimationFrame(loop);
});

btnPause.addEventListener('click', () => {
  running = false;
  lastStepTime = 0;
  stepDebt = 0;
  btnPause.classList.add('active');
  btnRun.classList.remove('active');
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
});

btnBest.addEventListener('click', () => {
  deactivateHumanMode();
  showBest = !showBest;
  btnBest.classList.toggle('active', showBest);
  _demoGame = null;
});

btnHuman.addEventListener('click', () => {
  if (humanMode) {
    deactivateHumanMode();
  } else {
    showBest = false;
    btnBest.classList.remove('active');
    activateHumanMode();
  }
});

btnSave.addEventListener('click', () => exportBrain(trainer));

btnLoad.addEventListener('click', async () => {
  try {
    const { generation, highscore } = await importBrain(trainer);
    elBar.textContent = `✓ Loaded brain — Gen ${generation}, high score ${highscore}. Continuing evolution...`;
    updateStats();
  } catch (err) {
    elBar.textContent = `✗ Load failed: ${err.message}`;
  }
});

btnRestart.addEventListener('click', () => {
  deactivateHumanMode();
  running = false;
  lastStepTime = 0;
  stepDebt = 0;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  trainer   = new Trainer();
  _demoGame = null;
  updateStats();
  running = true;
  rafId = requestAnimationFrame(loop);
  btnRun.classList.add('active');
  btnPause.classList.remove('active');
});

speedSlider.addEventListener('input', () => {
  const v = parseInt(speedSlider.value);
  targetSPS = sliderToSPS(v);
  stepDebt  = 0;
  speedVal.textContent = targetSPS >= 1000
    ? (targetSPS / 1000).toFixed(1) + 'k'
    : targetSPS + '';
});

// ── Auto-start ────────────────────────────────────────────────
updateStats();
running = true;
btnRun.classList.add('active');
rafId = requestAnimationFrame(loop);