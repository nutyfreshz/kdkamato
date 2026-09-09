create or replace function public.save_my_lab_result(
  p_tool_key text,
  p_result_payload jsonb,
  p_measured_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_tool_key text;
  v_result_id uuid;
  v_program_outcome jsonb;
begin
  v_user_id:=auth.uid();
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  v_tool_key:=lower(btrim(coalesce(p_tool_key,'')));
  if v_tool_key not in ('exercise-fit','squat-geometry','physique-goal','v-taper','ffmi','knee-to-wall','ape-index','femur-tibia') then
    raise exception 'INVALID_LAB_TOOL_KEY';
  end if;
  if p_result_payload is null or jsonb_typeof(p_result_payload)<>'object' then raise exception 'LAB_RESULT_PAYLOAD_MUST_BE_OBJECT'; end if;
  if p_result_payload ? '_system' then raise exception 'LAB_RESULT_RESERVED_FIELD'; end if;
  if coalesce(p_result_payload->>'schema_version','')<>'LAB_RESULT_V1' then raise exception 'LAB_RESULT_SCHEMA_VERSION_REQUIRED'; end if;
  if octet_length(p_result_payload::text)>32768 then raise exception 'LAB_RESULT_PAYLOAD_TOO_LARGE'; end if;
  if p_measured_at is null then p_measured_at:=now(); end if;
  if p_measured_at>now()+interval '5 minutes' or p_measured_at<now()-interval '365 days' then raise exception 'INVALID_LAB_MEASURED_AT'; end if;

  insert into public.lab_results(user_id,tool_key,result_payload,result_status,measured_at)
  values(v_user_id,v_tool_key,p_result_payload,'VALID',p_measured_at)
  returning result_id into v_result_id;

  perform private.normalize_lab_result(v_result_id);
  perform private.rank_exercise_candidates_for_lab_result(v_result_id);
  v_program_outcome := private.apply_c1_targeted_program_refresh(v_result_id);

  update public.lab_results
  set result_payload = (result_payload - '_system') || jsonb_build_object(
    '_system', jsonb_build_object(
      'program_outcome', coalesce(v_program_outcome, jsonb_build_object('status','NO_ACTION','reason','OUTCOME_UNAVAILABLE')),
      'program_policy_version', 'C1_TARGETED_REFRESH_V1',
      'recorded_at', now()
    )
  )
  where result_id=v_result_id;

  return v_result_id;
end;
$function$;
