/**
 * Mindi rules extracted from the original mindih.html.
 * Pure game rules only: no DOM, timers, network calls or browser globals.
 */

export const SUITS = Object.freeze(['♠', '♥', '♦', '♣']);
export const VALUES = Object.freeze(['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']);
export const VALUE_ORDER = Object.freeze({
  A: 14, K: 13, Q: 12, J: 11, '10': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5,
  '4': 4, '3': 3, '2': 2
});

export const SEATS = Object.freeze(['player', 'cpu1', 'cpu2', 'cpu3']);
export const TEAM_YOURS = Object.freeze(['player', 'cpu2']);
export const TEAM_OPPONENTS = Object.freeze(['cpu1', 'cpu3']);

export function createDeck(rng = Math.random) {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) deck.push({ suit, value });
  }

  // Original game uses Fisher–Yates shuffle.
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function sortHand(hand) {
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    return VALUE_ORDER[b.value] - VALUE_ORDER[a.value];
  });
}

export function dealCards(deck) {
  if (!Array.isArray(deck) || deck.length !== 52) {
    throw new Error('A complete 52-card deck is required.');
  }

  const hands = Object.fromEntries(SEATS.map((seat) => [seat, []]));
  for (let i = 0; i < 52; i += 1) {
    hands[SEATS[i % 4]].push(deck[i]);
  }
  for (const seat of SEATS) hands[seat] = sortHand(hands[seat]);
  return hands;
}

export function emptyTrick() {
  return Object.fromEntries(SEATS.map((seat) => [seat, null]));
}

export function getValidCards(hand, leadSuit) {
  if (!leadSuit || !hand.some((card) => card.suit === leadSuit)) return [...hand];
  return hand.filter((card) => card.suit === leadSuit);
}

export function sameCard(a, b) {
  return Boolean(a && b && a.suit === b.suit && a.value === b.value);
}

export function getSeatOrderFrom(leadPlayer) {
  const start = SEATS.indexOf(leadPlayer);
  if (start < 0) throw new Error(`Unknown seat: ${leadPlayer}`);
  return Array.from({ length: 4 }, (_, offset) => SEATS[(start + offset) % 4]);
}

/**
 * Evaluate cards in actual play order, starting with the lead player's card.
 * This intentionally fixes the original helper's seat-order assumption.
 */
export function getCurrentWinnerEntry(state) {
  const order = getSeatOrderFrom(state.leadPlayer);
  const played = order
    .filter((seat) => state.currentTrick[seat])
    .map((seat) => ({ player: seat, card: state.currentTrick[seat] }));
  if (played.length === 0) return null;

  let winner = played[0];
  for (const current of played.slice(1)) {
    const card = current.card;
    if (card.suit !== state.leadSuit && card.suit !== state.trumpSuit) continue;

    if (state.trumpSuit) {
      if (card.suit === state.trumpSuit && winner.card.suit !== state.trumpSuit) {
        winner = current;
        continue;
      }
      if (winner.card.suit === state.trumpSuit && card.suit !== state.trumpSuit) continue;
    }

    if (card.suit === winner.card.suit && VALUE_ORDER[card.value] > VALUE_ORDER[winner.card.value]) {
      winner = current;
    }
  }
  return winner;
}

export function getTeamForSeat(seat) {
  if (TEAM_YOURS.includes(seat)) return 'yourTeam';
  if (TEAM_OPPONENTS.includes(seat)) return 'opponentTeam';
  throw new Error(`Unknown seat: ${seat}`);
}

export function getGameResult(state) {
  const yours = state.tensWon.yourTeam;
  const theirs = state.tensWon.opponentTeam;
  if (yours > theirs) return 'yourTeam';
  if (theirs > yours) return 'opponentTeam';
  return state.tricksWon.yourTeam > state.tricksWon.opponentTeam ? 'yourTeam' : 'opponentTeam';
}
