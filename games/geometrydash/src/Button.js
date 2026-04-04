import { bounceOut } from './easings.js';

export class Button extends PIXI.Container {

    /**
     * @param {string} alias - PIXI.Assets alias for the button texture
     * @param {function} onPress - callback fired when pointer is released over button
     */
    constructor(alias, onPress) {
        super();

        this._onPress = onPress;
        this._held = false;

        // ── Sprite ──
        this.view = new PIXI.Sprite(PIXI.Assets.get(alias));
        this.view.anchor.set(0.5);
        this.addChild(this.view);

        // ── Animation state ──
        this._fromScale = 1;
        this._toScale = 1;
        this._duration = 0;
        this._elapsed = 0;
        this._animating = false;

        // ── Input ──
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointerdown', this._onDown, this);
        this.on('pointerup', this._onUp, this);
        this.on('pointerupoutside', this._onUpOut, this);
        this.on('pointerover', this._onOver, this);
        this.on('pointerout', this._onOut, this);
    }

    // ── Input handlers ──

    _onDown() {
        this._held = true;
        this._animateTo(1.26, 0.3);
    }

    _onUp() {
        if (this._held) {
            this._held = false;
            this._stopAnim();
            if (this._onPress) this._onPress();
        }
    }

    _onUpOut() {
        this._held = false;
        this._animateTo(1, 0.4);
    }

    _onOver() {
        // Dragged back onto the button while held — re-select
        if (this._held) this._animateTo(1.26, 0.3);
    }

    _onOut() {
        // Dragged off while held — deselect
        if (this._held) this._animateTo(1, 0.4);
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
        this.view.scale.set(1);
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