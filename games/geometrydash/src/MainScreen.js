import { Background } from './Background.js';
import { Button } from './Button.js';

export class MainScene extends PIXI.Container {

    build() {
        this.background = new Background();
        this.background.build();
        this.addChild(this.background);

        // ── Game name — top centre ──
        this.gameName = new PIXI.Sprite(PIXI.Assets.get('name'));
        this.gameName.anchor.set(0.5, 0);
        this.addChild(this.gameName);

        // ── Creator logo — bottom left ──
        this.creator = new PIXI.Sprite(PIXI.Assets.get('creator'));
        this.creator.anchor.set(0, 1);
        this.addChild(this.creator);

        // ── Play button centred on screen ──
        this.playButton = new Button('playbutton', () => {
            console.log('Play pressed!');
            // TODO: transition to game scene
        });
        this.playButton.scale.set(0.25);
        this.addChild(this.playButton);
    }

    layout(dw, dh) {
        this.background.layout(dw, dh);

        // Game name: 300px wide, 12px from top
        this.gameName.scale.set(300 / this.gameName.texture.width);
        this.gameName.position.set(dw / 2, 12);

        // Creator logo: 10px wide, 10px from bottom-left corner
        this.creator.scale.set(10 / this.creator.texture.width);
        this.creator.position.set(10, dh - 10);

        this.playButton.position.set(dw / 2, dh / 2);
    }

    tick(dt) {
        this.background.tick(dt);
        this.playButton.tick(dt);
    }
}