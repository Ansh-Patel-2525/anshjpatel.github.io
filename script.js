/* Tic Tac Toe */
const board = document.getElementById("ticTacToe");
let currentPlayer = "X";

function createBoard() {
  board.innerHTML = "";
  currentPlayer = "X";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.onclick = () => {
      if (cell.textContent === "") {
        cell.textContent = currentPlayer;
        currentPlayer = currentPlayer === "X" ? "O" : "X";
      }
    };
    board.appendChild(cell);
  }
}

function resetTicTacToe() {
  createBoard();
}

createBoard();

/* Calculator */
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

/* Guessing Game */
const secretNumber = Math.floor(Math.random() * 10) + 1;

function checkGuess() {
  const guess = Number(document.getElementById("guessInput").value);
  const result = document.getElementById("guessResult");

  if (guess === secretNumber) {
    result.textContent = "Correct! 🎉";
  } else {
    result.textContent = "Wrong guess. Try again.";
  }
}
