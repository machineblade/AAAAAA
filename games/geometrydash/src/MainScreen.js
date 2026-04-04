import { Background } from './Background.js';

export class MainScene extends PIXI.Container {

    build() {
        this.background = new Background();
        this.background.build();
        this.addChild(this.background);
    }

    layout(dw, dh, scaleMax) {
        this.background.layout(dw, dh, scaleMax);
    }

    tick(dt) {
        this.background.tick(dt);
    }
}