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
        this.creator = new Button('creator', 13, 'https://altruism1.vercel.app');
        this.addChild(this.creator);

        // ── Close button — top left ──
        this.closeButton = new Button('closeButton', 25, () => {
            console.log('Close pressed!');
            // TODO: handle close action
        });
        this.addChild(this.closeButton);

        // ── Play button — centred ──
        this.playButton = new Button('playbutton', 80, () => {
            console.log('Play pressed!');
            // TODO: transition to game scene
        });
        this.addChild(this.playButton);

        // ── Garage + Edit buttons — flanking the play button ──
        this.garageButton = new Button('garageButton', 60, () => {
            console.log('Garage pressed!');
            // TODO: open garage/character select
        });
        this.addChild(this.garageButton);

        this.editButton = new Button('editButton', 60, () => {
            console.log('Edit pressed!');
            // TODO: open level editor
        });
        this.addChild(this.editButton);

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
        const creatorHalf = (12 / PIXI.Assets.get('creator').height) * PIXI.Assets.get('creator').width / 2;
        this.creator.position.set(10 + creatorHalf, dh - 10 - 1);

        // Close button: top-left, offset by half its size so centre-anchor sits in corner
        const closeHalf = 25 / 2;
        this.closeButton.position.set(10 + closeHalf, 10 + closeHalf);

        // Play button: centred
        this.playButton.position.set(dw / 2, dh / 2);

        // Garage (left) and Edit (right) flanking the play button
        const SIDE_SPACING = 80; // horizontal gap from play button centre to side button centre
        this.garageButton.position.set(dw / 2 - SIDE_SPACING, dh / 2);
        this.editButton.position.set(dw / 2 + SIDE_SPACING, dh / 2);
    }

    tick(dt) {
        this.background.tick(dt);
        this.creator.tick(dt);
        this.closeButton.tick(dt);
        this.playButton.tick(dt);
        this.garageButton.tick(dt);
        this.editButton.tick(dt);
    }
}