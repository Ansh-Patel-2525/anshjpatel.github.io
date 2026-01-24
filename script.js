/* =======================
   TIC TAC TOE
======================= */

const board = document.getElementById("ticTacToe");
let currentPlayer = "X";
let gameActive = true;

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
  board.innerHTML = "";
  currentPlayer = "X";
  gameActive = true;

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.dataset.index = i;

    cell.onclick = () => {
      if (!gameActive || cell.textContent !== "") return;

      cell.textContent = currentPlayer;

      if (checkWinner()) {
        alert(`Player ${currentPlayer} wins!`);
        gameActive = false;
        return;
      }

      currentPlayer = currentPlayer === "X" ? "O" : "X";
    };

    board.appendChild(cell);
  }
}

function checkWinner() {
  const cells = document.querySelectorAll(".tic-tac-toe div");

  return winningCombos.some(combo => {
    return combo.every(index => {
      return cells[index].textContent === currentPlayer;
    });
  });
}

function resetTicTacToe() {
  createBoard();
}

createBoard();

/* =======================
   CALCULATOR
======================= */

let expression = "";

function press(value) {
  expression += value;
  document.getElementById("calcDisplay").value = expression;
}

function calculate() {
  try {
    expression = eval(expression).toString();
    document.getElementById("calcDisplay").value = expression;
  } catch {
    expression = "";
    document.getElementById("calcDisplay").value = "Error";
  }
}

function clearCalc() {
  expression = "";
  document.getElementById("calcDisplay").value = "";
}

/* =======================
   NUMBER GUESSING GAME
======================= */

let secretNumber = Math.floor(Math.random() * 10) + 1;

function checkGuess() {
  const guess = Number(document.getElementById("guessInput").value);
  const result = document.getElementById("guessResult");

  if (guess === secretNumber) {
    result.textContent = "Correct! 🎉";
  } else {
    result.textContent = "Wrong guess. Try again.";
  }
}
