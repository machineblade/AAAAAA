const DESIGN_W = 480;
const DESIGN_H = 320;

export class Director {
    constructor(app) {
        this.app = app;
        this._cb = null;
        this._fit();
        window.addEventListener('resize', () => this._fit());
    }

    _fit() {
        this.ww = window.innerWidth;
        this.wh = window.innerHeight;
        const sx = this.ww / DESIGN_W;
        const sy = this.wh / DESIGN_H;
        this.scale = Math.max(sx, sy);
        this.dw = this.ww / this.scale;
        this.dh = this.wh / this.scale;
        this.app.stage.scale.set(this.scale);
        if (this._cb) this._cb();
    }

    onResize(fn) {
        this._cb = fn;
    }
}