import { interpolate, packRGB } from './Utils.js';

export class Background extends PIXI.Container {

    build() {
        // ── Scrolling background ──
        this.bg = new PIXI.TilingSprite({
            texture: PIXI.Assets.get('background'),
            applyAnchorToTexture: true,
        });
        this.bg.anchor.y = 1;
        this.bg.tint = 0x0066ff;
        this.addChild(this.bg);

        // ── Ground container ──
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

        // ── Color cycling ──
        this.colorStops = [
            [0, 102, 255],
            [255, 0, 255],
            [255, 0, 125],
            [255, 0, 0],
            [255, 125, 0],
            [255, 255, 0],
            [0, 255, 0],
            [0, 255, 255],
        ];
        this.colorIndexA = 0;
        this.colorIndexB = 1;
        this.colorElapsed = 0;
    }

    layout(dw, dh, scaleFactorMax) {
        this.bg.width = dw;
        this.bg.height = dh;
        this.bg.position.y = dh;
        this.bg.tileScale.set(512 / this.bg.texture.frame.width * scaleFactorMax);

        this.ground.width = dw;
        this.rightShadow.position.x = dw + 1;
        this.line.position.x = dw / 2;
        this.groundContainer.y = dh - 90;
    }

    tick(dt) {
        // ── Scroll ──
        this.bg.tilePosition.x -= dt * 31.158;
        this.ground.tilePosition.x -= dt * 311.58;

        // ── Color cycle (shifts every 5s, lerps over 4s) ──
        this.colorElapsed += dt;
        if (this.colorElapsed >= 5) {
            this.colorElapsed -= 5;
            this.colorIndexA = (this.colorIndexA + 1) % this.colorStops.length;
            this.colorIndexB = (this.colorIndexB + 1) % this.colorStops.length;
        }

        const colorA = this.colorStops[this.colorIndexA];
        const colorB = this.colorStops[this.colorIndexB];
        const t = Math.min(this.colorElapsed / 4, 1);
        const tint = packRGB(
            interpolate(colorA[0], colorB[0], t),
            interpolate(colorA[1], colorB[1], t),
            interpolate(colorA[2], colorB[2], t),
        );

        this.bg.tint = tint;
        this.ground.tint = tint;
    }
}