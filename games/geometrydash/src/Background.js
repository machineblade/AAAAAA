export class Background extends PIXI.Container {

    build() {
        // ── Scrolling background tiles ──
        this.bg = new PIXI.TilingSprite({
            texture: PIXI.Assets.get('background'),
            applyAnchorToTexture: true,
        });
        this.bg.anchor.y = 1;
        this.bg.tint = 0x0066ff;
        this.addChild(this.bg);

        // ── Ground container (ground + shadows + line) ──
        this.groundContainer = new PIXI.Container();

        this.ground = new PIXI.TilingSprite({
            texture: PIXI.Assets.get('ground'),
            height: 90,
        });
        this.ground.tileScale.set(128 / this.ground.texture.frame.width);
        this.ground.tint = 0x0066ff;
        this.groundContainer.addChild(this.ground);

        const leftShadow = new PIXI.Sprite(PIXI.Assets.get('groundshadow'));
        leftShadow.position.x = -1;
        leftShadow.setSize(128);
        leftShadow.scale.x *= 0.7;
        leftShadow.alpha = 0.4;
        this.groundContainer.addChild(leftShadow);

        this.rightShadow = new PIXI.Sprite(PIXI.Assets.get('groundshadow'));
        this.rightShadow.setSize(128);
        this.rightShadow.scale.x *= -0.7;
        this.rightShadow.alpha = 0.4;
        this.groundContainer.addChild(this.rightShadow);

        this.line = new PIXI.Sprite(PIXI.Assets.get('groundline'));
        this.line.anchor.x = 0.5;
        this.line.scale.set(444 / this.line.width);
        this.groundContainer.addChild(this.line);

        this.addChild(this.groundContainer);
    }

    layout(dw, dh) {
        // Fill exactly the design canvas (dw × dh) — no scaleMax inflation.
        // tileScale is set so one tile spans the full canvas height.
        this.bg.width = dw;
        this.bg.height = dh;
        this.bg.position.y = dh;
        this.bg.tileScale.set(dh / this.bg.texture.frame.height);

        this.ground.width = dw;
        this.rightShadow.position.x = dw + 1;
        this.line.position.x = dw / 2;
        this.groundContainer.y = dh - 90;
    }

    tick(dt) {
        this.bg.tilePosition.x -= dt * 31.158;
        this.ground.tilePosition.x -= dt * 311.58;
    }
}