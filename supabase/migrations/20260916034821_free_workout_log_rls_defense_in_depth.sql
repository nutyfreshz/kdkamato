alter table private.workout_exercise_logs enable row level security;
comment on table private.workout_exercise_logs is 'Free-foundation working-set log. Private schema, direct grants revoked, RLS enabled without client policies; access occurs only through ownership-validating RPCs.';
