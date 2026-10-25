-- Gives existing CJE Hub accounts admin access to The Branding Lab,
-- plus an active Agency Lab membership so admins can test every experiment.
-- Run once, after the two migration files. Safe to run again.
--
-- Change the email list below before running.

with admins as (
  select id, email, name
  from public.users
  where lower(email) in (
    'media@ciarajevans.com',
    'REPLACE_WITH_TARAS_HUB_EMAIL'
  )
)
insert into lab.profiles (id, email, full_name, role)
select id, lower(email), name, 'admin' from admins
on conflict (id) do update set role = 'admin';

insert into lab.memberships (user_id, tier, status, source, activated_at)
select p.id, 'agency_lab', 'active', 'admin', now()
from lab.profiles p
where p.role = 'admin'
on conflict (user_id) do nothing;

-- Check: should list each admin
select p.email, p.role, m.tier, m.status
from lab.profiles p
left join lab.memberships m on m.user_id = p.id
where p.role = 'admin';
