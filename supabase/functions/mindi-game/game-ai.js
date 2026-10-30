/** Original CPU strategy, separated from the browser interface. */
import { SUITS, VALUE_ORDER, getValidCards, getCurrentWinnerEntry } from './game-rules.js';

export function chooseLeadCard(hand) {
  if (!hand.length) throw new Error('Cannot choose a lead card from an empty hand.');

  // Original strategy: choose the suit with the most cards; ties follow SUITS order.
  const suitCounts = Object.fromEntries(SUITS.map((suit) => [suit, hand.filter((card) => card.suit === suit).length]));
  let bestSuit = null;
  let maxCount = 0;
  for (const suit of SUITS) {
    if (suitCounts[suit] > maxCount) {
      maxCount = suitCounts[suit];
      bestSuit = suit;
    }
  }

  const suitCards = hand
    .filter((card) => card.suit === bestSuit)
    .sort((a, b) => VALUE_ORDER[b.value] - VALUE_ORDER[a.value]);

  if (suitCards[0].value === 'A') return suitCards[0];
  if (suitCards.length > 1) return suitCards[1];
  return suitCards[0];
}

export function isTeammateWinning(state, seat = state.currentPlayer) {
  const winner = getCurrentWinnerEntry(state);
  if (!winner) return false;
  const defaultTeams = { player: 'yourTeam', cpu1: 'opponentTeam', cpu2: 'yourTeam', cpu3: 'opponentTeam' };
  const teams = state.teams ?? defaultTeams;
  return teams[winner.player] === teams[seat];
}

export function chooseFollowCard(validCards, hand, state, seat = state.currentPlayer) {
  if (!validCards.length) throw new Error('No legal cards available.');

  const tensInTrick = Object.values(state.currentTrick).filter((card) => card?.value === '10').length;
  const teammateWinning = isTeammateWinning(state, seat);
  const currentWinner = getCurrentWinnerEntry(state)?.card;
  if (!currentWinner) throw new Error('Cannot follow before a card has been led.');

  const leadSuitCards = validCards.filter((card) => card.suit === state.leadSuit);
  const trumpCards = validCards.filter((card) => state.trumpSuit && card.suit === state.trumpSuit);

  // CASE 1: Follow suit.
  if (leadSuitCards.length > 0) {
    leadSuitCards.sort((a, b) => VALUE_ORDER[b.value] - VALUE_ORDER[a.value]);
    if (teammateWinning) return leadSuitCards[leadSuitCards.length - 1];

    const shouldTryToWin = tensInTrick > 0;
    const winningCards = leadSuitCards.filter((card) => VALUE_ORDER[card.value] > VALUE_ORDER[currentWinner.value]);
    if (winningCards.length > 0 && (shouldTryToWin || !teammateWinning)) {
      return winningCards[winningCards.length - 1];
    }
    return leadSuitCards[leadSuitCards.length - 1];
  }

  // CASE 2: Void in lead suit; consider trump.
  if (trumpCards.length > 0) {
    trumpCards.sort((a, b) => VALUE_ORDER[b.value] - VALUE_ORDER[a.value]);

    if (teammateWinning) {
      const nonTrumpCards = validCards
        .filter((card) => card.suit !== state.trumpSuit)
        .sort((a, b) => VALUE_ORDER[a.value] - VALUE_ORDER[b.value]);
      if (nonTrumpCards.length > 0) return nonTrumpCards[0];
    }

    if (tensInTrick > 0 || !teammateWinning) {
      if (currentWinner.suit === state.trumpSuit) {
        const canBeat = trumpCards.filter((card) => VALUE_ORDER[card.value] > VALUE_ORDER[currentWinner.value]);
        if (canBeat.length > 0) return canBeat[canBeat.length - 1];
        return trumpCards[trumpCards.length - 1];
      }
      return trumpCards[trumpCards.length - 1];
    }

    const nonTrumpCards = validCards
      .filter((card) => card.suit !== state.trumpSuit)
      .sort((a, b) => VALUE_ORDER[a.value] - VALUE_ORDER[b.value]);
    if (nonTrumpCards.length > 0) return nonTrumpCards[0];
    return trumpCards[trumpCards.length - 1];
  }

  // CASE 3: Cannot follow and has no trump; discard the lowest rank.
  return [...validCards].sort((a, b) => VALUE_ORDER[a.value] - VALUE_ORDER[b.value])[0];
}

export function chooseCpuCard(state, seat = state.currentPlayer) {
  const hand = state.hands[seat];
  if (!hand?.length) throw new Error(`${seat} has no cards remaining.`);
  const validCards = getValidCards(hand, state.leadSuit);
  if (!state.leadSuit) return chooseLeadCard(hand);
  return chooseFollowCard(validCards, hand, state, seat);
}
