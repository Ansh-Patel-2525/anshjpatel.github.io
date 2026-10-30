import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, dealCards, getValidCards } from '../js/game-rules.js';
import { chooseLeadCard, chooseCpuCard } from '../js/game-ai.js';
import { createGame, playCard, playCpuTurn, getPublicState, getPlayerHand } from '../js/game-engine.js';

function fixedRng() { return 0.5; }

test('creates a unique 52-card deck', () => {
  const deck = createDeck(fixedRng);
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((c) => `${c.value}${c.suit}`)).size, 52);
});

test('deals 13 cards to each of four seats', () => {
  const hands = dealCards(createDeck(fixedRng));
  for (const seat of ['player', 'cpu1', 'cpu2', 'cpu3']) assert.equal(hands[seat].length, 13);
});

test('forces following suit whenever possible', () => {
  const hand = [{ suit: '♠', value: 'A' }, { suit: '♥', value: '2' }];
  assert.deepEqual(getValidCards(hand, '♠'), [hand[0]]);
  assert.deepEqual(getValidCards(hand, '♦'), hand);
});

test('starts a game with 13 cards each and a valid random leader', () => {
  const state = createGame({ rng: fixedRng });
  assert.equal(state.gameActive, true);
  assert.equal(state.hands.player.length, 13);
  assert.ok(['player', 'cpu1', 'cpu2', 'cpu3'].includes(state.currentPlayer));
});

test('rejects a card played out of turn', () => {
  const state = createGame({ rng: fixedRng, startingPlayer: 'player' });
  assert.throws(() => playCard(state, 'cpu1', state.hands.cpu1[0]), /turn/i);
});

test('rejects a card that is not in the player hand', () => {
  const state = createGame({ rng: fixedRng, startingPlayer: 'player' });
  assert.throws(() => playCard(state, 'player', { suit: 'X', value: '1' }), /not in this player/);
});

test('rejects failure to follow suit', () => {
  const state = createGame({ rng: fixedRng, startingPlayer: 'player' });
  const next = { ...state, leadSuit: state.hands.player[0].suit };
  const offSuit = next.hands.player.find((card) => card.suit !== next.leadSuit);
  if (offSuit) assert.throws(() => playCard(next, 'player', offSuit), /follow the lead suit/);
  else assert.ok(true, 'This particular generated hand contains only one suit.');
});

test('does not expose any hand in public state', () => {
  const state = createGame({ rng: fixedRng });
  const pub = getPublicState(state);
  assert.equal('hands' in pub, false);
  assert.equal('deck' in pub, false);
  assert.equal(getPlayerHand(state, 'player').length, 13);
});

test('original CPU lead strategy leads an ace when it is in the strongest suit', () => {
  const hand = [
    { suit: '♠', value: 'A' }, { suit: '♠', value: '7' },
    { suit: '♥', value: 'K' }
  ];
  assert.deepEqual(chooseLeadCard(hand), hand[0]);
});

test('CPU can select and play a legal card', () => {
  const state = createGame({ rng: fixedRng, startingPlayer: 'cpu1' });
  const selected = chooseCpuCard(state, 'cpu1');
  const next = playCpuTurn(state);
  assert.equal(next.hands.cpu1.length, 12);
  assert.deepEqual(next.currentTrick.cpu1, selected);
});

test('a full CPU-only game completes with 13 tricks and all four tens allocated', () => {
  let state = createGame({ rng: fixedRng, startingPlayer: 'cpu1' });
  // Exercise the complete game by treating every seat as an automated player.
  let safety = 0;
  while (state.gameActive && safety < 60) {
    const seat = state.currentPlayer;
    state = playCard(state, seat, chooseCpuCard(state, seat));
    safety += 1;
  }
  assert.equal(state.gameActive, false);
  assert.equal(state.completedTricks.length, 13);
  assert.equal(state.tricksWon.yourTeam + state.tricksWon.opponentTeam, 13);
  assert.equal(state.tensWon.yourTeam + state.tensWon.opponentTeam, 4);
  assert.ok(['yourTeam', 'opponentTeam'].includes(state.winner));
});
