import * as PIXI from "pixi.js";
import director from "./Director.js";
import LevelScene from "./scenes/LevelScene.js";

const assets = [
  "GJ_gradientBG-hd.png",
  "GJ_GameSheet03-uhd.json",
  "bigFont-uhd.fnt",
  "goldFont-uhd.fnt"
];


(async () => {
  const app = new PIXI.Application();

  await app.init({ resizeTo: window });
globalThis.__PIXI_APP__ = app;
  document.getElementById("pixi-container").appendChild(app.canvas);

  await PIXI.Assets.init({ basePath: "assets/" });
  await PIXI.Assets.load(assets);

  director.initialize(app);
  director.registerScene("LevelScene", LevelScene);
  await director.setScene({ name: "LevelScene", transition: false });

  app.ticker.add((ticker) => {
    director.update(ticker.deltaMS / 1000);
  });
})();