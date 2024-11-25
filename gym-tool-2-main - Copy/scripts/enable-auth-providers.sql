-- Enable email provider and allow new users
update auth.providers
set enabled = true
where provider_id = 'email';

-- Ensure signups are enabled
alter table auth.users
  enable row level security;
