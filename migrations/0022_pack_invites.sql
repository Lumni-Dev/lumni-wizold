-- Um convite de matilha: quem convida (from) e quem recebe (to). Aceitar cria os
-- dois lados em pack_mates e apaga a linha; recusar so apaga. Pendente = existe.
-- Nomes sao resolvidos por join em characters, entao nao se guardam aqui.
create table pack_invites (
  id text primary key,
  from_id text not null references characters(id) on delete cascade,
  to_id text not null references characters(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index pack_invites_pair on pack_invites (from_id, to_id);
create index pack_invites_to on pack_invites (to_id);

alter table pack_invites enable row level security;
