-- Atomic, server-only persistence for Mindi games.
-- Run this in Supabase SQL Editor after the earlier room/state table scripts.

create or replace function public.commit_mindi_game_state(
    p_room_id uuid,
    p_expected_version bigint,
    p_game_state jsonb,
    p_hands jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_room_status text;
    v_current_version bigint;
    v_new_version bigint;
    v_pair record;
    v_seat integer;
    v_user_id uuid;
    v_hand_count integer := 0;
begin
    if p_game_state is null or jsonb_typeof(p_game_state) <> 'object'
       or p_hands is null or jsonb_typeof(p_hands) <> 'object' then
        raise exception 'Invalid game state payload';
    end if;

    if not (p_game_state ? 'version') then
        raise exception 'Game state version is required';
    end if;
    v_new_version := (p_game_state->>'version')::bigint;

    -- Serialize all writes for this room.
    select r.status into v_room_status
    from public.mindi_rooms r
    where r.id = p_room_id
    for update;

    if not found then
        raise exception 'ROOM_NOT_FOUND';
    end if;

    if p_expected_version = -1 then
        if v_room_status <> 'waiting' then
            raise exception 'ROOM_ALREADY_STARTED';
        end if;
        if exists (
            select 1 from public.mindi_public_state s
            where s.room_id = p_room_id
        ) then
            raise exception 'VERSION_CONFLICT';
        end if;
        if (select count(*) from public.mindi_room_players p where p.room_id = p_room_id) < 2 then
            raise exception 'At least two human players are required to start';
        end if;
        if v_new_version < 1 then
            raise exception 'Invalid initial game version';
        end if;

        insert into public.mindi_public_state (room_id, game_state, version, updated_at)
        values (p_room_id, p_game_state, v_new_version, now());

        update public.mindi_rooms
        set status = case when coalesce((p_game_state->>'gameActive')::boolean, true)
                          then 'playing' else 'finished' end
        where id = p_room_id;
    else
        if v_room_status <> 'playing' then
            raise exception 'GAME_NOT_ACTIVE';
        end if;

        select s.version into v_current_version
        from public.mindi_public_state s
        where s.room_id = p_room_id
        for update;

        if not found or v_current_version <> p_expected_version then
            raise exception 'VERSION_CONFLICT';
        end if;
        if v_new_version <= p_expected_version then
            raise exception 'New game version must increase';
        end if;

        update public.mindi_public_state
        set game_state = p_game_state,
            version = v_new_version,
            updated_at = now()
        where room_id = p_room_id;

        if coalesce((p_game_state->>'gameActive')::boolean, true) then
            update public.mindi_rooms set status = 'playing' where id = p_room_id;
        else
            update public.mindi_rooms set status = 'finished' where id = p_room_id;
        end if;
    end if;

    -- Replace all four hands in the same transaction as the public state.
    delete from public.mindi_private_hands where room_id = p_room_id;

    for v_pair in
        select e.key, e.value
        from jsonb_each(p_hands) as e(key, value)
    loop
        if jsonb_typeof(v_pair.value) <> 'array' then
            raise exception 'Each hand must be a JSON array';
        end if;

        v_seat := case v_pair.key
            when 'player' then 0
            when 'cpu1' then 1
            when 'cpu2' then 2
            when 'cpu3' then 3
            else null
        end;

        if v_seat is null then
            raise exception 'Unknown seat in hand payload';
        end if;

        select p.user_id into v_user_id
        from public.mindi_room_players p
        where p.room_id = p_room_id and p.seat = v_seat;

        insert into public.mindi_private_hands (room_id, seat, user_id, hand)
        values (p_room_id, v_seat, v_user_id, v_pair.value);

        v_hand_count := v_hand_count + 1;
    end loop;

    if v_hand_count <> 4 then
        raise exception 'Exactly four player hands are required';
    end if;

    return v_new_version;
end;
$$;

revoke all on function public.commit_mindi_game_state(uuid, bigint, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.commit_mindi_game_state(uuid, bigint, jsonb, jsonb)
to service_role;
