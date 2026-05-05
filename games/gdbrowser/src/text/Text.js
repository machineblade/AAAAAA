import * as PIXI from "pixi.js"

export default class Text extends PIXI.BitmapText {
    constructor(text, font, size, align = "center") {
        super({
            text,
            style: { fontFamily: font, fontSize: size, align }
        });
    }

    setMaxWidth(maxWidth, minScale=1) {
        const width = this.width / this.scale.x;
        this.scale.set(Math.min(maxWidth / width, minScale));
    }
}