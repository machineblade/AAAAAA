import * as PIXI from "pixi.js";
import * as easings from "./easings.js";
import * as color from "./color.js";

const DESIGN_WIDTH = 480;
const DESIGN_HEIGHT = 320;

const TRANSITION_DURATION = 0.5;

const Director = {
  scenes: {},
  sceneHistory: [],
  size: {},

  initialize(app) {
    this.app = app;

    this.fadeOverlay = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.fadeOverlay.tint = color.black;
    this.fadeOverlay.alpha = 0;
    this._stopTransitioning();
    this.app.stage.addChild(this.fadeOverlay);

    this.transitionEase = new easings.Ease((alpha) => {
      this.fadeOverlay.alpha = alpha;
    }, easings.linear);

    this.windowResized();
    window.addEventListener("resize", () => this.windowResized());
  },

  windowResized() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let designWidth = DESIGN_WIDTH;
    let designHeight = DESIGN_HEIGHT;

    if ((windowHeight / DESIGN_HEIGHT) > (windowWidth / DESIGN_WIDTH))
      designHeight = Math.ceil(windowHeight / (windowWidth / DESIGN_WIDTH));
    else
      designWidth = Math.ceil(windowWidth / (windowHeight / DESIGN_HEIGHT));

    const scaleFactorWidth = designWidth / DESIGN_WIDTH;
    const scaleFactorHeight = designHeight / DESIGN_HEIGHT;
    const scaleFactorMin = Math.min(scaleFactorWidth, scaleFactorHeight);
    const scaleFactorMax = Math.max(scaleFactorWidth, scaleFactorHeight);

    this.app.stage.scale.set(
      windowWidth / designWidth,
      windowHeight / designHeight
    );

    this.size = {
      width: designWidth,
      height: designHeight,
      scaleFactorMin: scaleFactorMin,
      scaleFactorMax: scaleFactorMax
    };
    this.resize();
  },

  registerScene(name, sceneClass) {
    this.scenes[name] = sceneClass;
  },

  async setScene(params) {
    const name = params.name;
    const data = params.data;
    const toPreviousScene = params.previousScene;
    const transition = params.transition !== false;

    if (this.transitioning) return;
    this.transitioning = true;

    if (this.currentScene) {
      this.currentScene._recursiveRemoveListeners();
      if (!toPreviousScene)
        this.sceneHistory.push(this.currentScene);
    }

    // Set up the next layer underneath the current one while the transition starts
    if (toPreviousScene) {
      this.nextScene = this.sceneHistory.pop();
      this.nextScene._recursiveStart();
    } else
      this.nextScene = new this.scenes[name](data);

    this.resize();

    this.app.stage.addChild(this.nextScene);
    if (this.currentScene)
      this.app.stage.addChild(this.currentScene);
    this.app.stage.addChild(this.fadeOverlay);

    this.fadeOverlay.visible = true;
    this.fadeOverlay.eventMode = "static";

    if (transition)
      await this.transitionEase.start(TRANSITION_DURATION / 2, 0, 1);

    // Switch scenes and remove the previous one
    if (this.currentScene)
      this.app.stage.removeChild(this.currentScene);

    if (toPreviousScene)
      this.currentScene.destroy({children: true});
    this.currentScene = this.nextScene;
    this.nextScene = null;

    if (transition)
      await this.transitionEase.start(TRANSITION_DURATION / 2, 1, 0);

    this._stopTransitioning();
  },

  _stopTransitioning() {
    this.fadeOverlay.visible = false;
    this.fadeOverlay.eventMode = "none";
    this.transitioning = false;
  },

  resize() {
    this.fadeOverlay.setSize(this.size.width, this.size.height);
    this.currentScene?._recursiveResize(this.size);
    this.nextScene?._recursiveResize(this.size);
  },

  update(dt) {
    this.transitionEase.update(dt);
    this.currentScene?._recursiveUpdate(dt);
    this.nextScene?._recursiveUpdate(dt);
  }
};

export default Director;
