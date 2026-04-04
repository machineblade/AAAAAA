import * as PIXI from "pixi.js";
import * as easings from "./easings.js";
import {interpolate} from "./Utils.js";

class Button extends PIXI.Container {
  constructor(textureName, frame) {
    super();
    this.frame = frame;

    const texture = PIXI.Texture.from(textureName);
    this.layout = {
      width: texture.width,
      height: texture.height
    };

    this.view = new PIXI.Sprite(texture);
    this.view.anchor.set(0.5);
    this.view.x = texture.width / 2;
    this.view.y = texture.height / 2;
    this.addChild(this.view);

    this.fromScale = 1;
    this.toScale = 1;
    this.duration = 0;
    this.timeSpent = 0;
    this.animating = false;

    this.eventMode = "static";
    this.on("pointerdown", this.pointerdown, this);
    this.on("pointerupoutside", this.pointerupoutside, this);
    this.on("pointerover", this.pointerover, this);
    this.on("pointerout", this.pointerout, this);
    this.on("pointerup", this.pointerup, this);
  }

  pointerdown() {
    this.frame.buttonSelected = true;
    this.selected();
  }

  pointerupoutside() {
    this.frame.buttonSelected = false;
  }

  pointerover() {
    if (this.frame.buttonSelected)
      this.selected();
  }

  pointerout() {
    if (this.frame.buttonSelected)
      this.deselected();
  }

  pointerup() {
    this.animating = false;
    this.view.scale.set(1);
    this.frame.buttonSelected = false;
  }

  selected() {
    this.animating = true;
    this.fromScale = this.view.scale.x;
    this.toScale = 1.26;
    this.duration = 0.3;
    this.timeSpent = 0;
  }

  deselected() {
    this.animating = true;
    this.fromScale = this.view.scale.x;
    this.toScale = 1;
    this.duration = 0.4;
    this.timeSpent = 0;
  }

  pressed() {
    this.animating = false;
    this.view.scale.set(1);
  }

  update(dt) {
    if (!this.animating) return;

    this.timeSpent += dt;
    if (this.timeSpent >= this.duration) {
      this.animating = false;
      this.timeSpent = this.duration;
    }

    const t = Math.min(Math.max(this.timeSpent / this.duration, 0), 1);
    const easing = easings.bounceOut(t, 0.3);
    const scale = interpolate(this.fromScale, this.toScale, easing);
    this.view.scale.set(scale);
  }
}

export default class ButtonFrame extends PIXI.Container {
  constructor(...args) {
    super(...args);
    this.build();
    this.buttonSelected = false;
  }

  addButton(textureName) {
    const button = new Button(textureName, this);
    if (this.layout)
      button.layout = true;
    this.addChild(button);

    return button;
  }

  update(dt) {
    this.children.forEach((child) => {
      child.update?.(dt);
    });
  }
}
