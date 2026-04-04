import { Background } from './Background.js';
import { Button } from './Button.js';
import { bounceOut } from './easings.js';

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
        this.creator.eventMode = 'static';
        this.creator.on('pointerup', () => {
            window.open('https://altruism1.vercel.app', '_blank');
        });
        this.addChild(this.creator);

        // ── Creator bounce state ──
        this._creatorHeld = false;
        this._creatorFrom = 1;
        this._creatorTo = 1;
        this._creatorDuration = 0;
        this._creatorElapsed = 0;
        this._creatorAnim = false;

        this.creator.on('pointerdown', () => {
            this._creatorHeld = true;
            this._creatorBounce(1.26, 0.3);
        });
        this.creator.on('pointerupoutside', () => {
            this._creatorHeld = false;
            this._creatorBounce(1, 0.4);
        });
        this.creator.on('pointerover', () => {
            if (this._creatorHeld) this._creatorBounce(1.26, 0.3);
        });
        this.creator.on('pointerout', () => {
            if (this._creatorHeld) this._creatorBounce(1, 0.4);
        });

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

        // Creator logo: 20 design points tall, 10px from bottom-left corner
        this.creator.scale.set(20 / this.creator.texture.height);
        this.creator.position.set(10, dh - 10);

        this.playButton.position.set(dw / 2, dh / 2);
    }

    _creatorBounce(toScale, duration) {
        this._creatorFrom = this.creator.scale.x;
        this._creatorTo = toScale * (20 / this.creator.texture.height);
        this._creatorDuration = duration;
        this._creatorElapsed = 0;
        this._creatorAnim = true;
    }

    tick(dt) {
        this.background.tick(dt);
        this.playButton.tick(dt);

        if (this._creatorAnim) {
            this._creatorElapsed += dt;
            if (this._creatorElapsed >= this._creatorDuration) {
                this._creatorElapsed = this._creatorDuration;
                this._creatorAnim = false;
            }
            const t = this._creatorElapsed / this._creatorDuration;
            const eased = bounceOut(t);
            const scale = this._creatorFrom + (this._creatorTo - this._creatorFrom) * eased;
            this.creator.scale.set(scale);
        }
    }
}