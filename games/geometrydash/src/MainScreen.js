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

        // ── Creator logo — bottom left, links to site ──
        this.creator = new Button('creator', 20, 'https://altruism1.vercel.app');
        this.addChild(this.creator);

        // ── Play button — centred ──
        this.playButton = new Button('playbutton', 80, () => {
            console.log('Play pressed!');
            // TODO: transition to game scene
        });
        this.addChild(this.playButton);

        // ── Menu music — autoplay is safe, user already clicked ──
        this._music = new Audio('./assets/songs/menuLoop.mp3');
        this._music.loop = true;
        this._music.play();
    }

    destroy(options) {
        this._music.pause();
        this._music.currentTime = 0;
        super.destroy(options);
    }

    layout(dw, dh) {
        this.background.layout(dw, dh);

        // Game name: 300 design points wide, 12 from top
        this.gameName.scale.set(300 / this.gameName.texture.width);
        this.gameName.position.set(dw / 2, 12);

        // Creator: bottom-left, offset by half its size so centre-anchor sits in corner
        const creatorHalf = (20 / PIXI.Assets.get('creator').height) * PIXI.Assets.get('creator').width / 2;
        this.creator.position.set(10 + creatorHalf, dh - 10 - 10);

        // Play button: centred
        this.playButton.position.set(dw / 2, dh / 2);
    }

    tick(dt) {
        this.background.tick(dt);
        this.creator.tick(dt);
        this.playButton.tick(dt);
    }
}