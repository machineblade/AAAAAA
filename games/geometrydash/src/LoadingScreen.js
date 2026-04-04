export class LoadingScreen extends PIXI.Container {

    /**
     * @param {object} textures - { background, creator, name, sliderGroove, sliderBar, splash }
     */
    build(textures) {
        this.textures = textures;

        // ── Background ──
        this.bg = new PIXI.Sprite(textures.background);
        this.bg.anchor.set(0.5);
        this.bg.tint = 0x0066ff;
        this.addChild(this.bg);

        // ── Creator logo ──
        this.creator = new PIXI.Sprite(textures.creator);
        this.creator.anchor.set(0.5, 0);
        this.addChild(this.creator);

        // ── Game name logo ──
        this.gameName = new PIXI.Sprite(textures.name);
        this.gameName.anchor.set(0.5, 0);
        this.addChild(this.gameName);

        // ── Loading bar ──
        this._buildBar(textures);

        // ── Splash text ──
        const SPLASHES = [
            "Only one?", "Listen to the music to help time your jumps", "Back for more are ya?",
            "Use practice mode to learn the layout of a level", "If at first you don't succeed, try, try again...",
            "Customize your character's icon and color!", "You can download all songs from the level select page!",
            "Spikes are not your friends. don't forget to jump", "Build your own levels using the level editor",
            "Go online to play other players levels!", "Can you beat them all?", "Here be dragons...",
            "Pro tip: Don't crash", "Hold down to keep jumping", "The spikes whisper to me...",
            "Looking for pixels", "Loading awesome soundtracks...", "What if the spikes are the good guys?",
            "Pro tip: Jump", "Does anyone even read this?", "Collecting scrap metal",
            "Waiting for planets to align", "Starting the flux capacitor", "Wandering around aimlessly",
            "Where did I put that coin...", "Loading the progressbar", "Calculating chance of success",
            "Hiding secrets", "Drawing pretty pictures", "Programmer is sleeping, please wait",
            "RobTop is Love, RobTop is Life", "Play, Crash, Rage, Quit, Repeat",
            "Only one button required to crash", "Such wow, very amaze.", "Fus Ro DASH!",
            "Loading Rage Cannon", "Counting to 1337", "It's all in the timing", "Fake spikes are fake",
            "Spikes... OF DOOM!", "Why don't you go outside?", "Loading will be finished... soon",
            "This seems like a good place to hide a secret...", "The vault Keeper's name is 'Spooky'...",
            "Hop the big guy doesn't wake up...", "Shhhh! You're gonna wake the big one!",
            "I have been expecting you.", "A wild RubRub appeared!", "So many secrets...",
            "Hiding rocket launcher", "It's Over 9000!", "Programming amazing AI", "Hiding secret vault",
            "Spooky doesn't get out much", "RubRub was here", "Warp Speed", "So, what's up?",
            "Hold on, reading the manual", "I don't know how this works...", "Why u have to be mad?",
            "It is only game...", "Unlock new icons and colors by completing achievements",
        ];
        const splash = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];

        this.splashText = new PIXI.Text({
            text: splash,
            style: {
                fontFamily: 'Pusab',
                fontWeight: '900',
                fontSize: 11,
                fill: 0xffffff,
                align: 'center',
                dropShadow: {
                    color: 0x000000,
                    blur: 0,
                    distance: 1,
                    angle: Math.PI / 4,
                },
            },
        });
        this.splashText.anchor.set(0.5, 0);
        this.addChild(this.splashText);
    }

    _buildBar(textures) {
        this.barContainer = new PIXI.Container();
        this.addChild(this.barContainer);

        this.barW = 0;
        this.barH = 0;

        // ── Fill: TilingSprite of sliderBar, clipped by a rounded-rect mask ──
        this.barFill = new PIXI.TilingSprite({ texture: textures.sliderBar });
        this.barFill.anchor.set(0, 0.5);

        this.barMask = new PIXI.Graphics();
        this.barFill.mask = this.barMask;

        this.barContainer.addChild(this.barFill);
        this.barContainer.addChild(this.barMask);

        // ── Groove (frame) sits on top ──
        this.groove = new PIXI.Sprite(textures.sliderGroove);
        this.groove.anchor.set(0.5, 0.5);
        this.barContainer.addChild(this.groove);

        this._progress = 0;
    }

    layout(dw, dh) {
        // ── ✏️ TWEAK THESE VALUES ──────────────────────────────────────────
        const CREATOR_W = 105;    // creator logo width in px
        const CREATOR_TOP = 40;     // distance from top of screen
        const NAME_W = 300;    // game name logo width in px
        const NAME_GAP = 20;     // gap between creator and name logos
        const BAR_W_FRACTION = 0.6;    // bar width as fraction of screen width
        const BAR_Y_FRACTION = 0.65;   // bar vertical position as fraction of screen height
        const BAR_SCALE = 1.0;    // multiplier on the groove's natural height (makes bar taller)
        const FILL_H_FRACTION = 0.5;    // fill height as fraction of scaled bar height
        const SPLASH_GAP = 10;     // gap between bar bottom and splash text
        // ─────────────────────────────────────────────────────────────────

        // ── Background: cover-fit ──
        const tex = this.textures.background;
        const scale = Math.max(dw / tex.width, dh / tex.height);
        this.bg.scale.set(scale);
        this.bg.position.set(dw / 2, dh / 2);

        // ── Creator logo ──
        this.creator.scale.set(CREATOR_W / this.textures.creator.width);
        this.creator.position.set(dw / 2, CREATOR_TOP);
        const creatorH = this.textures.creator.height * this.creator.scale.y;

        // ── Game name logo ──
        this.gameName.scale.set(NAME_W / this.textures.name.width);
        this.gameName.position.set(dw / 2, CREATOR_TOP + creatorH + NAME_GAP);

        // ── Bar ──
        this.barW = dw * BAR_W_FRACTION;
        const barY = dh * BAR_Y_FRACTION;
        this.barContainer.position.set(dw / 2, barY);

        // Scale groove to fill barW, then apply BAR_SCALE to make it taller
        const grooveTex = this.textures.sliderGroove;
        const grooveScale = (this.barW / grooveTex.width) * BAR_SCALE;
        this.groove.scale.set(grooveScale);
        this.barH = grooveTex.height * grooveScale;

        // Fill height is a fraction of the scaled bar height
        const FILL_H = this.barH * FILL_H_FRACTION;
        this.barFill.x = -this.barW / 2;
        this.barFill.y = 0;
        this.barFill.width = this.barW;
        this.barFill.height = FILL_H;
        this.barFill.tileScale.set(FILL_H / this.textures.sliderBar.height);

        this._drawMask(this._progress);

        // ── Splash text ──
        this.splashText.position.set(dw / 2, barY + this.barH / 2 + SPLASH_GAP);
    }

    setProgress(p) {
        p = Math.min(1, Math.max(0, p));
        this._progress = p;
        this._drawMask(p);
    }

    _drawMask(p) {
        if (!this.barMask || this.barW === 0) return;

        const FILL_H = this.barH * 0.5; // keep in sync with FILL_H_FRACTION above
        const w = this.barW * p;
        const r = FILL_H / 2;
        const x = -this.barW / 2;
        const y = -FILL_H / 2;

        this.barMask.clear();
        if (w < 1) return;

        if (p >= 1) {
            // Full: both caps rounded
            this.barMask
                .roundRect(x, y, w, FILL_H, r)
                .fill({ color: 0xffffff });
        } else {
            // Partial: left cap rounded, right edge square
            this.barMask
                .roundRect(x, y, w + r, FILL_H, r)
                .fill({ color: 0xffffff });
            this.barMask
                .rect(x + r, y, w - r, FILL_H)
                .fill({ color: 0xffffff });
        }
    }
}