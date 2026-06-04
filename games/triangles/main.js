const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 360;
const PLATFORM_LENGTH = 350;
const MIN_LENGTH = 150;

const COLORS = [
  "Aqua", "Aquamarine", "Blue", "Blue Violet", "Brown", "Cadet Blue", "Chartreuse",
  "Chocolate", "Coral", "Cornflower Blue", "Crimson", "Dark Cyan", "Dark Goldenrod",
  "Dark Green", "Dark Khaki", "Dark Magenta", "Dark Orange", "Dark Orchid", "Dark Red",
  "Dark Salmon", "Dark Sea Green", "Dark Slate Blue", "Dark Turquoise", "Dark Violet",
  "Deep Pink", "Deep Sky Blue", "Dodger Blue", "Firebrick", "Forest Green", "Fuchsia",
  "Gold", "Goldenrod", "Green", "Green Yellow", "Hot Pink", "Indian Red", "Indigo",
  "Lawn Green", "Light Coral", "Light Green", "Light Pink", "Light Salmon",
  "Light Sea Green", "Light Sky Blue", "Light Steel Blue", "Lime", "Lime Green",
  "Medium Aquamarine", "Medium Blue", "Medium Orchid", "Medium Purple",
  "Medium Sea Green", "Medium Slate Blue", "Medium Spring Green", "Medium Turquoise",
  "Medium Violet Red", "Navy", "Olive", "Olive Drab", "Orange", "Orange Red", "Orchid",
  "Pale Green", "Pale Turquoise", "Pale Violet Red", "Peru", "Pink", "Plum", "Purple",
  "Rebecca Purple", "Red", "Rosy Brown", "Royal Blue", "Saddle Brown", "Salmon",
  "Sandy Brown", "Sea Green", "Sienna", "Sky Blue", "Slate Blue", "Spring Green",
  "Steel Blue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat",
  "Yellow", "Yellow Green"
];

const random = (min, max) => Math.random() * (max - min) + min;

// ── Physics slider state ──
let currentRestitution = 0.7;
let currentFriction = 0.0;
let currentInertia = Infinity;

// ── Shrink state ──
// shrinkSpeed is computed from shrinkTimeSecs so the platform goes from
// PLATFORM_LENGTH → MIN_LENGTH in exactly shrinkTimeSecs seconds.
let shrinkTimeSecs = 30;
let shrinkSpeed = computeShrinkSpeed(shrinkTimeSecs);

function computeShrinkSpeed(secs) {
  // We want: PLATFORM_LENGTH * (1 - speed)^(secs*60) ≈ MIN_LENGTH
  // Solving: speed ≈ 1 - (MIN_LENGTH/PLATFORM_LENGTH)^(1/(secs*60))
  return 1 - Math.pow(MIN_LENGTH / PLATFORM_LENGTH, 1 / (secs * 60));
}

function resetPlatform() {
  // Scale back up to original length
  const currentWidth = platform.bounds.max.x - platform.bounds.min.x;
  if (currentWidth > 0)
    Matter.Body.scale(platform, PLATFORM_LENGTH / currentWidth, 1);
}

// ── Sounds ──
const dieSounds = [];
for (let i = 1; i <= 3; i++)
  dieSounds.push(new Howl({ src: [`sounds/die${i}.wav`], preload: true }));

const hitSounds = [];
for (let i = 1; i <= 6; i++)
  hitSounds.push(new Howl({ src: [`sounds/hit${i}.wav`], preload: true }));

// ── Engine ──
const engine = Matter.Engine.create();
engine.positionIterations = 15;
engine.velocityIterations = 10;
const world = engine.world;

const canvas = document.getElementById("canvas");
const render = Matter.Render.create({
  canvas, engine,
  options: {
    width: window.innerWidth, height: window.innerHeight,
    wireframes: false, background: "transparent"
  }
});

let targetCameraX = 0, targetCameraY = 0;
let cameraX = 0, cameraY = 0;
let focusedTriangle;

function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  let vw = VIEW_WIDTH, vh = VIEW_HEIGHT;
  const wr = ww / VIEW_WIDTH, hr = wh / VIEW_HEIGHT;
  if (hr > wr) { vw = VIEW_WIDTH; vh = wh / wr; }
  else { vw = ww / hr; vh = VIEW_HEIGHT; }

  render.options.width = ww; render.options.height = wh;
  render.canvas.width = ww; render.canvas.height = wh;

  if (focusedTriangle) {
    cameraX += (focusedTriangle.position.x - cameraX) / 20;
    cameraY += (focusedTriangle.position.y - cameraY) / 20;
  } else {
    cameraX += (targetCameraX - cameraX) / 40;
    cameraY += (targetCameraY - cameraY) / 80;
  }
  Matter.Render.lookAt(render, {
    min: { x: vw / -2 + cameraX, y: vh / -2 + cameraY },
    max: { x: vw / 2 + cameraX, y: vh / 2 + cameraY }
  });
}

// ── Platform ──
const platform = Matter.Bodies.rectangle(0, 50, PLATFORM_LENGTH, 5, {
  isStatic: true, friction: 0, restitution: 0,
  render: { fillStyle: "#333" }
});

// ── Triangles ──
const triangleCards = document.getElementById("triangles");
const triangles = [];

function spawnTriangles() {
  // Clear existing cards
  triangleCards.innerHTML = "";
  triangles.length = 0;

  const chosenColors = [];
  for (let i = 0; i < 10; i++) {
    const radius = random(15, 30);
    const x = random(-100, 100);
    const y = random(-50, 10);

    let name, color;
    do {
      name = COLORS[Math.floor(Math.random() * COLORS.length)];
      color = name.replaceAll(" ", "").toLowerCase();
    } while (!color || chosenColors.includes(color));
    chosenColors.push(color);

    const triangle = Matter.Bodies.polygon(x, y, 3, radius, {
      friction: currentFriction,
      frictionAir: 0,
      restitution: currentRestitution,
      inertia: currentInertia,
      render: { fillStyle: color }
    });

    triangle.alive = true;
    triangle.name = name;
    triangle.target = { x: 0, y: 0 };
    Matter.Body.rotate(triangle, Math.PI / 2);
    triangles.push(triangle);

    const cardWrapper = document.createElement("div");
    cardWrapper.className = "card-wrapper";
    const card = document.createElement("div");
    card.className = "triangle-card";
    card.innerHTML = `
      <span class="card-icon" style="color:${color}">▲&nbsp;</span>
      <span class="card-text">${name}</span>
    `;
    cardWrapper.appendChild(card);
    triangleCards.appendChild(cardWrapper);
    triangle.card = cardWrapper;

    cardWrapper.addEventListener("mouseover", () => { focusedTriangle = triangle; });
    cardWrapper.addEventListener("mouseout", () => { focusedTriangle = null; });
  }

  Matter.Composite.add(world, triangles);
}

Matter.Composite.add(world, [platform]);
spawnTriangles();

// ── New Game button ──
document.getElementById("newgame-btn").addEventListener("click", () => {
  // Remove old triangles from world
  for (const t of triangles) Matter.Composite.remove(world, t);
  resetPlatform();
  spawnTriangles();
});

// ── Fullscreen button ──
const fsBtn = document.getElementById("fullscreen-btn");
fsBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fsBtn.textContent = "✕";
  } else {
    document.exitFullscreen();
    fsBtn.textContent = "⛶";
  }
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) fsBtn.textContent = "⛶";
});

// ── Slider helper ──
function makeSlider(sliderId, labelId, format, onChange) {
  const slider = document.getElementById(sliderId);
  const label = document.getElementById(labelId);
  slider.addEventListener("input", () => {
    label.textContent = format(parseFloat(slider.value));
    onChange(parseFloat(slider.value));
  });
}

makeSlider("bouncyslider", "bouncylabel", v => v.toFixed(2), v => {
  currentRestitution = v;
  for (const t of triangles) if (t.alive) t.restitution = v;
});

makeSlider("frictionslider", "frictionlabel", v => v.toFixed(2), v => {
  currentFriction = v;
  for (const t of triangles) if (t.alive) t.friction = v;
});

makeSlider("inertiaslider", "inertialabel", v => v.toFixed(2), v => {
  const inertia = v === 0 ? Infinity : (1 - v) * 5000 + 50;
  currentInertia = inertia;
  for (const t of triangles) if (t.alive) Matter.Body.setInertia(t, inertia);
});

makeSlider("timeslider", "timelabel", v => `${v}s`, v => {
  shrinkTimeSecs = v;
  shrinkSpeed = computeShrinkSpeed(v);
  resetPlatform();
});

// ── Right-click: spawn triangle at cursor ──
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  // Convert screen coords → world coords
  const ww = window.innerWidth, wh = window.innerHeight;
  let vw = VIEW_WIDTH, vh = VIEW_HEIGHT;
  const wr = ww / VIEW_WIDTH, hr = wh / VIEW_HEIGHT;
  if (hr > wr) { vw = VIEW_WIDTH; vh = wh / wr; }
  else { vw = ww / hr; vh = VIEW_HEIGHT; }

  const worldX = (e.clientX / ww) * vw + (cameraX - vw / 2);
  const worldY = (e.clientY / wh) * vh + (cameraY - vh / 2);

  let name, color;
  const usedColors = triangles.map(t => t.render.fillStyle);
  let attempts = 0;
  do {
    name = COLORS[Math.floor(Math.random() * COLORS.length)];
    color = name.replaceAll(" ", "").toLowerCase();
    attempts++;
  } while (usedColors.includes(color) && attempts < 20);

  const radius = random(15, 30);
  const triangle = Matter.Bodies.polygon(worldX, worldY, 3, radius, {
    friction: currentFriction,
    frictionAir: 0,
    restitution: currentRestitution,
    inertia: currentInertia,
    render: { fillStyle: color }
  });

  triangle.alive = true;
  triangle.name = name;
  triangle.target = { x: worldX, y: worldY };
  Matter.Body.rotate(triangle, Math.PI / 2);
  triangles.push(triangle);
  Matter.Composite.add(world, triangle);

  const cardWrapper = document.createElement("div");
  cardWrapper.className = "card-wrapper";
  const card = document.createElement("div");
  card.className = "triangle-card";
  card.innerHTML = `
    <span class="card-icon" style="color:${color}">▲&nbsp;</span>
    <span class="card-text">${name}</span>
  `;
  cardWrapper.appendChild(card);
  triangleCards.appendChild(cardWrapper);
  triangle.card = cardWrapper;

  cardWrapper.addEventListener("mouseover", () => { focusedTriangle = triangle; });
  cardWrapper.addEventListener("mouseout", () => { focusedTriangle = null; });
});
Matter.Events.on(engine, "afterUpdate", (event) => {
  const currentWidth = platform.bounds.max.x - platform.bounds.min.x;
  if (currentWidth > MIN_LENGTH)
    Matter.Body.scale(platform, 1 - shrinkSpeed, 1);

  for (const triangle of triangles) {
    if (!triangle.alive) continue;
    const { x, y } = triangle.position;

    triangle.restitution = currentRestitution;
    triangle.friction = currentFriction;

    const dx = triangle.target.x - x;
    const dy = triangle.target.y - y;
    const dist = Math.hypot(dx, dy);

    if (y < platform.position.y)
      Matter.Body.applyForce(triangle, triangle.position, {
        x: (dx / dist) / 4000,
        y: (dy / dist) / 4000
      });

    if (Math.random() < 0.01 &&
      Matter.Collision.collides(triangle, platform) &&
      x > -100 && x < 100)
      Matter.Body.setVelocity(triangle, {
        x: triangle.velocity.x,
        y: random(5, 10)
      });

    if (y > 210) {
      triangle.card.classList.add("dead");
      triangle.card.addEventListener("transitionend", () => triangle.card.remove(), { once: true });
      Matter.Composite.remove(world, triangle);
      triangle.alive = false;
      if (focusedTriangle === triangle) focusedTriangle = null;
      dieSounds[Math.floor(Math.random() * dieSounds.length)].play();
    }
  }

  const alive = triangles.filter(t => t.alive);
  if (alive.length > 0) {
    targetCameraX = alive.reduce((a, t) => a + t.position.x, 0) / alive.length;
    targetCameraY = alive.reduce((a, t) => a + t.position.y, 0) / alive.length;
  }
  resize();
});

// ── Periodic target update ──
(function periodicUpdate() {
  for (const t of triangles) {
    if (!t.alive) continue;
    t.target = (t.position.x < -150 || t.position.x > 150)
      ? { x: 0, y: 0 }
      : { x: random(-70, 70), y: random(-30, 10) };
  }
  setTimeout(periodicUpdate, 500);
})();

// ── Collision sounds ──
Matter.Events.on(engine, "collisionStart", (event) => {
  for (const { bodyA, bodyB } of event.pairs) {
    if (!bodyA.name || !bodyB.name) continue;
    const rel = Math.hypot(bodyB.velocity.x - bodyA.velocity.x, bodyB.velocity.y - bodyA.velocity.y);
    if (rel > 2) {
      const sound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
      sound.volume(Math.min(rel / 30, 1), sound.play());
    }
  }
});

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);