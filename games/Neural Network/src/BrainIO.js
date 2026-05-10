// src/BrainIO.js
// Save and load the best brain as a JSON file.
//
// File format:
// {
//   "generation": 32,
//   "highscore":  194,
//   "data": {
//     "layerSizes": [24, 16, 16, 3],
//     "weights": [[...], ...],
//     "biases":  [[...], ...]
//   }
// }

import { NeuralNetwork } from './NeuralNetwork.js';

/**
 * Download the best brain as a .json file.
 * @param {import('./Trainer.js').Trainer} trainer
 */
export function exportBrain(trainer) {
  if (!trainer.bestBrain) {
    alert('No best brain yet — let the simulation run for at least one generation.');
    return;
  }

  const payload = {
    generation: trainer.generation,
    highscore:  trainer.bestScore,
    data:       trainer.bestBrain.toJSON(),
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `snake-brain-gen${trainer.generation}-score${trainer.bestScore}.json`;
  a.click();

  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Open a file picker, read the JSON, and load the brain into the trainer.
 * Resolves with { generation, highscore } on success, rejects on bad file.
 * @param {import('./Trainer.js').Trainer} trainer
 * @returns {Promise<{ generation: number, highscore: number }>}
 */
export function importBrain(trainer) {
  return new Promise((resolve, reject) => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json,application/json';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));

      const reader = new FileReader();

      reader.addEventListener('load', () => {
        try {
          const payload = JSON.parse(reader.result);

          // Validate shape
          if (
            typeof payload.generation !== 'number' ||
            typeof payload.highscore  !== 'number' ||
            !payload.data?.layerSizes ||
            !payload.data?.weights    ||
            !payload.data?.biases
          ) {
            throw new Error('Invalid brain file — missing required fields.');
          }

          const brain = NeuralNetwork.fromJSON(payload.data);

          // Inject into trainer as the new bestBrain
          trainer.bestBrain   = brain;
          trainer.bestScore   = payload.highscore;
          trainer.bestFitness = 0;   // fitness isn't stored — reset it
          // Seed the first slot of the current population with the imported brain
          // so evolution continues from where it left off
          trainer.agents[0].brain = brain.clone();

          resolve({ generation: payload.generation, highscore: payload.highscore });
        } catch (err) {
          reject(err);
        }
      });

      reader.addEventListener('error', () => reject(new Error('File read error')));
      reader.readAsText(file);
    });

    input.click();
  });
}