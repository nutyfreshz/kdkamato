do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='run_due_pro_reviews';

  if v_def is null then
    raise exception 'RUNNER_NOT_FOUND';
  end if;

  if position('evaluate_pro_policy_shadow_v5' in v_def) > 0 then
    return;
  end if;

  if position('evaluate_pro_policy_shadow_v3' in v_def) = 0 then
    raise exception 'RUNNER_NOT_ON_EXPECTED_V3_BASE';
  end if;

  v_def := replace(v_def,'v_policy_v3','v_policy_v5');
  v_def := replace(v_def,'evaluate_pro_policy_shadow_v3','evaluate_pro_policy_shadow_v5');
  v_def := replace(v_def,'PRO_CENTRAL_POLICY_SHADOW_V3','PRO_CENTRAL_POLICY_SHADOW_V5');
  execute v_def;
end $$;