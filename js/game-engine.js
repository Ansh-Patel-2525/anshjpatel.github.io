/**
 * Headless Mindi game engine. This is suitable for server-side use.
 * Never send state.hands or the full state object to a browser client.
 */
import {
  SEATS, DEFAULT_TEAMS, createDeck, dealCards, emptyTrick, getValidCards, sameCard,
  getCurrentWinnerEntry, getTeamForSeat, getGameResult
} from './game-rules.js';
import { chooseCpuCard } from './game-ai.js';

function cloneState(state) {
  return structuredClone(state);
}

export function createGame({ rng = Math.random, startingPlayer, teams = DEFAULT_TEAMS } = {}) {
  const deck = createDeck(rng);
  const hands = dealCards(deck);
  const firstPlayer = startingPlayer ?? SEATS[Math.floor(rng() * SEATS.length)];
  if (!SEATS.includes(firstPlayer)) throw new Error('Invalid starting player.');

  const chosenTeams = Object.fromEntries(SEATS.map((seat) => [seat, teams?.[seat] ?? DEFAULT_TEAMS[seat]]));
  if (Object.values(chosenTeams).some((team) => team !== 'yourTeam' && team !== 'opponentTeam') ||
      Object.values(chosenTeams).filter((team) => team === 'yourTeam').length !== 2 ||
      Object.values(chosenTeams).filter((team) => team === 'opponentTeam').length !== 2) {
    throw new Error('Each team must have exactly two seats.');
  }

  return {
    version: 1,
    teams: chosenTeams,
    hands,
    currentTrick: emptyTrick(),
    currentPlayer: firstPlayer,
    leadPlayer: firstPlayer,
    leadSuit: null,
    trumpSuit: null,
    gameActive: true,
    tricksWon: { yourTeam: 0, opponentTeam: 0 },
    tensWon: { yourTeam: 0, opponentTeam: 0 },
    completedTricks: [],
    lastCompletedTrick: null,
    winner: null
  };
}

export function validateCardPlay(state, seat, requestedCard) {
  if (!state || !state.gameActive) throw new Error('The game is not active.');
  if (!SEATS.includes(seat)) throw new Error('Unknown player seat.');
  if (state.currentPlayer !== seat) throw new Error('It is not this player’s turn.');
  if (!requestedCard || typeof requestedCard.suit !== 'string' || typeof requestedCard.value !== 'string') {
    throw new Error('Invalid card.');
  }

  const card = state.hands[seat].find((held) => sameCard(held, requestedCard));
  if (!card) throw new Error('That card is not in this player’s hand.');
  const validCards = getValidCards(state.hands[seat], state.leadSuit);
  if (!validCards.some((valid) => sameCard(valid, card))) {
    throw new Error('You must follow the lead suit when possible.');
  }
  return card;
}

function finishTrick(next) {
  const winnerEntry = getCurrentWinnerEntry(next);
  if (!winnerEntry) throw new Error('Cannot finish an empty trick.');

  const cards = Object.entries(next.currentTrick)
    .filter(([, card]) => card)
    .map(([player, card]) => ({ player, card }));
  if (cards.length !== 4) throw new Error('A trick must contain four cards.');

  const team = getTeamForSeat(winnerEntry.player, next.teams);
  const tens = cards.filter(({ card }) => card.value === '10').length;
  next.tricksWon[team] += 1;
  next.tensWon[team] += tens;
  next.completedTricks.push({
    winner: winnerEntry.player,
    winningCard: winnerEntry.card,
    cards,
    tens,
    trickNumber: next.completedTricks.length + 1
  });

  next.lastCompletedTrick = {
    winner: winnerEntry.player,
    winningCard: winnerEntry.card,
    cards: structuredClone(cards),
    tens,
    trickNumber: next.completedTricks.length
  };
  next.currentTrick = emptyTrick();
  next.leadSuit = null;
  next.leadPlayer = winnerEntry.player;
  next.currentPlayer = winnerEntry.player;

  if (SEATS.every((seat) => next.hands[seat].length === 0)) {
    next.gameActive = false;
    next.winner = getGameResult(next);
  }
}

/** Apply one human or CPU card play. Returns a new state; input is not mutated. */
export function playCard(state, seat, requestedCard) {
  const card = validateCardPlay(state, seat, requestedCard);
  const next = cloneState(state);
  // Keep the previous completed trick visible until the next card is played.
  next.lastCompletedTrick = null;
  const handIndex = next.hands[seat].findIndex((held) => sameCard(held, card));
  next.hands[seat].splice(handIndex, 1);

  // Original rule: the first off-suit play while no trump exists establishes trump.
  if (!next.trumpSuit && next.leadSuit && card.suit !== next.leadSuit) {
    next.trumpSuit = card.suit;
  }
  if (!next.leadSuit) next.leadSuit = card.suit;
  next.currentTrick[seat] = { suit: card.suit, value: card.value };

  const playedCount = Object.values(next.currentTrick).filter(Boolean).length;
  if (playedCount === 4) {
    finishTrick(next);
  } else {
    const seatIndex = SEATS.indexOf(seat);
    next.currentPlayer = SEATS[(seatIndex + 1) % SEATS.length];
  }

  next.version += 1;
  return next;
}

/** Runs exactly one CPU move; caller controls when CPU turns are processed. */
export function playCpuTurn(state) {
  const seat = state.currentPlayer;
  if (!seat.startsWith('cpu')) throw new Error('The current player is not a CPU.');
  const card = chooseCpuCard(state, seat);
  return playCard(state, seat, card);
}

/** Runs consecutive CPU turns until a human seat is due or the game ends. */
export function processCpuTurns(state, { maxMoves = 4 } = {}) {
  let next = state;
  let moves = 0;
  while (next.gameActive && next.currentPlayer.startsWith('cpu') && moves < maxMoves) {
    next = playCpuTurn(next);
    moves += 1;
  }
  return { state: next, moves, needsHuman: next.gameActive && !next.currentPlayer.startsWith('cpu') };
}

/** Safe public projection: no cards, deck or private hands are returned. */
export function getPublicState(state) {
  return {
    version: state.version,
    teams: { ...(state.teams ?? DEFAULT_TEAMS) },
    lastCompletedTrick: structuredClone(state.lastCompletedTrick ?? null),
    handCounts: Object.fromEntries(SEATS.map((seat) => [seat, state.hands[seat].length])),
    currentTrick: structuredClone(state.currentTrick),
    currentPlayer: state.currentPlayer,
    leadPlayer: state.leadPlayer,
    leadSuit: state.leadSuit,
    trumpSuit: state.trumpSuit,
    gameActive: state.gameActive,
    tricksWon: { ...state.tricksWon },
    tensWon: { ...state.tensWon },
    completedTricks: structuredClone(state.completedTricks),
    winner: state.winner
  };
}

/** Return only the authenticated seat's cards. Never call this for another seat. */
export function getPlayerHand(state, seat) {
  if (!SEATS.includes(seat)) throw new Error('Unknown player seat.');
  return state.hands[seat].map((card) => ({ ...card }));
}
