export class LoadingScreen extends PIXI.Container {

    /**
     * @param {object} textures - { background, creator, name, sliderGroove, sliderBar }
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
    }

    _buildBar(textures) {
        this.barContainer = new PIXI.Container();
        this.addChild(this.barContainer);

        this.barW = 0; // set in layout()
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

        // ── Creator logo: 105px wide, 40px from top ──
        this.creator.scale.set(105 / this.textures.creator.width);
        this.creator.position.set(dw / 2, 40);
        const creatorH = this.textures.creator.height * this.creator.scale.y;

        // ── Game name: 300px wide, 20px below creator ──
        this.gameName.scale.set(300 / this.textures.name.width);
        this.gameName.position.set(dw / 2, 40 + creatorH + 20);

        // ── Bar: 60% of screen width, near the bottom ──
        this.barW = dw * 0.6;
        this.barContainer.position.set(dw / 2, dh * 0.88);

        // Scale groove to fill barW
        const grooveTex = this.textures.sliderGroove;
        const grooveScale = this.barW / grooveTex.width;
        this.groove.scale.set(grooveScale);
        this.barH = grooveTex.height * grooveScale;

        // Fill bar is inset inside the groove — 70% of groove height, centred
        const inset = this.barH * 0.30;
        const fillH = this.barH - inset;
        this.barFill.x = -this.barW / 2;
        this.barFill.y = 0;
        this.barFill.height = fillH;
        this.barFill.tileScale.set(fillH / this.textures.sliderBar.height);

        this._drawMask(this._progress);
    }

    setProgress(p) {
        p = Math.min(1, Math.max(0, p));
        this._progress = p;
        this._drawMask(p);
    }

    _drawMask(p) {
        if (!this.barMask || this.barW === 0) return;

        const inset = this.barH * 0.30;
        const fillH = this.barH - inset;
        const w = this.barW * p;
        const r = fillH / 2;
        const x = -this.barW / 2;
        const y = -fillH / 2;

        this.barMask.clear();
        if (w < 1) return;

        this.barMask
            .roundRect(x, y, w, fillH, r)
            .fill({ color: 0xffffff });
    }
}