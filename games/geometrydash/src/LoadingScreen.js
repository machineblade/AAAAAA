export class LoadingScreen extends PIXI.Container {

    /**
     * @param {object} textures - { background, creator, name }
     */
    build(textures) {
        this.textures = textures;

        // ── Static background (full natural size, centred, blue tint) ──
        this.bg = new PIXI.Sprite(textures.background);
        this.bg.anchor.set(0.5);
        this.bg.tint = 0x0066ff;
        this.addChild(this.bg);

        // ── Quant'm creator logo ──
        this.creator = new PIXI.Sprite(textures.creator);
        this.creator.anchor.set(0.5, 0);
        this.addChild(this.creator);

        // ── Quantum Dash game name logo ──
        this.gameName = new PIXI.Sprite(textures.name);
        this.gameName.anchor.set(0.5, 0);
        this.addChild(this.gameName);
    }

    layout(dw, dh) {
        // Background: natural size, centred
        this.bg.position.set(dw / 2, dh / 2);

        // Creator logo: 105px wide, 40px from top
        this.creator.scale.set(105 / this.textures.creator.width);
        this.creator.position.set(dw / 2, 40);
        const creatorH = this.textures.creator.height * this.creator.scale.y;

        // Game name: 300px wide, 20px below creator
        this.gameName.scale.set(300 / this.textures.name.width);
        this.gameName.position.set(dw / 2, 40 + creatorH + 20);
    }
}