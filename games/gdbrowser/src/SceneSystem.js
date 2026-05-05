import * as PIXI from "pixi.js";

// Scenes extend Scene and are top-level containers
// SceneComponents are children containers of Scenes
// Both share a common lifecycle:
// 1. initialize(...args)
//    - This function is overridden and takes in arguments passed to the constructor
//    - Used as an easy way to set up per-instance properties without using super(...args)
// 2. build()
//    - This function creates and adds children
//    - Only called once; children added afterward are not subject to layout calculations
// 3. resize(size)
//    - Handles repositioning of children according to the window size
//    - Automatically passed recursively to resizable children as well
// 4. update(dt)
//    - Used for animations or anything requiring time
//    - Also automatically passed recursively

export class Scene extends PIXI.Container {
  constructor(...args) {
    super();

    this.initialize?.(...args);
    this.build();
  }

  _recursiveResize(size) {
    this.resize?.(size);
    this.children.forEach(child => child._recursiveResize?.(size));
  }

  _recursiveUpdate(dt) {
    this.update?.(dt);
    this.children.forEach(child => child._recursiveUpdate?.(dt));
  }

  // To be overriden by scenes
  initialize(...args) {}
  build() {}
  resize(size) {}
  update(dt) {}
}

export class SceneComponent extends PIXI.Container {
  constructor(...args) {
    super();

    this._setup?.();
    this.initialize?.(...args);
    this.build();
    this.updateLayout?.();
  }

  _setup() {}

  _recursiveResize(size) {
    this.resize?.(size);
    this.children.forEach(child => child._recursiveResize?.(size));
  }

  _recursiveUpdate(dt) {
    this.update?.(dt);
    this.children.forEach(child => child._recursiveUpdate?.(dt));
  }

  // To be overridden by scene components
  initialize(...args) {}
  build() {}
  resize() {}
  update(dt) {}
}
