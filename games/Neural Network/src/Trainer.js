// src/Trainer.js
// Genetic algorithm that evolves a population of NeuralNetworks to play Snake.

import { NeuralNetwork } from './NeuralNetwork.js';
import { SnakeGame }     from './Snake.js';

export const POP_SIZE    = 500;
const ELITES             = 20;
const MUTATION_RATE      = 0.08;
const MUTATION_STRENGTH  = 0.18;
const LAYER_SIZES        = [32, 32, 32, 3];   // upgraded: 32 inputs, larger hidden layers

export { LAYER_SIZES };

export class Trainer {
  constructor() {
    this.generation  = 0;
    this.bestFitness = 0;
    this.bestScore   = 0;
    this.bestBrain   = null;

    this.agents = Array.from({ length: POP_SIZE }, () => ({
      brain: new NeuralNetwork(LAYER_SIZES),
      game:  new SnakeGame(),
    }));

    this.aliveCount = POP_SIZE;
  }

  tick() {
    let alive = 0;
    for (const agent of this.agents) {
      if (!agent.game.alive) continue;
      const inputs = agent.game.getInputs();
      const action = agent.brain.decide(inputs);
      agent.game.step(action);
      if (agent.game.alive) alive++;
    }
    this.aliveCount = alive;
    return alive;
  }

  evolve() {
    this.generation++;
    this.agents.sort((a, b) => b.game.fitness - a.game.fitness);

    const top = this.agents[0];
    if (top.game.fitness > this.bestFitness) {
      this.bestFitness = top.game.fitness;
      this.bestScore   = top.game.score;
      this.bestBrain   = top.brain.clone();
    }

    const poolSize = Math.max(ELITES, Math.floor(POP_SIZE * 0.25));
    const pool     = this.agents.slice(0, poolSize);
    const totalFit = pool.reduce((s, a) => s + a.game.fitness + 1, 0);

    const pickParent = () => {
      let r = Math.random() * totalFit;
      for (const a of pool) {
        r -= a.game.fitness + 1;
        if (r <= 0) return a.brain;
      }
      return pool[pool.length - 1].brain;
    };

    const nextAgents = [];
    for (let i = 0; i < ELITES; i++) {
      nextAgents.push({ brain: this.agents[i].brain.clone(), game: new SnakeGame() });
    }
    while (nextAgents.length < POP_SIZE) {
      const child = pickParent().crossover(pickParent()).mutate(MUTATION_RATE, MUTATION_STRENGTH);
      nextAgents.push({ brain: child, game: new SnakeGame() });
    }

    this.agents     = nextAgents;
    this.aliveCount = POP_SIZE;
  }

  resetGames() {
    for (const a of this.agents) a.game.reset();
  }

  getBestLiving() {
    let best = null;
    for (const a of this.agents) {
      if (!a.game.alive) continue;
      if (!best || a.game.score > best.game.score ||
         (a.game.score === best.game.score && a.game.steps > best.game.steps)) {
        best = a;
      }
    }
    return best || this.agents[0];
  }

  getStats() {
    const avgFit = this.agents.reduce((s, a) => s + a.game.fitness, 0) / POP_SIZE;
    return {
      generation:  this.generation,
      aliveCount:  this.aliveCount,
      bestScore:   this.bestScore,
      avgFitness:  avgFit,
      bestFitness: this.bestFitness,
    };
  }
}