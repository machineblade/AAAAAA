// ╔══════════════════════════════════════════════════════════════╗
// ║                    ✏️  TWEAK ZONE                            ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Logos ──────────────────────────────────────────────────────
const CREATOR_W = 105;        // creator logo width in px
const CREATOR_TOP = 40;         // distance from top of screen
const NAME_W = 300;        // game name logo width in px
const NAME_GAP = 20;         // gap between creator and name logos

// ── Loading bar ────────────────────────────────────────────────
const BAR_W_FRACTION = 0.6;        // bar width as fraction of screen width
const BAR_Y_FRACTION = 0.6;        // bar vertical position as fraction of screen height
const BAR_SCALE = 1.0;        // multiplier on groove's natural height
const FILL_H_FRACTION = 0.5;        // fill height as fraction of scaled bar height

// ── Splash text ────────────────────────────────────────────────
const SPLASH_GAP = 10;         // gap between bar bottom and splash text
const SPLASH_FONT_SIZE = 15;         // font size in design-space px
const SPLASH_RESOLUTION = 6;          // render resolution multiplier (higher = crisper)
const SPLASH_STROKE_WIDTH = 8;          // outline stroke width (at render resolution)
const SPLASH_STROKE_COLOR = '#000000';  // outline colour
const SPLASH_GRAD_TOP = '#FCB227';  // gradient colour at top of each letter
const SPLASH_GRAD_BOTTOM = '#FFD844';  // gradient colour at bottom of each letter

// ══════════════════════════════════════════════════════════════


export class LoadingScreen extends PIXI.Container {

    /**
     * @param {object} textures - { background, creator, name, sliderGroove, sliderBar, splash }
     */
    build(textures) {
        this.textures = textures;

        // ── Background ──
        this.bg = new PIXI.Sprite(textures.background);
        this.bg.anchor.set(0.5);
        this.bg.tint = 0x0066ff;
        this.addChild(this.bg);

        // ── Creator logo ──
        this.creator = new PIXI.Sprite(textures.creator);
        this.creator.anchor.set(0.5, 0);
        this.addChild(this.creator);

        // ── Game name logo ──
        this.gameName = new PIXI.Sprite(textures.name);
        this.gameName.anchor.set(0.5, 0);
        this.addChild(this.gameName);

        // ── Loading bar ──
        this._buildBar(textures);

        // ── Splash text: loaded from file, rendered with per-letter gradient + stroke ──
        this.splashText = null; // built async in _loadSplash()
        this._loadSplash();
    }

    async _loadSplash() {
        const res = await fetch('./assets/resources/gameSplashes.txt');
        const text = await res.text();
        const splashes = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        const splash = splashes[Math.floor(Math.random() * splashes.length)];

        this.splashText = this._buildSplashSprite(splash);
        this.splashText.anchor.set(0.5, 0);
        this.addChild(this.splashText);

        // Position it if layout() already ran
        if (this._lastLayout) {
            const { dw, dh, barY } = this._lastLayout;
            this.splashText.position.set(dw / 2, barY + this.barH / 2 + SPLASH_GAP);
        }
    }

    _buildSplashSprite(text) {
        const fs = SPLASH_FONT_SIZE * SPLASH_RESOLUTION;

        // ── Measure on a temp canvas ──
        const tmp = document.createElement('canvas').getContext('2d');
        tmp.font = `${fs}px Pusab, sans-serif`;
        const textW = Math.ceil(tmp.measureText(text).width);
        const textH = fs * 1.3;

        // ── Render canvas ──
        const pad = SPLASH_STROKE_WIDTH + 2;
        const canvas = document.createElement('canvas');
        canvas.width = textW + pad * 2;
        canvas.height = Math.ceil(textH) + pad * 2;
        const ctx = canvas.getContext('2d');
        ctx.font = `${fs}px Pusab, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        let curX = pad;
        for (const char of text) {
            const charW = ctx.measureText(char).width;

            // Per-letter vertical gradient
            const grad = ctx.createLinearGradient(curX, pad, curX, pad + textH);
            grad.addColorStop(0, SPLASH_GRAD_TOP);
            grad.addColorStop(1, SPLASH_GRAD_BOTTOM);

            // Stroke first, then fill on top
            ctx.strokeStyle = SPLASH_STROKE_COLOR;
            ctx.lineWidth = SPLASH_STROKE_WIDTH;
            ctx.lineJoin = 'round';
            ctx.strokeText(char, curX, pad);

            ctx.fillStyle = grad;
            ctx.fillText(char, curX, pad);

            curX += charW;
        }

        const sprite = new PIXI.Sprite(PIXI.Texture.from(canvas));
        sprite.scale.set(1 / SPLASH_RESOLUTION);
        return sprite;
    }

    _buildBar(textures) {
        this.barContainer = new PIXI.Container();
        this.addChild(this.barContainer);

        this.barW = 0;
        this.barH = 0;

        // ── Fill: TilingSprite of sliderBar, clipped by a rounded-rect mask ──
        this.barFill = new PIXI.TilingSprite({ texture: textures.sliderBar });
        this.barFill.anchor.set(0, 0.5);

        this.barMask = new PIXI.Graphics();
        this.barFill.mask = this.barMask;

        this.barContainer.addChild(this.barFill);
        this.barContainer.addChild(this.barMask);

        // ── Groove (frame) sits on top ──
        this.groove = new PIXI.Sprite(textures.sliderGroove);
        this.groove.anchor.set(0.5, 0.5);
        this.barContainer.addChild(this.groove);

        this._progress = 0;
    }

    layout(dw, dh) {
        // ── Background: cover-fit ──
        const tex = this.textures.background;
        const scale = Math.max(dw / tex.width, dh / tex.height);
        this.bg.scale.set(scale);
        this.bg.position.set(dw / 2, dh / 2);

        // ── Creator logo ──
        this.creator.scale.set(CREATOR_W / this.textures.creator.width);
        this.creator.position.set(dw / 2, CREATOR_TOP);
        const creatorH = this.textures.creator.height * this.creator.scale.y;

        // ── Game name logo ──
        this.gameName.scale.set(NAME_W / this.textures.name.width);
        this.gameName.position.set(dw / 2, CREATOR_TOP + creatorH + NAME_GAP);

        // ── Bar ──
        this.barW = dw * BAR_W_FRACTION;
        const barY = dh * BAR_Y_FRACTION;
        this.barContainer.position.set(dw / 2, barY);

        const grooveTex = this.textures.sliderGroove;
        const grooveScale = (this.barW / grooveTex.width) * BAR_SCALE;
        this.groove.scale.set(grooveScale);
        this.barH = grooveTex.height * grooveScale;

        const FILL_H = this.barH * FILL_H_FRACTION;
        this.barFill.x = -this.barW / 2;
        this.barFill.y = 0;
        this.barFill.width = this.barW;
        this.barFill.height = FILL_H;
        this.barFill.tileScale.set(FILL_H / this.textures.sliderBar.height);

        this._drawMask(this._progress);

        // Cache for async splash positioning
        this._lastLayout = { dw, dh, barY };

        // ── Splash text ──
        if (this.splashText) {
            this.splashText.position.set(dw / 2, barY + this.barH / 2 + SPLASH_GAP);
        }
    }

    setProgress(p) {
        p = Math.min(1, Math.max(0, p));
        this._progress = p;
        this._drawMask(p);
    }

    _drawMask(p) {
        if (!this.barMask || this.barW === 0) return;

        const FILL_H = this.barH * FILL_H_FRACTION;
        const w = this.barW * p;
        const r = FILL_H / 2;
        const x = -this.barW / 2;
        const y = -FILL_H / 2;

        this.barMask.clear();
        if (w < 1) return;

        if (p >= 1) {
            // Full: both caps rounded
            this.barMask
                .roundRect(x, y, w, FILL_H, r)
                .fill({ color: 0xffffff });
        } else {
            // Partial: left cap rounded, right edge square
            this.barMask
                .roundRect(x, y, w + r, FILL_H, r)
                .fill({ color: 0xffffff });
            this.barMask
                .rect(x + r, y, w - r, FILL_H)
                .fill({ color: 0xffffff });
        }
    }
}