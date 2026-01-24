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