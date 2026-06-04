// src/NNVisualizer.js
// Draws the neural network (neurons + connections + live activations) on a 2D canvas.

const LAYER_LABELS = [
  // 32 inputs — 8 rays × 4 signals
  ['N-wall','N-food','N-body','N-?',
   'NE-wall','NE-food','NE-body','NE-?',
   'E-wall','E-food','E-body','E-?',
   'SE-wall','SE-food','SE-body','SE-?',
   'S-wall','S-food','S-body','S-?',
   'SW-wall','SW-food','SW-body','SW-?',
   'W-wall','W-food','W-body','W-?',
   'NW-wall','NW-food','NW-body','NW-?'],
  null, null,
  ['Turn L','Straight','Turn R'],
];

const COL_CONN_POS = 'rgba(90,170,255,';
const COL_CONN_NEG = 'rgba(255,85,85,';

export class NNVisualizer {
  constructor(canvas, layerSizes) {
    this.canvas     = canvas;
    this.ctx        = canvas.getContext('2d');
    this.layerSizes = layerSizes;
    this.nodePos    = [];
    this._laid      = false;
  }

  resize(w, h) {
    this.canvas.width  = w;
    this.canvas.height = h;
    this._layout(w, h);
  }

  _layout(w, h) {
    const layers = this.layerSizes;
    const xStep  = w / (layers.length + 1);
    this.nodePos = [];

    for (let l = 0; l < layers.length; l++) {
      const n     = layers[l];
      const yStep = h / (n + 1);
      const col   = [];
      for (let i = 0; i < n; i++) {
        col.push({ x: xStep * (l + 1), y: yStep * (i + 1) });
      }
      this.nodePos.push(col);
    }
    this._laid  = true;
    this._nodeR = Math.max(3, Math.min(10, Math.floor(Math.min(w, h) / 60)));
  }

  draw(nn) {
    if (!this._laid) return;
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, W, H);

    const acts    = nn.activations;
    const weights = nn.weights;
    const R       = this._nodeR;
    const isLast  = (l) => l === this.layerSizes.length - 1;

    // Connections — skip layers with too many edges
    for (let l = 0; l < this.nodePos.length - 1; l++) {
      const srcNodes = this.nodePos[l];
      const dstNodes = this.nodePos[l + 1];
      const W_mat    = weights[l];
      const outSize  = this.layerSizes[l + 1];
      const inSize   = this.layerSizes[l];
      if (inSize * outSize > 800) continue;

      for (let j = 0; j < dstNodes.length; j++) {
        const dst = dstNodes[j];
        for (let k = 0; k < srcNodes.length; k++) {
          const w   = W_mat[k * outSize + j];
          const src = srcNodes[k];
          const act = acts[l][k];
          const mag = Math.min(Math.abs(w * act), 1);
          if (mag < 0.04) continue;

          const alpha = (mag * 0.7).toFixed(2);
          ctx.strokeStyle = w > 0
            ? COL_CONN_POS + alpha + ')'
            : COL_CONN_NEG + alpha + ')';
          ctx.lineWidth = mag * 2.5;
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(dst.x, dst.y);
          ctx.stroke();
        }
      }
    }

    // Neurons
    for (let l = 0; l < this.nodePos.length; l++) {
      const col  = this.nodePos[l];
      const last = isLast(l);

      for (let i = 0; i < col.length; i++) {
        const { x, y } = col[i];
        const act       = acts[l] ? acts[l][i] : 0;
        const intensity = Math.min(Math.abs(act), 1);

        let fill;
        if (last) {
          fill = `rgba(124,111,247,${0.2 + intensity * 0.8})`;
        } else if (act > 0) {
          fill = `rgba(90,170,255,${0.15 + intensity * 0.85})`;
        } else {
          fill = `rgba(255,85,85,${0.1 + intensity * 0.5})`;
        }

        if (intensity > 0.5) {
          ctx.beginPath();
          ctx.arc(x, y, R + 3, 0, Math.PI * 2);
          ctx.fillStyle = last
            ? `rgba(124,111,247,${(intensity - 0.5) * 0.4})`
            : `rgba(90,170,255,${(intensity - 0.5) * 0.3})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = last ? '#7c6ff7' : '#2a2a5a';
        ctx.lineWidth   = 1;
        ctx.stroke();

        if (last && LAYER_LABELS[l]) {
          const label = LAYER_LABELS[l][i] || '';
          ctx.font      = `${R + 3}px Courier New`;
          ctx.fillStyle = `rgba(200,190,255,${0.4 + intensity * 0.6})`;
          ctx.textAlign = 'left';
          ctx.fillText(label, x + R + 5, y + 4);
          const barW = 40 * intensity;
          ctx.fillStyle = `rgba(124,111,247,${0.3 + intensity * 0.5})`;
          ctx.fillRect(x + R + 5, y + 7, barW, 3);
        }

        if (l === 0 && LAYER_LABELS[0]) {
          const label = LAYER_LABELS[0][i] || '';
          ctx.font      = `${Math.max(7, R - 1)}px Courier New`;
          ctx.fillStyle = `rgba(100,100,150,0.8)`;
          ctx.textAlign = 'right';
          ctx.fillText(label, x - R - 4, y + 4);
        }
      }
    }

    // Layer headers
    const headers = ['Inputs\n(32)', 'Hidden\n(32)', 'Hidden\n(32)', 'Outputs\n(3)'];
    ctx.font      = '10px Courier New';
    ctx.textAlign = 'center';
    for (let l = 0; l < this.nodePos.length; l++) {
      const x = this.nodePos[l][0].x;
      ctx.fillStyle = '#333355';
      ctx.fillText(headers[l], x, 14);
    }
  }
}