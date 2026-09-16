-- Requires Vault secrets configured per environment:
--   kdk_project_url
--   kdk_legacy_anon_jwt

select cron.schedule(
  'kdk-pro-review-runner-hourly',
  '7 * * * *',
  $$select private.run_due_pro_reviews(100);$$
);

select cron.schedule(
  'kdk-pro-exception-email-every-10m',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='kdk_project_url') || '/functions/v1/kdk-pro-exception-email',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='kdk_legacy_anon_jwt'),
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='kdk_legacy_anon_jwt')
    ),
    body := jsonb_build_object('source','cron','invoked_at',now()),
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);
