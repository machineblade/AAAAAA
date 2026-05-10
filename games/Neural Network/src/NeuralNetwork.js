// src/NeuralNetwork.js
// Architecture: 24 inputs → 16 hidden → 16 hidden → 3 outputs
// Trained via genetic algorithm (no backprop needed for RL-style tasks)

export class NeuralNetwork {
  /**
   * @param {number[]} layerSizes  e.g. [24, 16, 16, 3]
   * @param {NeuralNetwork|null} parent  copy weights from parent (then mutate)
   */
  constructor(layerSizes = [24, 16, 16, 3], parent = null) {
    this.layerSizes = layerSizes;
    // weights[i] is a flat Float32Array of size layerSizes[i]*layerSizes[i+1]
    // biases[i] is Float32Array of size layerSizes[i+1]
    this.weights = [];
    this.biases  = [];

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const rows = layerSizes[i];
      const cols = layerSizes[i + 1];
      const w = new Float32Array(rows * cols);
      const b = new Float32Array(cols);

      if (parent) {
        w.set(parent.weights[i]);
        b.set(parent.biases[i]);
      } else {
        // Xavier init
        const scale = Math.sqrt(2 / (rows + cols));
        for (let j = 0; j < w.length; j++) w[j] = (Math.random() * 2 - 1) * scale;
        for (let j = 0; j < b.length; j++) b[j] = 0;
      }
      this.weights.push(w);
      this.biases.push(b);
    }

    // Cached activations for visualizer
    this.activations = layerSizes.map(n => new Float32Array(n));
  }

  // ── activation ─────────────────────────────────────────────
  static relu(x)    { return x > 0 ? x : 0; }
  static sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  static tanh(x)    { return Math.tanh(x); }

  /**
   * Forward pass — stores activations for the visualizer.
   * @param {number[]} inputs  length must match layerSizes[0]
   * @returns {Float32Array}   output activations
   */
  forward(inputs) {
    // Store input layer
    for (let i = 0; i < inputs.length; i++) this.activations[0][i] = inputs[i];

    let current = this.activations[0];

    for (let layer = 0; layer < this.weights.length; layer++) {
      const inSize  = this.layerSizes[layer];
      const outSize = this.layerSizes[layer + 1];
      const W       = this.weights[layer];
      const B       = this.biases[layer];
      const next    = this.activations[layer + 1];
      const isLast  = layer === this.weights.length - 1;

      for (let j = 0; j < outSize; j++) {
        let sum = B[j];
        for (let k = 0; k < inSize; k++) {
          sum += current[k] * W[k * outSize + j];
        }
        // Hidden layers: ReLU; output layer: softmax later (just raw for now)
        next[j] = isLast ? sum : NeuralNetwork.relu(sum);
      }

      // Softmax on output layer
      if (isLast) {
        let maxVal = next[0];
        for (let j = 1; j < outSize; j++) if (next[j] > maxVal) maxVal = next[j];
        let sumExp = 0;
        for (let j = 0; j < outSize; j++) { next[j] = Math.exp(next[j] - maxVal); sumExp += next[j]; }
        for (let j = 0; j < outSize; j++) next[j] /= sumExp;
      }

      current = next;
    }

    return this.activations[this.activations.length - 1];
  }

  /**
   * Pick the highest-confidence action: 0=left, 1=straight, 2=right
   */
  decide(inputs) {
    const out = this.forward(inputs);
    let best = 0;
    for (let i = 1; i < out.length; i++) if (out[i] > out[best]) best = i;
    return best;
  }

  // ── genetic ops ────────────────────────────────────────────

  /**
   * Mutate in-place with Gaussian noise.
   * @param {number} rate  probability each weight is perturbed
   * @param {number} strength  std-dev of Gaussian noise
   */
  mutate(rate = 0.1, strength = 0.2) {
    for (let i = 0; i < this.weights.length; i++) {
      const w = this.weights[i];
      for (let j = 0; j < w.length; j++) {
        if (Math.random() < rate) {
          w[j] += (Math.random() * 2 - 1) * strength;
          // Clamp to prevent explosion
          if (w[j] > 5)  w[j] = 5;
          if (w[j] < -5) w[j] = -5;
        }
      }
      const b = this.biases[i];
      for (let j = 0; j < b.length; j++) {
        if (Math.random() < rate) {
          b[j] += (Math.random() * 2 - 1) * strength;
          if (b[j] > 3)  b[j] = 3;
          if (b[j] < -3) b[j] = -3;
        }
      }
    }
    return this;
  }

  /**
   * Uniform crossover between this and another brain.
   * Returns a new NeuralNetwork child.
   */
  crossover(other) {
    const child = new NeuralNetwork(this.layerSizes, this);
    for (let i = 0; i < child.weights.length; i++) {
      const w = child.weights[i];
      const wo = other.weights[i];
      for (let j = 0; j < w.length; j++) {
        if (Math.random() < 0.5) w[j] = wo[j];
      }
      const b = child.biases[i];
      const bo = other.biases[i];
      for (let j = 0; j < b.length; j++) {
        if (Math.random() < 0.5) b[j] = bo[j];
      }
    }
    return child;
  }

  /** Deep clone */
  clone() {
    return new NeuralNetwork(this.layerSizes, this);
  }

  // ── Serialization ───────────────────────────────────────────

  /**
   * Serialize weights + biases to a plain object (JSON-safe).
   * Float32Arrays are converted to regular arrays so JSON.stringify works.
   */
  toJSON() {
    return {
      layerSizes: this.layerSizes,
      weights:    this.weights.map(w => Array.from(w)),
      biases:     this.biases.map(b => Array.from(b)),
    };
  }

  /**
   * Reconstruct a NeuralNetwork from the object produced by toJSON().
   * @param {object} obj
   * @returns {NeuralNetwork}
   */
  static fromJSON(obj) {
    const nn = new NeuralNetwork(obj.layerSizes);
    for (let i = 0; i < obj.weights.length; i++) {
      nn.weights[i] = new Float32Array(obj.weights[i]);
      nn.biases[i]  = new Float32Array(obj.biases[i]);
    }
    return nn;
  }
}