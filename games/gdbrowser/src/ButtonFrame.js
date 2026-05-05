import * as PIXI from "pixi.js";
import * as easings from "./easings.js";
import {SceneComponent} from "./SceneSystem.js";
import SimpleLayout from "./SimpleLayout.js";

class Button extends SceneComponent {
  initialize(frame, source, callback, keybind) {
    this.buttonFrame = frame;
    this.source = source;
    this.callback = callback;
    this.keybind = keybind;

    this.maxScale = 1.26;

    this.eventMode = "static";
    this.view = null;
    this.ease = new easings.Ease(scale => {
      this.view.scale.set(scale);
    }, easings.bounceOut);
  }

  build() {
    if (typeof this.source === "string")
      // Button source is a texture name
      this.view = PIXI.Sprite.from(this.source);

    else
      // Button source is a container or other display object
      this.view = this.source;

    const {width, height} = this.view.getSize();
    this.view.origin.set(width / 2, height / 2);
    this.addChild(this.view);

    if (this.keybind) {
      const listener = event => {
        if (event.key === this.keybind)
          this.callback();
      };

      window.addEventListener("keydown", listener);
      this.once("destroyed", () => {
        window.removeEventListener("keydown", listener);
      });
    }
  }

  onpointerdown(event) {
    event.stopPropagation();
    this.buttonFrame.selected = true;
    this.selected();
  }

  onpointerupoutside() {
    this.buttonFrame.selected = false;
  }

  onpointerover() {
    if (this.buttonFrame.selected)
      this.selected();
  }

  onpointerout() {
    if (this.buttonFrame.selected)
      this.deselected();
  }

  onpointerup() {
    if (this.buttonFrame.selected) {
      this.ease.to = 1;
      this.ease.end();
      this.buttonFrame.selected = false;
      this.callback?.();
    }
  }

  selected() {
    this.ease.start(0.3, this.view.scale.x, this.maxScale);
  }

  deselected() {
    this.ease.start(0.4, this.view.scale.x, 1);
  }

  update(dt) {
    this.ease.update(dt);
  }
}

// Each button exists only within a frame;
// this lets you click on one button, then move to another
// in the same frame and activate that one instead
export default class ButtonFrame extends SimpleLayout {
  constructor(layout) {
    super(layout);
    this.selected = false;
  }

  createButton(source, callback, keybind) {
    return new Button(this, source, callback, keybind);
  }
}
