-- Allow both FREE and PRO accounts to create/activate their initial program.
-- Program tier follows current account tier; PRO users should not be blocked by the FREE base generator.

create or replace function public.persist_free_program_version(
  p_user_id uuid,
  p_goal_snapshot jsonb,
  p_training_items jsonb,
  p_nutrition_target jsonb
) returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_program_id uuid;
  v_next_version integer;
  v_tier text;
  v_fingerprint text;
begin
  select ua.tier
  into v_tier
  from public.user_access ua
  where ua.user_id = p_user_id
  for update;

  if v_tier is null then
    raise exception 'USER_ACCESS_NOT_FOUND';
  end if;

  if v_tier not in ('FREE','PRO') then
    raise exception 'PROGRAM_GENERATOR_REQUIRES_ACTIVE_USER';
  end if;

  if p_goal_snapshot is null
     or jsonb_typeof(p_goal_snapshot) <> 'object' then
    raise exception 'INVALID_GOAL_SNAPSHOT';
  end if;

  if p_training_items is null
     or jsonb_typeof(p_training_items) <> 'array'
     or jsonb_array_length(p_training_items) = 0 then
    raise exception 'TRAINING_ITEMS_REQUIRED';
  end if;

  if p_nutrition_target is null
     or jsonb_typeof(p_nutrition_target) <> 'object' then
    raise exception 'NUTRITION_TARGET_REQUIRED';
  end if;

  v_fingerprint := nullif(btrim(p_goal_snapshot->>'program_fingerprint'), '');

  if v_fingerprint is not null then
    select p.program_id
    into v_program_id
    from public.programs p
    where p.user_id = p_user_id
      and p.status = 'ACTIVE'
      and p.goal_snapshot->>'program_fingerprint' = v_fingerprint
    limit 1;

    if v_program_id is not null then
      return v_program_id;
    end if;
  end if;

  select coalesce(max(p.program_version), 0) + 1
  into v_next_version
  from public.programs p
  where p.user_id = p_user_id;

  update public.programs
  set status = 'ARCHIVED', archived_at = now()
  where user_id = p_user_id
    and status = 'ACTIVE';

  insert into public.programs (
    user_id, program_version, program_tier, goal_snapshot, status, activated_at
  ) values (
    p_user_id, v_next_version, v_tier, p_goal_snapshot, 'ACTIVE', now()
  )
  returning program_id into v_program_id;

  insert into public.training_program_items (
    program_id, training_day, movement_slot, exercise_key, sets,
    rep_min, rep_max, target_rir, display_order, metadata
  )
  select
    v_program_id, x.training_day, x.movement_slot, x.exercise_key, x.sets,
    x.rep_min, x.rep_max, x.target_rir, x.display_order, x.metadata
  from jsonb_to_recordset(p_training_items) as x (
    training_day smallint,
    movement_slot text,
    exercise_key text,
    sets smallint,
    rep_min smallint,
    rep_max smallint,
    target_rir numeric,
    display_order smallint,
    metadata jsonb
  );

  insert into public.nutrition_targets (
    program_id, maintenance_low, maintenance_high, calorie_low, calorie_high,
    protein_low_g, protein_high_g, fat_min_g, carb_target_g, estimate_confidence
  )
  select
    v_program_id, n.maintenance_low, n.maintenance_high, n.calorie_low, n.calorie_high,
    n.protein_low_g, n.protein_high_g, n.fat_min_g, n.carb_target_g, n.estimate_confidence
  from jsonb_to_record(p_nutrition_target) as n (
    maintenance_low numeric,
    maintenance_high numeric,
    calorie_low numeric,
    calorie_high numeric,
    protein_low_g numeric,
    protein_high_g numeric,
    fat_min_g numeric,
    carb_target_g numeric,
    estimate_confidence text
  );

  return v_program_id;
end;
$function$;
