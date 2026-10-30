import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createGame, getPlayerHand, getPublicState, playCard, playCpuTurn } from "./game-engine.js";
import { SEATS } from "./game-rules.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEAT_BY_NUMBER = ["player", "cpu1", "cpu2", "cpu3"] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function httpError(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function getSeatNumber(seatName: string): number {
  const seat = SEAT_BY_NUMBER.indexOf(seatName as typeof SEAT_BY_NUMBER[number]);
  if (seat < 0) throw new Error("Unknown game seat");
  return seat;
}

function publicSeatName(seatNumber: number): string {
  const seat = SEAT_BY_NUMBER[seatNumber];
  if (!seat) throw new Error("Invalid room seat");
  return seat;
}

async function requireMember(admin: SupabaseClient, roomId: string, userId: string) {
  const { data, error } = await admin
    .from("mindi_room_players")
    .select("seat,user_id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("You are not a member of this room");
  return { seat: publicSeatName(data.seat), seatNumber: data.seat as number };
}

async function loadFullState(admin: SupabaseClient, roomId: string) {
  const [{ data: publicRow, error: publicError }, { data: handRows, error: handsError }] = await Promise.all([
    admin.from("mindi_public_state").select("game_state,version").eq("room_id", roomId).maybeSingle(),
    admin.from("mindi_private_hands").select("seat,hand").eq("room_id", roomId),
  ]);
  if (publicError) throw publicError;
  if (handsError) throw handsError;
  if (!publicRow) throw new Error("The game has not started");

  const hands: Record<string, Array<{ suit: string; value: string }>> = {};
  for (const row of handRows ?? []) hands[publicSeatName(row.seat)] = row.hand;
  for (const seat of SEATS) {
    if (!hands[seat]) throw new Error("Game hand data is incomplete");
  }

  return { ...publicRow.game_state, version: publicRow.version, hands };
}

async function saveFullState(
  admin: SupabaseClient,
  roomId: string,
  expectedVersion: number,
  state: any,
) {
  const publicState = getPublicState(state);
  const hands = Object.fromEntries(SEATS.map((seat) => [seat, getPlayerHand(state, seat)]));
  const { error } = await admin.rpc("commit_mindi_game_state", {
    p_room_id: roomId,
    p_expected_version: expectedVersion,
    p_game_state: publicState,
    p_hands: hands,
  });
  if (error) {
    if (error.message?.includes("VERSION_CONFLICT")) {
      throw Object.assign(new Error("The game changed because another move was processed. Refresh the game."), { status: 409 });
    }
    throw error;
  }
}

async function runEmptyCpuSeats(state: any, humanSeats: Set<string>) {
  let moves = 0;
  // A 52-card cap is a safety guard; normally a human seat is reached quickly.
  while (
    state.gameActive &&
    state.currentPlayer.startsWith("cpu") &&
    !humanSeats.has(state.currentPlayer) &&
    moves < 52
  ) {
    state = playCpuTurn(state);
    moves += 1;
  }
  if (moves >= 52 && state.gameActive && state.currentPlayer.startsWith("cpu") && !humanSeats.has(state.currentPlayer)) {
    throw new Error("CPU turn safety limit reached");
  }
  return state;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return httpError("Use POST", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return httpError("Sign in is required", 401);
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return httpError("Sign in is required", 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const userDb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return httpError("Invalid or expired login session", 401);
    const user = authData.user;

    const body = await req.json();
    const action = body?.action;

    if (action === "create_room") {
      const { data, error } = await userDb.rpc("create_mindi_room");
      if (error) throw error;
      return jsonResponse({ room: data?.[0] ?? data });
    }

    if (action === "join_room") {
      if (typeof body.room_code !== "string") return httpError("A room code is required");
      const { data, error } = await userDb.rpc("join_mindi_room", { p_code: body.room_code });
      if (error) throw error;
      return jsonResponse({ room: data?.[0] ?? data });
    }

    if (typeof body.room_id !== "string") return httpError("A room ID is required");
    const roomId = body.room_id;

    if (action === "get_state") {
      const membership = await requireMember(admin, roomId, user.id);
      const [{ data: publicRow, error: publicError }, { data: players, error: playersError }, { data: ownHand, error: handError }] = await Promise.all([
        admin.from("mindi_public_state").select("game_state,version").eq("room_id", roomId).maybeSingle(),
        admin.from("mindi_room_players").select("seat,user_id,joined_at").eq("room_id", roomId).order("seat"),
        admin.from("mindi_private_hands").select("hand").eq("room_id", roomId).eq("user_id", user.id).maybeSingle(),
      ]);
      if (publicError) throw publicError;
      if (playersError) throw playersError;
      if (handError) throw handError;
      const { data: room, error: roomError } = await admin.from("mindi_rooms").select("id,room_code,status,host_id").eq("id", roomId).single();
      if (roomError) throw roomError;
      return jsonResponse({
        room,
        seat: membership.seat,
        players: (players ?? []).map((p) => ({ seat: publicSeatName(p.seat), user_id: p.user_id, joined_at: p.joined_at })),
        game_state: publicRow ? { ...publicRow.game_state, version: publicRow.version } : null,
        hand: ownHand?.hand ?? null,
      });
    }

    if (action === "start_game") {
      const { data: room, error: roomError } = await admin.from("mindi_rooms").select("id,host_id,status").eq("id", roomId).single();
      if (roomError) throw roomError;
      if (room.host_id !== user.id) return httpError("Only the room host can start the game", 403);
      if (room.status !== "waiting") return httpError("This room has already started", 409);

      const { data: players, error: playersError } = await admin.from("mindi_room_players").select("seat,user_id").eq("room_id", roomId);
      if (playersError) throw playersError;
      if ((players ?? []).length < 2) return httpError("At least two human players are required", 400);

      const humanSeats = new Set<string>((players ?? []).map((p) => publicSeatName(p.seat)));
      let state = createGame();
      state = await runEmptyCpuSeats(state, humanSeats);
      await saveFullState(admin, roomId, -1, state);
      return jsonResponse({ game_state: getPublicState(state), your_hand: getPlayerHand(state, publicSeatName((players ?? []).find((p) => p.user_id === user.id)!.seat)) });
    }

    if (action === "play_card") {
      const membership = await requireMember(admin, roomId, user.id);
      if (!Number.isSafeInteger(body.version)) return httpError("The current game version is required");
      const state = await loadFullState(admin, roomId);
      if (state.version !== body.version) return httpError("The game has changed. Refresh before playing.", 409);
      const nextState = playCard(state, membership.seat, body.card);

      const { data: players, error: playersError } = await admin.from("mindi_room_players").select("seat,user_id").eq("room_id", roomId);
      if (playersError) throw playersError;
      const humanSeats = new Set<string>((players ?? []).map((p) => publicSeatName(p.seat)));
      const finalState = await runEmptyCpuSeats(nextState, humanSeats);
      await saveFullState(admin, roomId, state.version, finalState);
      return jsonResponse({ game_state: getPublicState(finalState), your_hand: getPlayerHand(finalState, membership.seat) });
    }

    return httpError("Unknown action", 400);
  } catch (error) {
    const status = (error as any)?.status ?? 400;
    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("mindi-game error:", message);
    return httpError(message, status);
  }
});
