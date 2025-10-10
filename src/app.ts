// app.js (simplified)
function game_page(): string {
  // Create the canvas dynamically
  const canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.background = "black";
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";

  // Clear app and append canvas
  const app = document.getElementById("app")!;
  app.innerHTML = ""; // Clear any previous content
  app.appendChild(canvas);

  // Get context
  const ctx = canvas.getContext("2d")!;

  // Game objects
  const paddleWidth = 10, paddleHeight = 100;
  const player = { x: 20, y: canvas.height / 2 - 50, speed: 5 };
  const ai = { x: canvas.width - 30, y: canvas.height / 2 - 50, speed: 5 };
  const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 4, dy: 4 };

  // Keyboard controls
  const keys: { [key: string]: boolean } = {};
  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  // Draw functions
  function drawRect(x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x: number, y: number, r: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawNet() {
    for (let i = 0; i < canvas.height; i += 20) {
      drawRect(canvas.width / 2 - 1, i, 2, 10, "white");
    }
  }

  // Game logic
  function movePaddles() {
    if (keys["w"] && player.y > 0) player.y -= player.speed;
    if (keys["s"] && player.y + paddleHeight < canvas.height) player.y += player.speed;

    // Simple AI (follows the ball)
    if (ball.y < ai.y + paddleHeight / 2) ai.y -= ai.speed;
    if (ball.y > ai.y + paddleHeight / 2) ai.y += ai.speed;
  }

  function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom bounce
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
      ball.dy *= -1;
    }

    // Paddle collisions
    if (ball.x - ball.radius < player.x + paddleWidth &&
        ball.y > player.y && ball.y < player.y + paddleHeight) {
      ball.dx *= -1;
    }

    if (ball.x + ball.radius > ai.x &&
        ball.y > ai.y && ball.y < ai.y + paddleHeight) {
      ball.dx *= -1;
    }

    // Reset if ball goes out
    if (ball.x < 0 || ball.x > canvas.width) {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
      ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
    }
  }

  // 🎮 Main draw
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNet();
    drawRect(player.x, player.y, paddleWidth, paddleHeight, "white");
    drawRect(ai.x, ai.y, paddleWidth, paddleHeight, "white");
    drawCircle(ball.x, ball.y, ball.radius, "white");
  }

  // 🎮 Game loop
  function gameLoop() {
    movePaddles();
    moveBall();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Start the game loop
  gameLoop();

  // Return empty string because canvas is appended dynamically
  return "";
}


const app = document.getElementById("app");

function showPage(page: string) {
  const app = document.getElementById("app"); 
  if (!app) return;

  app.innerHTML = ""; // Clear previous page

  if (page === "home") {
    app.innerHTML = "<h1>Home</h1>";
  } else if (page === "about") {
    app.innerHTML = "<h1>About</h1>";
  } else if (page === "game") {
    game_page(); // Canvas will be appended dynamically
  } else {
    app.innerHTML = "<h1>Page not found</h1>";
  }
}


// Listen for navigation
window.onhashchange = () => showPage(location.hash.slice(1));

// Initial load
showPage(location.hash.slice(1) || "home");
