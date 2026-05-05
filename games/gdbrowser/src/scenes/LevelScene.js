import { Scene } from "../SceneSystem.js";
import * as PIXI from "pixi.js"
import * as color from "../color.js"
import ButtonFrame from "../ButtonFrame.js";
import Text from "../text/Text.js";
import * as data from "../server/data.js";
const level = await data.getLevelDetails("139601557");
const userInfo = await data.getUserByPlayerId(level.authorUserId);
class CreatorButton extends ButtonFrame {
    initialize(player) {
        this.player = player;
    }

    build() {
        const text = new Text(`By ${this.player.username}`, "goldFont", 19);
        const button = this.createButton(text);
        this.addChild(button);
    }
}

export default class LevelScene extends Scene {
    build() {
        this.gradientBG = PIXI.Sprite.from("GJ_gradientBG-hd.png")
        this.gradientBG.tint = color.rgb(0, 102, 255);
        this.gradientBG.alpha = 255
        this.addChild(this.gradientBG)

        this.sideArt = PIXI.Sprite.from("GJ_sideArt_001.png");
        this.addChild(this.sideArt)
        
        this.sideArt2 = PIXI.Sprite.from("GJ_sideArt_001.png");
        this.addChild(this.sideArt2)

        this.title = new Text(level.name, "bigFont", 26)
        this.addChild(this.title)

        this.creator = new CreatorButton(userInfo)
        this.creator.anchor.set(0.5);
        this.addChild(this.creator)


        this.statsContainer = new PIXI.Container();
        this.addChild(this.statsContainer);

        const downloadsIcon = PIXI.Sprite.from("GJ_downloadsIcon_001.png");
        downloadsIcon.anchor.set(0, 0.5);
        this.statsContainer.addChild(downloadsIcon);

        this.downloadsAmount = new Text(level.downloads.toLocaleString(), "bigFont", 16.25);
        this.downloadsAmount.anchor.y = 0.5;
        this.downloadsAmount.setMaxWidth(60);
        this.downloadsAmount.x = 33;
        this.statsContainer.addChild(this.downloadsAmount);

        const rated = level.stars > 0;
        const likesY = rated ? 27 : 29;
        const likesIcon = PIXI.Sprite.from("GJ_likesIcon_001.png");
        likesIcon.anchor.set(0, 0.5)
        likesIcon.y = likesY;
        this.statsContainer.addChild(likesIcon);

        this.likesAmount = new Text(level.likes.toLocaleString(), "bigFont", 16.25);
        this.likesAmount.anchor.y = 0.5;
        this.likesAmount.setMaxWidth(60);
        this.likesAmount.position.set(33, likesY);
        this.statsContainer.addChild(this.likesAmount);

        const lengthY = rated ? 56 : 60;
        const lengthIcon = PIXI.Sprite.from("GJ_timeIcon_001.png");
        lengthIcon.anchor.y = 0.5;
        lengthIcon.y = lengthY;
        this.statsContainer.addChild(lengthIcon);
    
        const lengths = ["Tiny", "Short", "Medium", "Long", "XL", "Plat."];
        const length = lengths[this.level.length];
        const lengthLabel = new Text(length, "bigFont", 16.25);
        lengthLabel.anchor.y = 0.5;
        lengthLabel.position.set(33, lengthY);
        this.statsContainer.addChild(lengthLabel);
    
        if (this.isPlatformer) {
            lengthLabel.y -= 6;
    
            const exactLengthLabel = new Text("Dur.", "bigFont", 11.375);
            exactLengthLabel.anchor.y = 0.5;
            exactLengthLabel.position.set(33, lengthLabel.y + 14);
            this.statsContainer.addChild(exactLengthLabel);
        }
        
    }

    resize(size) {
        const { width, height, scaleFactorMax } = size;
        this.gradientBG.setSize(width + 10, height + 10);
        this.gradientBG.position.set(-5, -5)

        this.sideArt.anchor.set(0, 1);
        this.sideArt.position.set(-1, height + 1);
        this.sideArt.setSize(71.5, 70.5)

        this.sideArt2.anchor.set(0, 1);
        this.sideArt2.scale.x = -1
        this.sideArt2.position.set(width + 1, height + 1);
        this.sideArt2.setSize(71.5, 70.5)

        this.title.position.set(width / 2, 17);
        this.title.anchor.set(0.5)

        this.creator.position.set(width / 2, 43);

        const rated = level.stars > 0;
        this.statsContainer.position.set(width / 2 + 80, height / 2 - (rated ? 89 : 81));


    }

    update(dt) {

    }
}