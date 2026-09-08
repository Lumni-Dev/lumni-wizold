-- Grant a 7-day VIP trial to hunters whose account was opened today
-- (America/Sao_Paulo calendar day), without touching an already-paid window.
update characters c
set vip_until = now() + interval '7 days'
from users u
where u.id = c.user_id
  and (u.created_at at time zone 'America/Sao_Paulo')::date
    = (timezone('America/Sao_Paulo', now()))::date
  and (c.vip_until is null or c.vip_until <= now())
  and coalesce(c.vip_subscription_id, '') = '';
