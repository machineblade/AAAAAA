import { bounceOut } from './easings.js';

// Shared across all Button instances — true while any pointer is held down
let anyButtonHeld = false;

export class Button extends PIXI.Container {

    /**
     * @param {string}   alias    - PIXI.Assets alias for the button texture
     * @param {number}   points   - size in design-space points (scales by height)
     * @param {function|string} [redirect] - optional: callback on press, or a URL string to open in a new tab
     */
    constructor(alias, points, redirect) {
        super();

        this._baseScale = points / PIXI.Assets.get(alias).height;
        this._redirect = redirect;
        this._held = false;

        // ── Sprite ──
        this.view = new PIXI.Sprite(PIXI.Assets.get(alias));
        this.view.anchor.set(0.5);
        this.view.scale.set(this._baseScale);
        this.addChild(this.view);

        // ── Animation state ──
        this._fromScale = this._baseScale;
        this._toScale = this._baseScale;
        this._duration = 0;
        this._elapsed = 0;
        this._animating = false;

        // ── Input ──
        this.eventMode = 'static';
        this.on('pointerdown', this._onDown, this);
        this.on('pointerup', this._onUp, this);
        this.on('pointerupoutside', this._onUpOut, this);
        this.on('pointerover', this._onOver, this);
        this.on('pointerout', this._onOut, this);

        // Clear global held state if pointer released anywhere outside all buttons
        window.addEventListener('pointerup', () => {
            if (!this._held) anyButtonHeld = false;
        }, { passive: true });
    }

    // ── Input handlers ──

    _onDown() {
        this._held = true;
        anyButtonHeld = true;
        this._animateTo(this._baseScale * 1.26, 0.3);
    }

    _onUp() {
        if (this._held) {
            this._held = false;
            anyButtonHeld = false;
            this._stopAnim();
            if (typeof this._redirect === 'string') {
                window.open(this._redirect, '_blank');
            } else if (typeof this._redirect === 'function') {
                this._redirect();
            }
        }
    }

    _onUpOut() {
        if (this._held) {
            this._held = false;
            anyButtonHeld = false;
        }
        this._animateTo(this._baseScale, 0.4);
    }

    _onOver() {
        // Trigger bounce if dragging in from any button
        if (anyButtonHeld) {
            this._held = true;
            this._animateTo(this._baseScale * 1.26, 0.3);
        }
    }

    _onOut() {
        if (this._held) {
            this._held = false;
            this._animateTo(this._baseScale, 0.4);
        }
    }

    // ── Animation helpers ──

    _animateTo(toScale, duration) {
        this._fromScale = this.view.scale.x;
        this._toScale = toScale;
        this._duration = duration;
        this._elapsed = 0;
        this._animating = true;
    }

    _stopAnim() {
        this._animating = false;
        this.view.scale.set(this._baseScale);
    }

    // ── Tick (call every frame, dt in seconds) ──

    tick(dt) {
        if (!this._animating) return;

        this._elapsed += dt;
        if (this._elapsed >= this._duration) {
            this._elapsed = this._duration;
            this._animating = false;
        }

        const t = this._elapsed / this._duration;
        const eased = bounceOut(t);
        const scale = this._fromScale + (this._toScale - this._fromScale) * eased;
        this.view.scale.set(scale);
    }
}