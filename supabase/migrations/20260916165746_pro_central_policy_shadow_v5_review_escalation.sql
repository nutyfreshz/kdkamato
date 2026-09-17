create or replace function private.evaluate_pro_policy_shadow_v5(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v4 jsonb;
  v_route text;
  v_selected jsonb;
  v_deferred jsonb;
  v_domains jsonb;
  v_review_candidates jsonb := '[]'::jsonb;
  v_review_count integer := 0;
  v_candidate jsonb;
  v_selected_domain text;
  v_selected_auto boolean := false;
begin
  v4 := private.evaluate_pro_policy_shadow_v4(p_snapshot_id);
  v_route := coalesce(v4->>'route','KEEP');
  v_selected := v4->'selected_proposal';
  v_deferred := coalesce(v4->'deferred_material_candidates','[]'::jsonb);
  v_domains := coalesce(v4->'domains','{}'::jsonb);
  v_selected_domain := coalesce(v_selected->>'domain','');
  v_selected_auto := coalesce((v_selected->>'auto_eligible_candidate')::boolean,false);

  if v_domains->'schedule'->>'action'='SCHEDULE_FIT_REVIEW' then
    v_review_candidates := v_review_candidates || jsonb_build_array(v_domains->'schedule');
  end if;

  if coalesce(v_domains->'nutrition'->>'level','')='REVIEW_CANDIDATE'
     or v_domains->'nutrition'->>'action'='NUTRITION_REVIEW_REQUIRED' then
    v_review_candidates := v_review_candidates || jsonb_build_array(v_domains->'nutrition');
  end if;

  for v_candidate in select value from jsonb_array_elements(coalesce(v_domains->'volume','[]'::jsonb))
  loop
    if coalesce(v_candidate->>'level','')='REVIEW_CANDIDATE'
       or v_candidate->>'action'='VOLUME_REVIEW_REQUIRED' then
      v_review_candidates := v_review_candidates || jsonb_build_array(v_candidate);
    end if;
  end loop;

  v_review_count := jsonb_array_length(v_review_candidates);

  -- Safety, recovery, and a validated exercise replacement keep higher authority.
  if v_route='EXCEPTION'
     or (v_route='AUTO_CANDIDATE_SHADOW' and v_selected_domain in ('RECOVERY','EXERCISE')) then
    null;
  elsif v_review_count=1 then
    if v_selected_auto and v_selected is not null then
      v_deferred := v_deferred || jsonb_build_array(v_selected);
    end if;
    v_route := 'REVIEW_CANDIDATE';
    select value into v_selected from jsonb_array_elements(v_review_candidates) limit 1;
  elsif v_review_count>1 then
    if v_selected_auto and v_selected is not null then
      v_deferred := v_deferred || jsonb_build_array(v_selected);
    end if;
    v_route := 'REVIEW_AMBIGUOUS';
    v_selected := jsonb_build_object(
      'domain','MULTI_DOMAIN',
      'action','MULTIPLE_REVIEW_CANDIDATES',
      'level','REVIEW_CANDIDATE',
      'review_candidates',v_review_candidates,
      'auto_eligible_candidate',false,
      'execution_authorized',false
    );
  end if;

  return jsonb_build_object(
    'policy_version','PRO_CENTRAL_POLICY_SHADOW_V5',
    'mode','SHADOW_ONLY_NO_PROGRAM_WRITE',
    'snapshot_id',p_snapshot_id,
    'route',v_route,
    'one_variable_rule',true,
    'selected_proposal',v_selected,
    'review_candidates',v_review_candidates,
    'deferred_material_candidates',v_deferred,
    'domains',v_domains,
    'program_change_authorized',false,
    'execution_authorized',false
  );
end;
$function$;