import test from "node:test";
import assert from "node:assert/strict";
import { createGame, playCard, getPublicState } from "../js/game-engine.js";
import { getValidCards } from "../js/game-rules.js";
import { isTeammateWinning } from "../js/game-ai.js";

test("custom team assignments are retained in public state", () => {
  const teams = { player: "yourTeam", cpu1: "yourTeam", cpu2: "opponentTeam", cpu3: "opponentTeam" };
  const state = createGame({ rng: () => 0.42, startingPlayer: "player", teams });
  assert.deepEqual(getPublicState(state).teams, teams);
});

test("a completed trick remains visible until the next card is played", () => {
  let state = createGame({ rng: () => 0.37, startingPlayer: "player" });
  for (const seat of ["player", "cpu1", "cpu2", "cpu3"]) {
    const legal = getValidCards(state.hands[seat], state.leadSuit);
    state = playCard(state, seat, legal[0]);
  }
  const publicState = getPublicState(state);
  assert.equal(publicState.lastCompletedTrick.cards.length, 4);
  assert.equal(publicState.lastCompletedTrick.trickNumber, 1);
  assert.equal(Object.values(publicState.currentTrick).filter(Boolean).length, 0);

  const nextSeat = state.currentPlayer;
  const nextLegal = getValidCards(state.hands[nextSeat], state.leadSuit);
  state = playCard(state, nextSeat, nextLegal[0]);
  assert.equal(getPublicState(state).lastCompletedTrick, null);
});

test("CPU teammate logic follows the host-selected teams", () => {
  const state = {
    teams: { player: "yourTeam", cpu1: "yourTeam", cpu2: "opponentTeam", cpu3: "opponentTeam" },
    leadPlayer: "player", leadSuit: "♠", trumpSuit: null,
    currentTrick: { player: { suit: "♠", value: "A" }, cpu1: null, cpu2: null, cpu3: null }
  };
  assert.equal(isTeammateWinning(state, "cpu1"), true);
  assert.equal(isTeammateWinning(state, "cpu2"), false);
});

test("a complete CPU-played game still reaches thirteen tricks", async () => {
  const { chooseCpuCard } = await import("../js/game-ai.js");
  let state = createGame({ rng: () => 0.51, startingPlayer: "player" });
  let safety = 0;
  while (state.gameActive && safety < 60) {
    const seat = state.currentPlayer;
    state = playCard(state, seat, chooseCpuCard(state, seat));
    safety += 1;
  }
  assert.equal(state.gameActive, false);
  assert.equal(state.completedTricks.length, 13);
  assert.equal(state.tensWon.yourTeam + state.tensWon.opponentTeam, 4);
});
