
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const cansElement = document.getElementById("cans");
const bestElement = document.getElementById("best");
const overlay = document.getElementById("overlay");

let running = false;
let score = 0;
let cans = 0;
let best = Number(localStorage.getItem("arcadeBest") || 0);
let speed = 5;
let frames = 0;
let objects = [];
let animationId = null;

const lanes = [300, 450, 600];

const player = {
  lane: 1,
  x: lanes[1],
  y: 365,
  jump: 0,
  slide: 0
};

bestElement.textContent = best;

function drawBackground() {
  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#123c72");
  sky.addColorStop(1, "#081629");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Edificios
  ctx.fillStyle = "#0c2545";
  for (let i = 0; i < 12; i++) {
    const x = i * 85;
    const height = 70 + (i % 4) * 25;
    ctx.fillRect(x, 210 - height, 65, height);
  }

  // Carretera
  ctx.fillStyle = "#29394d";
  ctx.beginPath();
  ctx.moveTo(230, 200);
  ctx.lineTo(670, 200);
  ctx.lineTo(850, 480);
  ctx.lineTo(50, 480);
  ctx.closePath();
  ctx.fill();

  // Líneas de carril
  ctx.strokeStyle = "#a5b8c8";
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 25]);

  for (let x of [375, 525]) {
    ctx.beginPath();
    ctx.moveTo(x, 200);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawPlayer() {
  const x = player.x;
  const y = player.y - player.jump;

  ctx.save();

  // Sombra
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(x, 430, 35, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Deslizamiento
  if (player.slide > 0) {
    ctx.fillStyle = "#0879e8";
    ctx.fillRect(x - 34, y - 20, 68, 28);

    ctx.fillStyle = "#f2c6a0";
    ctx.beginPath();
    ctx.arc(x + 30, y - 18, 15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Piernas
    ctx.strokeStyle = "#d8e7f8";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 5);
    ctx.lineTo(x - 15, y + 36);
    ctx.moveTo(x + 10, y + 5);
    ctx.lineTo(x + 16, y + 36);
    ctx.stroke();

    // Cuerpo
    ctx.fillStyle = "#0879e8";
    ctx.beginPath();
    ctx.roundRect(x - 23, y - 43, 46, 55, 12);
    ctx.fill();

    // Pecho blanco
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 9, y - 36, 18, 28);

    // Cabeza
    ctx.fillStyle = "#f2c6a0";
    ctx.beginPath();
    ctx.arc(x, y - 60, 19, 0, Math.PI * 2);
    ctx.fill();

    // Cabello
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(x, y - 70, 17, Math.PI, 0);
    ctx.fill();

    // Brazos
    ctx.strokeStyle = "#0879e8";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 30);
    ctx.lineTo(x - 38, y - 5);
    ctx.moveTo(x + 20, y - 30);
    ctx.lineTo(x + 38, y - 5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawObstacle(obj) {
  if (obj.type === "can") {
    ctx.fillStyle = "#0879e8";
    ctx.beginPath();
    ctx.roundRect(obj.x - 14, obj.y - 22, 28, 44, 7);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillRect(obj.x - 12, obj.y - 5, 24, 11);

    ctx.fillStyle = "#e32636";
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "center";
    ctx.fillText("COLA", obj.x, obj.y + 30);
  } else if (obj.type === "barrier") {
    ctx.fillStyle = "#e32636";
    ctx.fillRect(obj.x - 36, obj.y - 18, 72, 36);

    ctx.fillStyle = "#fff";
    ctx.fillRect(obj.x - 25, obj.y - 14, 12, 28);
    ctx.fillRect(obj.x + 13, obj.y - 14, 12, 28);
  } else if (obj.type === "block") {
    ctx.fillStyle = "#e6a23c";
    ctx.fillRect(obj.x - 30, obj.y - 38, 60, 76);

    ctx.fillStyle = "#6d421d";
    ctx.fillRect(obj.x - 22, obj.y - 30, 44, 60);
  } else if (obj.type === "overhead") {
    ctx.fillStyle = "#d9e3ec";
    ctx.fillRect(obj.x - 42, obj.y - 45, 84, 20);

    ctx.fillStyle = "#e32636";
    ctx.fillRect(obj.x - 42, obj.y - 45, 12, 20);
    ctx.fillRect(obj.x + 30, obj.y - 45, 12, 20);
  }
}

function spawnObject() {
  const lane = Math.floor(Math.random() * 3);
  const random = Math.random();

  let type;

  if (random < 0.48) type = "can";
  else if (random < 0.72) type = "barrier";
  else if (random < 0.91) type = "block";
  else type = "overhead";

  objects.push({
    x: lanes[lane],
    y: 210,
    lane,
    type,
    collected: false
  });
}

function moveLeft() {
  if (running) player.lane = Math.max(0, player.lane - 1);
}

function moveRight() {
  if (running) player.lane = Math.min(2, player.lane + 1);
}

function jump() {
  if (running && player.jump === 0 && player.slide === 0) {
    player.jump = 115;
  }
}

function slide() {
  if (running && player.slide === 0 && player.jump === 0) {
    player.slide = 38;
  }
}

function collision(obj) {
  if (obj.lane !== player.lane) return false;

  const close = Math.abs(obj.y - player.y) < 35;
  if (!close) return false;

  if (obj.type === "can") {
    if (!obj.collected) {
      obj.collected = true;
      cans++;
      score += 50;
      cansElement.textContent = cans;
    }
    return false;
  }

  if (obj.type === "barrier") {
    return player.jump < 35;
  }

  if (obj.type === "block") {
    return true;
  }

  if (obj.type === "overhead") {
    return player.slide === 0;
  }

  return false;
}

function endGame() {
  running = false;

  if (score > best) {
    best = score;
    localStorage.setItem("arcadeBest", best);
    bestElement.textContent = best;
  }

  document.getElementById("overlay-title").textContent = "¡Fin de la carrera!";
  document.getElementById("overlay-text").textContent =
    `Conseguiste ${score} puntos y ${cans} latas. ¡Inténtalo otra vez!`;

  document.getElementById("start-btn").textContent = "VOLVER A JUGAR";
  overlay.classList.remove("hidden");
}

function update() {
  if (!running) return;

  frames++;
  score += 1;
  speed = Math.min(11, 5 + score / 1800);

  scoreElement.textContent = score;

  player.x += (lanes[player.lane] - player.x) * 0.25;

  if (player.jump > 0) player.jump -= 7;
  if (player.jump < 0) player.jump = 0;

  if (player.slide > 0) player.slide--;

  if (frames % Math.max(35, Math.floor(85 - speed * 4)) === 0) {
    spawnObject();
  }

  objects.forEach(obj => {
    obj.y += speed;

    if (collision(obj)) {
      endGame();
    }
  });

  objects = objects.filter(obj => obj.y < 540 && !obj.collected);

  if (!running) return;

  drawBackground();
  objects.forEach(drawObstacle);
  drawPlayer();

  animationId = requestAnimationFrame(update);
}

function startGame() {
  if (animationId) cancelAnimationFrame(animationId);

  score = 0;
  cans = 0;
  speed = 5;
  frames = 0;
  objects = [];

  player.lane = 1;
  player.x = lanes[1];
  player.jump = 0;
  player.slide = 0;

  scoreElement.textContent = 0;
  cansElement.textContent = 0;

  running = true;
  overlay.classList.add("hidden");

  update();
}

document.getElementById("start-btn").addEventListener("click", startGame);

document.getElementById("left-btn").addEventListener("pointerdown", moveLeft);
document.getElementById("right-btn").addEventListener("pointerdown", moveRight);
document.getElementById("jump-btn").addEventListener("pointerdown", jump);

document.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft") moveLeft();
  if (event.key === "ArrowRight") moveRight();
  if (event.key === "ArrowUp" || event.key === " ") jump();
  if (event.key === "ArrowDown") slide();
});

drawBackground();
drawPlayer();
