create table if not exists testes_resultados (
  id          uuid default gen_random_uuid() primary key,
  codigo      text not null unique,   -- ex: A1, B3, U2
  resultado   text not null default 'pendente', -- pendente | passou | falhou | estranho
  observacao  text,
  updated_at  timestamptz default now(),
  updated_by  text
);

alter table testes_resultados enable row level security;

create policy "testes_select" on testes_resultados
  for select to authenticated using (true);

create policy "testes_upsert" on testes_resultados
  for insert to authenticated with check (true);

create policy "testes_update" on testes_resultados
  for update to authenticated using (true) with check (true);
