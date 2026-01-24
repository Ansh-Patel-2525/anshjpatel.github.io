/* =======================
   SMOOTH SCROLLING
======================= */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

/* =======================
   SCROLL ANIMATIONS
======================= */

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.section-card').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(30px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});

/* =======================
   TIC TAC TOE
======================= */

const board = document.getElementById("ticTacToe");
let currentPlayer = "X";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function createBoard() {
  if (!board) return;
  
  board.innerHTML = "";
  currentPlayer = "X";
  gameActive = true;
  gameState = ["", "", "", "", "", "", "", "", ""];

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.dataset.index = i;

    cell.onclick = () => {
      if (!gameActive || gameState[i] !== "") return;

      gameState[i] = currentPlayer;
      cell.textContent = currentPlayer;
      cell.style.animation = 'fadeInScale 0.3s ease';

      if (checkWinner()) {
        setTimeout(() => {
          updateStatus(`🎉 Player ${currentPlayer} wins!`);
          gameActive = false;
        }, 300);
        return;
      }

      if (!gameState.includes("")) {
        setTimeout(() => {
          updateStatus("🤝 It's a draw!");
          gameActive = false;
        }, 300);
        return;
      }

      currentPlayer = currentPlayer === "X" ? "O" : "X";
      updateStatus(`Player ${currentPlayer}'s turn`);
    };

    board.appendChild(cell);
  }
  
  updateStatus("Player X's turn");
}

function checkWinner() {
  return winningCombos.some(combo => {
    return combo.every(index => {
      return gameState[index] === currentPlayer;
    });
  });
}

function updateStatus(message) {
  const status = document.getElementById("tttStatus");
  if (status) {
    status.textContent = message;
    status.style.animation = 'fadeIn 0.3s ease';
  }
}

function resetTicTacToe() {
  createBoard();
}

// Initialize on page load
if (board) {
  createBoard();
}

/* =======================
   CALCULATOR
======================= */

let expression = "";
const display = document.getElementById("calcDisplay");

function press(value) {
  if (!display) return;
  expression += value;
  display.value = expression;
  display.style.animation = 'pulse 0.2s ease';
}

function calculate() {
  if (!display) return;
  try {
    expression = eval(expression).toString();
    display.value = expression;
    display.style.animation = 'successFlash 0.4s ease';
  } catch {
    expression = "";
    display.value = "Error";
    display.style.animation = 'shake 0.4s ease';
    setTimeout(() => {
      if (display) display.value = "";
    }, 1500);
  }
}

function clearCalc() {
  if (!display) return;
  expression = "";
  display.value = "";
  display.style.animation = 'fadeOut 0.2s ease';
  setTimeout(() => {
    if (display) display.style.animation = '';
  }, 200);
}

/* =======================
   NUMBER GUESSING GAME
======================= */

let secretNumber = Math.floor(Math.random() * 10) + 1;
let guessCount = 0;

function checkGuess() {
  const guessInput = document.getElementById("guessInput");
  const result = document.getElementById("guessResult");
  
  if (!guessInput || !result) return;

  const guess = Number(guessInput.value);
  
  if (guess < 1 || guess > 10 || isNaN(guess)) {
    result.textContent = "⚠️ Please enter a number between 1 and 10";
    result.style.color = "var(--error)";
    result.style.animation = 'shake 0.4s ease';
    return;
  }

  guessCount++;

  if (guess === secretNumber) {
    result.textContent = `🎉 Correct! You got it in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}!`;
    result.style.color = "var(--success)";
    result.style.animation = 'successBounce 0.6s ease';
    guessInput.disabled = true;
  } else if (guess < secretNumber) {
    result.textContent = "📈 Too low! Try a higher number";
    result.style.color = "var(--primary)";
    result.style.animation = 'shake 0.4s ease';
  } else {
    result.textContent = "📉 Too high! Try a lower number";
    result.style.color = "var(--primary)";
    result.style.animation = 'shake 0.4s ease';
  }

  guessInput.value = "";
  guessInput.focus();
}

function resetGuess() {
  const guessInput = document.getElementById("guessInput");
  const result = document.getElementById("guessResult");
  
  if (!guessInput || !result) return;

  secretNumber = Math.floor(Math.random() * 10) + 1;
  guessCount = 0;
  guessInput.value = "";
  guessInput.disabled = false;
  result.textContent = "";
  guessInput.focus();
}

// Allow Enter key for guessing
const guessInput = document.getElementById("guessInput");
if (guessInput) {
  guessInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkGuess();
    }
  });
}

/* =======================
   ANIMATIONS (CSS)
======================= */

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0.5; }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  @keyframes successFlash {
    0%, 100% { background: var(--bg-light); }
    50% { background: #d1fae5; }
  }

  @keyframes successBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;
document.head.appendChild(style);

/* =======================
   NAV SCROLL EFFECT
======================= */

let lastScroll = 0;
const nav = document.querySelector('nav');

if (nav) {
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
      nav.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
  });
}

/* Add these functions to your existing script.js file */

/* =======================
   SNAKE GAME
======================= */

let snakeGame = {
  canvas: null,
  ctx: null,
  snake: [{x: 150, y: 150}],
  direction: {x: 0, y: 0},
  food: {x: 0, y: 0},
  score: 0,
  highScore: 0,
  gameLoop: null,
  gridSize: 15,
  running: false
};

function initSnake() {
  snakeGame.canvas = document.getElementById('snakeCanvas');
  if (!snakeGame.canvas) return;
  
  snakeGame.ctx = snakeGame.canvas.getContext('2d');
  snakeGame.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
  document.getElementById('snakeHighScore').textContent = snakeGame.highScore;
  
  document.addEventListener('keydown', (e) => {
    if (!snakeGame.running) return;
    
    if (e.key === 'ArrowUp' && snakeGame.direction.y === 0) {
      snakeGame.direction = {x: 0, y: -snakeGame.gridSize};
    } else if (e.key === 'ArrowDown' && snakeGame.direction.y === 0) {
      snakeGame.direction = {x: 0, y: snakeGame.gridSize};
    } else if (e.key === 'ArrowLeft' && snakeGame.direction.x === 0) {
      snakeGame.direction = {x: -snakeGame.gridSize, y: 0};
    } else if (e.key === 'ArrowRight' && snakeGame.direction.x === 0) {
      snakeGame.direction = {x: snakeGame.gridSize, y: 0};
    }
  });
}

function startSnake() {
  if (snakeGame.running) return;
  
  snakeGame.snake = [{x: 150, y: 150}];
  snakeGame.direction = {x: snakeGame.gridSize, y: 0};
  snakeGame.score = 0;
  snakeGame.running = true;
  
  document.getElementById('snakeScore').textContent = '0';
  document.getElementById('snakeStatus').textContent = 'Playing...';
  
  placeFood();
  
  snakeGame.gameLoop = setInterval(() => {
    updateSnake();
    drawSnake();
  }, 100);
}

function updateSnake() {
  const head = {
    x: snakeGame.snake[0].x + snakeGame.direction.x,
    y: snakeGame.snake[0].y + snakeGame.direction.y
  };
  
  // Check wall collision
  if (head.x < 0 || head.x >= 300 || head.y < 0 || head.y >= 300) {
    gameOverSnake();
    return;
  }
  
  // Check self collision
  if (snakeGame.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOverSnake();
    return;
  }
  
  snakeGame.snake.unshift(head);
  
  // Check food collision
  if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
    snakeGame.score += 10;
    document.getElementById('snakeScore').textContent = snakeGame.score;
    placeFood();
  } else {
    snakeGame.snake.pop();
  }
}

function drawSnake() {
  if (!snakeGame.ctx) return;
  
  snakeGame.ctx.fillStyle = '#000';
  snakeGame.ctx.fillRect(0, 0, 300, 300);
  
  // Draw snake
  snakeGame.ctx.fillStyle = '#10b981';
  snakeGame.snake.forEach((segment, index) => {
    if (index === 0) {
      snakeGame.ctx.fillStyle = '#059669';
    } else {
      snakeGame.ctx.fillStyle = '#10b981';
    }
    snakeGame.ctx.fillRect(segment.x, segment.y, snakeGame.gridSize - 2, snakeGame.gridSize - 2);
  });
  
  // Draw food
  snakeGame.ctx.fillStyle = '#ef4444';
  snakeGame.ctx.fillRect(snakeGame.food.x, snakeGame.food.y, snakeGame.gridSize - 2, snakeGame.gridSize - 2);
}

function placeFood() {
  snakeGame.food = {
    x: Math.floor(Math.random() * 20) * snakeGame.gridSize,
    y: Math.floor(Math.random() * 20) * snakeGame.gridSize
  };
  
  // Make sure food doesn't spawn on snake
  if (snakeGame.snake.some(segment => segment.x === snakeGame.food.x && segment.y === snakeGame.food.y)) {
    placeFood();
  }
}

function gameOverSnake() {
  clearInterval(snakeGame.gameLoop);
  snakeGame.running = false;
  
  if (snakeGame.score > snakeGame.highScore) {
    snakeGame.highScore = snakeGame.score;
    localStorage.setItem('snakeHighScore', snakeGame.highScore);
    document.getElementById('snakeHighScore').textContent = snakeGame.highScore;
  }
  
  document.getElementById('snakeStatus').textContent = `Game Over! Final Score: ${snakeGame.score}`;
}

// Initialize snake on load
if (document.getElementById('snakeCanvas')) {
  initSnake();
}

/* =======================
   TETRIS GAME
======================= */

let tetrisGame = {
  canvas: null,
  ctx: null,
  board: [],
  currentPiece: null,
  score: 0,
  level: 1,
  gameLoop: null,
  running: false,
  blockSize: 20,
  cols: 12,
  rows: 20
};

const tetrisPieces = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[1,0,0],[1,1,1]], // L
  [[0,0,1],[1,1,1]], // J
  [[0,1,1],[1,1,0]], // S
  [[1,1,0],[0,1,1]]  // Z
];

const tetrisColors = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

function initTetris() {
  tetrisGame.canvas = document.getElementById('tetrisCanvas');
  if (!tetrisGame.canvas) return;
  
  tetrisGame.ctx = tetrisGame.canvas.getContext('2d');
  
  document.addEventListener('keydown', (e) => {
    if (!tetrisGame.running) return;
    
    if (e.key === 'ArrowLeft') {
      moveTetrisPiece(-1, 0);
    } else if (e.key === 'ArrowRight') {
      moveTetrisPiece(1, 0);
    } else if (e.key === 'ArrowDown') {
      moveTetrisPiece(0, 1);
    } else if (e.key === 'ArrowUp') {
      rotateTetrisPiece();
    } else if (e.key === ' ') {
      dropTetrisPiece();
      e.preventDefault();
    }
  });
}

function startTetris() {
  if (tetrisGame.running) return;
  
  tetrisGame.board = Array(tetrisGame.rows).fill().map(() => Array(tetrisGame.cols).fill(0));
  tetrisGame.score = 0;
  tetrisGame.level = 1;
  tetrisGame.running = true;
  
  document.getElementById('tetrisScore').textContent = '0';
  document.getElementById('tetrisLevel').textContent = '1';
  document.getElementById('tetrisStatus').textContent = 'Playing...';
  
  spawnTetrisPiece();
  
  tetrisGame.gameLoop = setInterval(() => {
    moveTetrisPiece(0, 1);
    drawTetris();
  }, 500);
}

function spawnTetrisPiece() {
  const index = Math.floor(Math.random() * tetrisPieces.length);
  tetrisGame.currentPiece = {
    shape: tetrisPieces[index],
    color: tetrisColors[index],
    x: Math.floor(tetrisGame.cols / 2) - 1,
    y: 0
  };
  
  if (checkTetrisCollision(0, 0)) {
    gameOverTetris();
  }
}

function moveTetrisPiece(dx, dy) {
  if (!tetrisGame.currentPiece) return;
  
  if (!checkTetrisCollision(dx, dy)) {
    tetrisGame.currentPiece.x += dx;
    tetrisGame.currentPiece.y += dy;
  } else if (dy > 0) {
    mergeTetrisPiece();
    clearTetrisLines();
    spawnTetrisPiece();
  }
}

function rotateTetrisPiece() {
  if (!tetrisGame.currentPiece) return;
  
  const rotated = tetrisGame.currentPiece.shape[0].map((_, i) =>
    tetrisGame.currentPiece.shape.map(row => row[i]).reverse()
  );
  
  const oldShape = tetrisGame.currentPiece.shape;
  tetrisGame.currentPiece.shape = rotated;
  
  if (checkTetrisCollision(0, 0)) {
    tetrisGame.currentPiece.shape = oldShape;
  }
}

function dropTetrisPiece() {
  while (!checkTetrisCollision(0, 1)) {
    tetrisGame.currentPiece.y++;
  }
  mergeTetrisPiece();
  clearTetrisLines();
  spawnTetrisPiece();
}

function checkTetrisCollision(dx, dy) {
  if (!tetrisGame.currentPiece) return false;
  
  for (let y = 0; y < tetrisGame.currentPiece.shape.length; y++) {
    for (let x = 0; x < tetrisGame.currentPiece.shape[y].length; x++) {
      if (tetrisGame.currentPiece.shape[y][x]) {
        const newX = tetrisGame.currentPiece.x + x + dx;
        const newY = tetrisGame.currentPiece.y + y + dy;
        
        if (newX < 0 || newX >= tetrisGame.cols || newY >= tetrisGame.rows) {
          return true;
        }
        
        if (newY >= 0 && tetrisGame.board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function mergeTetrisPiece() {
  tetrisGame.currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const boardY = tetrisGame.currentPiece.y + y;
        const boardX = tetrisGame.currentPiece.x + x;
        if (boardY >= 0) {
          tetrisGame.board[boardY][boardX] = tetrisGame.currentPiece.color;
        }
      }
    });
  });
}

function clearTetrisLines() {
  let linesCleared = 0;
  
  for (let y = tetrisGame.rows - 1; y >= 0; y--) {
    if (tetrisGame.board[y].every(cell => cell !== 0)) {
      tetrisGame.board.splice(y, 1);
      tetrisGame.board.unshift(Array(tetrisGame.cols).fill(0));
      linesCleared++;
      y++;
    }
  }
  
  if (linesCleared > 0) {
    tetrisGame.score += linesCleared * 100 * tetrisGame.level;
    document.getElementById('tetrisScore').textContent = tetrisGame.score;
    
    tetrisGame.level = Math.floor(tetrisGame.score / 500) + 1;
    document.getElementById('tetrisLevel').textContent = tetrisGame.level;
  }
}

function drawTetris() {
  if (!tetrisGame.ctx) return;
  
  tetrisGame.ctx.fillStyle = '#000';
  tetrisGame.ctx.fillRect(0, 0, 240, 400);
  
  // Draw board
  tetrisGame.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        tetrisGame.ctx.fillStyle = cell;
        tetrisGame.ctx.fillRect(x * tetrisGame.blockSize, y * tetrisGame.blockSize, 
          tetrisGame.blockSize - 1, tetrisGame.blockSize - 1);
      }
    });
  });
  
  // Draw current piece
  if (tetrisGame.currentPiece) {
    tetrisGame.ctx.fillStyle = tetrisGame.currentPiece.color;
    tetrisGame.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          tetrisGame.ctx.fillRect(
            (tetrisGame.currentPiece.x + x) * tetrisGame.blockSize,
            (tetrisGame.currentPiece.y + y) * tetrisGame.blockSize,
            tetrisGame.blockSize - 1, tetrisGame.blockSize - 1
          );
        }
      });
    });
  }
}

function gameOverTetris() {
  clearInterval(tetrisGame.gameLoop);
  tetrisGame.running = false;
  document.getElementById('tetrisStatus').textContent = `Game Over! Final Score: ${tetrisGame.score}`;
}

if (document.getElementById('tetrisCanvas')) {
  initTetris();
}

/* =======================
   SPACE SHOOTER
======================= */

let shooterGame = {
  canvas: null,
  ctx: null,
  player: {x: 135, y: 350, width: 30, height: 30, speed: 5},
  bullets: [],
  enemies: [],
  score: 0,
  lives: 3,
  gameLoop: null,
  running: false,
  keys: {},
  enemySpawnRate: 100
};

function initShooter() {
  shooterGame.canvas = document.getElementById('shooterCanvas');
  if (!shooterGame.canvas) return;
  
  shooterGame.ctx = shooterGame.canvas.getContext('2d');
  
  document.addEventListener('keydown', (e) => {
    shooterGame.keys[e.key] = true;
    if (e.key === ' ' && shooterGame.running) {
      shootBullet();
      e.preventDefault();
    }
  });
  
  document.addEventListener('keyup', (e) => {
    shooterGame.keys[e.key] = false;
  });
}

function startShooter() {
  if (shooterGame.running) return;
  
  shooterGame.player = {x: 135, y: 350, width: 30, height: 30, speed: 5};
  shooterGame.bullets = [];
  shooterGame.enemies = [];
  shooterGame.score = 0;
  shooterGame.lives = 3;
  shooterGame.running = true;
  
  document.getElementById('shooterScore').textContent = '0';
  document.getElementById('shooterLives').textContent = '3';
  document.getElementById('shooterStatus').textContent = 'Playing...';
  
  let frameCount = 0;
  
  shooterGame.gameLoop = setInterval(() => {
    updateShooter();
    drawShooter();
    
    frameCount++;
    if (frameCount % shooterGame.enemySpawnRate === 0) {
      spawnEnemy();
    }
  }, 1000 / 60);
}

function updateShooter() {
  // Move player
  if (shooterGame.keys['ArrowLeft'] && shooterGame.player.x > 0) {
    shooterGame.player.x -= shooterGame.player.speed;
  }
  if (shooterGame.keys['ArrowRight'] && shooterGame.player.x < 270) {
    shooterGame.player.x += shooterGame.player.speed;
  }
  
  // Move bullets
  shooterGame.bullets = shooterGame.bullets.filter(bullet => {
    bullet.y -= 7;
    return bullet.y > 0;
  });
  
  // Move enemies
  shooterGame.enemies = shooterGame.enemies.filter(enemy => {
    enemy.y += 2;
    
    // Check collision with player
    if (enemy.y > 350 && 
        enemy.x < shooterGame.player.x + 30 &&
        enemy.x + 30 > shooterGame.player.x) {
      shooterGame.lives--;
      document.getElementById('shooterLives').textContent = shooterGame.lives;
      
      if (shooterGame.lives <= 0) {
        gameOverShooter();
      }
      return false;
    }
    
    return enemy.y < 400;
  });
  
  // Check bullet-enemy collisions
  shooterGame.bullets.forEach((bullet, bIndex) => {
    shooterGame.enemies.forEach((enemy, eIndex) => {
      if (bullet.x > enemy.x && bullet.x < enemy.x + 30 &&
          bullet.y > enemy.y && bullet.y < enemy.y + 30) {
        shooterGame.bullets.splice(bIndex, 1);
        shooterGame.enemies.splice(eIndex, 1);
        shooterGame.score += 10;
        document.getElementById('shooterScore').textContent = shooterGame.score;
      }
    });
  });
}

function drawShooter() {
  if (!shooterGame.ctx) return;
  
  // Background
  shooterGame.ctx.fillStyle = '#000';
  shooterGame.ctx.fillRect(0, 0, 300, 400);
  
  // Stars
  shooterGame.ctx.fillStyle = '#fff';
  for (let i = 0; i < 50; i++) {
    const x = (i * 37) % 300;
    const y = (i * 71) % 400;
    shooterGame.ctx.fillRect(x, y, 1, 1);
  }
  
  // Player
  shooterGame.ctx.fillStyle = '#00f0f0';
  shooterGame.ctx.fillRect(shooterGame.player.x, shooterGame.player.y, 30, 30);
  shooterGame.ctx.fillStyle = '#0088ff';
  shooterGame.ctx.beginPath();
  shooterGame.ctx.moveTo(shooterGame.player.x + 15, shooterGame.player.y);
  shooterGame.ctx.lineTo(shooterGame.player.x, shooterGame.player.y + 30);
  shooterGame.ctx.lineTo(shooterGame.player.x + 30, shooterGame.player.y + 30);
  shooterGame.ctx.fill();
  
  // Bullets
  shooterGame.ctx.fillStyle = '#f0f000';
  shooterGame.bullets.forEach(bullet => {
    shooterGame.ctx.fillRect(bullet.x, bullet.y, 3, 10);
  });
  
  // Enemies
  shooterGame.ctx.fillStyle = '#f00000';
  shooterGame.enemies.forEach(enemy => {
    shooterGame.ctx.fillRect(enemy.x, enemy.y, 30, 30);
  });
}

function shootBullet() {
  shooterGame.bullets.push({
    x: shooterGame.player.x + 13,
    y: shooterGame.player.y
  });
}

function spawnEnemy() {
  shooterGame.enemies.push({
    x: Math.random() * 270,
    y: 0
  });
}

function gameOverShooter() {
  clearInterval(shooterGame.gameLoop);
  shooterGame.running = false;
  document.getElementById('shooterStatus').textContent = `Game Over! Final Score: ${shooterGame.score}`;
}

if (document.getElementById('shooterCanvas')) {
  initShooter();
}

/* =======================
   TIMER
======================= */

let timerState = {
  totalSeconds: 0,
  remainingSeconds: 0,
  interval: null,
  running: false
};

function setTimer(hours, minutes, seconds) {
  document.getElementById('timerHours').value = hours;
  document.getElementById('timerMinutes').value = minutes;
  document.getElementById('timerSeconds').value = seconds;
}

function startTimer() {
  if (timerState.running) return;
  
  if (timerState.remainingSeconds === 0) {
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    
    timerState.totalSeconds = hours * 3600 + minutes * 60 + seconds;
    timerState.remainingSeconds = timerState.totalSeconds;
  }
  
  if (timerState.remainingSeconds === 0) return;
  
  timerState.running = true;
  
  timerState.interval = setInterval(() => {
    timerState.remainingSeconds--;
    updateTimerDisplay();
    
    if (timerState.remainingSeconds <= 0) {
      pauseTimer();
      playTimerAlert();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerState.interval);
  timerState.running = false;
}

function resetTimer() {
  pauseTimer();
  timerState.remainingSeconds = 0;
  document.getElementById('timerDisplay').textContent = '00:00:00';
  document.getElementById('timerHours').value = '';
  document.getElementById('timerMinutes').value = '';
  document.getElementById('timerSeconds').value = '';
}

function updateTimerDisplay() {
  const hours = Math.floor(timerState.remainingSeconds / 3600);
  const minutes = Math.floor((timerState.remainingSeconds % 3600) / 60);
  const seconds = timerState.remainingSeconds % 60;
  
  document.getElementById('timerDisplay').textContent = 
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function playTimerAlert() {
  const display = document.getElementById('timerDisplay');
  display.style.animation = 'successBounce 0.6s ease';
  
  // Simple beep using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  setTimeout(() => {
    display.style.animation = '';
  }, 600);
}