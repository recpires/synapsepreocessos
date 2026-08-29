-- O resumo é regravado por upsert toda vez que o cron roda na mesma semana,
-- mas `created_at` marca só a primeira geração. Sem isso não dá para saber se
-- o que está na tela reflete os dados de agora ou de três dias atrás.
alter table public.resumos
  add column if not exists atualizado_em timestamptz not null default now();

-- Linhas antigas: o melhor carimbo disponível é a própria criação.
update public.resumos set atualizado_em = created_at where atualizado_em < created_at;
