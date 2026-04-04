import { Background } from './Background.js';
import { Button } from './Button.js';

export class MainScene extends PIXI.Container {

    build() {
        this.background = new Background();
        this.background.build();
        this.addChild(this.background);

        // ── Play button centred on screen ──
        this.playButton = new Button('playbutton', () => {
            console.log('Play pressed!');
            // TODO: transition to game scene
        });
        this.playButton.scale.set(0.21);
        this.addChild(this.playButton);
    }

    layout(dw, dh) {
        this.background.layout(dw, dh);
        this.playButton.position.set(dw / 2, dh / 2);
    }

    tick(dt) {
        this.background.tick(dt);
        this.playButton.tick(dt);
    }
}