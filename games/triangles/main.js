
const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 360;
const COLORS = [
  "Aqua",
  "Aquamarine",
  "Black",
  "Blue",
  "Blue Violet",
  "Brown",
  "Burly Wood",
  "Cadet Blue",
  "Chartreuse",
  "Chocolate",
  "Coral",
  "Cornflower Blue",
  "Crimson",
  "Dark Blue",
  "Dark Cyan",
  "Dark Goldenrod",
  "Dark Gray",
  "Dark Green",
  "Dark Khaki",
  "Dark Magenta",
  "Dark Olive Green",
  "Dark Orange",
  "Dark Orchid",
  "Dark Red",
  "Dark Salmon",
  "Dark Sea Green",
  "Dark Slate Blue",
  "Dark Slate Gray",
  "Dark Turquoise",
  "Dark Violet",
  "Deep Pink",
  "Deep Sky Blue",
  "Dim Gray",
  "Dodger Blue",
  "Firebrick",
  "Forest Green",
  "Fuchsia",
  "Gold",
  "Goldenrod",
  "Gray",
  "Green",
  "Green Yellow",
  "Hot Pink",
  "Indian Red",
  "Indigo",
  "Lawn Green",
  "Light Coral",
  "Light Green",
  "Light Pink",
  "Light Salmon",
  "Light Sea Green",
  "Light Sky Blue",
  "Light Slate Gray",
  "Light Steel Blue",
  "Lime",
  "Lime Green",
  "Maroon",
  "Medium Aquamarine",
  "Medium Blue",
  "Medium Orchid",
  "Medium Purple",
  "Medium Sea Green",
  "Medium Slate Blue",
  "Medium Spring Green",
  "Medium Turquoise",
  "Medium Violet Red",
  "Midnight Blue",
  "Navy",
  "Olive",
  "Olive Drab",
  "Orange",
  "Orange Red",
  "Orchid",
  "Pale Green",
  "Pale Turquoise",
  "Pale Violet Red",
  "Peru",
  "Pink",
  "Plum",
  "Purple",
  "Rebecca Purple",
  "Red",
  "Rosy Brown",
  "Royal Blue",
  "Saddle Brown",
  "Salmon",
  "Sandy Brown",
  "Sea Green",
  "Sienna",
  "Sky Blue",
  "Slate Blue",
  "Slate Gray",
  "Spring Green",
  "Steel Blue",
  "Tan",
  "Teal",
  "Thistle",
  "Tomato",
  "Turquoise",
  "Violet",
  "Wheat",
  "Yellow",
  "Yellow Green"
];

const random = (min, max) => Math.random() * (max - min) + min;

const dieSounds = [];
for (let die = 1; die <= 3; die++) {
  dieSounds.push(new Howl({
    src: [`sounds/die${die}.wav`],
    preload: true
  }));
}

const hitSounds = [];
for (let hit = 1; hit <= 6; hit++) {
  hitSounds.push(new Howl({
    src: [`sounds/hit${hit}.wav`],
    preload: true
  }));
}

const engine = Matter.Engine.create();
engine.positionIterations = 15;
engine.velocityIterations = 10;
const world = engine.world;

const canvas = document.getElementById("canvas");
const render = Matter.Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent"
  }
});

let targetCameraX = 0;
let targetCameraY = 0;
let cameraX = 0;
let cameraY = 0;
let focusedTriangle;

function resize() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  let viewWidth = VIEW_WIDTH;
  let viewHeight = VIEW_HEIGHT;

  const widthRatio = windowWidth / VIEW_WIDTH;
  const heightRatio = windowHeight / VIEW_HEIGHT;
  if (heightRatio > widthRatio) {
    viewWidth = VIEW_WIDTH;
    viewHeight = windowHeight / widthRatio;
  } else {
    viewWidth = windowWidth / heightRatio;
    viewHeight = VIEW_HEIGHT;
  }

  render.options.width = windowWidth;
  render.options.height = windowHeight;
  render.canvas.width = windowWidth;
  render.canvas.height = windowHeight;

  if (focusedTriangle) {
    cameraX += (focusedTriangle.position.x - cameraX) / 20;
    cameraY += (focusedTriangle.position.y - cameraY) / 20;
  } else {
    cameraX += (targetCameraX - cameraX) / 40;
    cameraY += (targetCameraY - cameraY) / 80;
  }

  Matter.Render.lookAt(render, {
    min: {x: viewWidth / -2 + cameraX, y: viewHeight / -2 + cameraY},
    max: {x: viewWidth / 2 + cameraX, y: viewHeight / 2 + cameraY}
  });
}

const platform = Matter.Bodies.rectangle(0, 50, 350, 5, {
  isStatic: true,
  friction: 0,
  restitution: 0,
  render: {fillStyle: "black"}
});

const triangleCards = document.getElementById("triangles");
const triangles = [];
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
    friction: 0,
    frictionAir: 0,
    restitution: 0.7,
    inertia: Infinity,
    render: {fillStyle: color}
  });

  triangle.alive = true;
  triangle.name = name;
  triangle.target = {x: 0, y: 0};

  Matter.Body.rotate(triangle, Math.PI / 2);
  triangles.push(triangle);

  const cardWrapper = document.createElement("div");
  cardWrapper.className = "card-wrapper";
  const card = document.createElement("div");
  card.className = "triangle-card";

  card.innerHTML = `
    <span class="card-icon" style="color: ${color}">▲&nbsp;</span>
    <span class="card-text">${name}</span>
  `;

  cardWrapper.appendChild(card);
  triangleCards.appendChild(cardWrapper);
  triangle.card = cardWrapper;

  triangle.card.addEventListener("mouseover", () => {
    focusedTriangle = triangle;
  });

  triangle.card.addEventListener("mouseout", () => {
    focusedTriangle = null;
  })
}

Matter.Composite.add(world, [platform, ...triangles]);

Matter.Events.on(engine, "afterUpdate", () => {
  for (const triangle of triangles) {
    const {x, y} = triangle.position;
    if (!triangle.alive) continue;

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
        (x > -100 && x < 100))
      Matter.Body.setVelocity(triangle, {
        x: triangle.velocity.x,
        y: random(5, 10)
      });

    if (y > 210) {
      triangle.card.classList.add("dead");
      triangle.card.addEventListener("transitionend", () => {
        triangle.card.remove();
      }, {once: true});

      Matter.Composite.remove(world, triangle);
      triangle.alive = false;
      if (focusedTriangle === triangle)
        focusedTriangle = null;

      dieSounds[Math.floor(Math.random() * dieSounds.length)].play();
    }
  }

  const alive = triangles.filter(triangle => triangle.alive);
  const xSum = alive.reduce((acc, cur) => {return acc + cur.position.x}, 0);
  const ySum = alive.reduce((acc, cur) => {return acc + cur.position.y}, 0);
  targetCameraX = xSum / alive.length;
  targetCameraY = ySum / alive.length;
  resize();
})

const periodicUpdate = function() {
  for (const triangle of triangles) {
    const x = triangle.position.x;

    if (x < -150 || x > 150)
      triangle.target = {x: 0, y: 0};
    else
      triangle.target = {
        x: random(-70, 70),
        y: random(-30, 10)
      };
  }

  setTimeout(periodicUpdate, 500);
}
setTimeout(periodicUpdate, 500);

Matter.Events.on(engine, "collisionStart", (event) => {
  for (const pair of event.pairs) {
    const {bodyA, bodyB} = pair;
    if (!bodyA.name || !bodyB.name) continue;

    const velA = bodyA.velocity;
    const velB = bodyB.velocity;
    const relativeVelocity = Math.hypot(velB.x - velA.x, velB.y - velA.y);

    if (relativeVelocity > 2) {
      const sound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
      const id = sound.play();
      sound.volume(Math.min(relativeVelocity / 30, 1), id);
    }
  }
})

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);
