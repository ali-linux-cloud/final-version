-- Enable email signups in auth settings
update auth.config
set config = jsonb_set(
  config,
  '{auth, enable_signup}',
  'true'
);

-- Allow all email domains
update auth.config
set config = jsonb_set(
  config,
  '{auth, allowed_email_domains}',
  '["*"]'
);
