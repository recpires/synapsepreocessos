create table if not exists tarefas (
  id          uuid default gen_random_uuid() primary key,
  texto       text not null,
  area        text not null default 'Geral',
  prioridade  int not null default 2,        -- 1=alta 2=media 3=baixa
  status      text not null default 'pendente', -- pendente | concluida
  fonte       text not null default 'manual',   -- manual | pipeline
  ref_id      uuid,                             -- id do lead no pipeline (se fonte=pipeline)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  created_by  text not null
);

alter table tarefas enable row level security;

create policy "tarefas_select" on tarefas
  for select to authenticated using (true);

create policy "tarefas_insert" on tarefas
  for insert to authenticated with check (true);

create policy "tarefas_update" on tarefas
  for update to authenticated using (true) with check (true);

create policy "tarefas_delete" on tarefas
  for delete to authenticated using (true);

-- Index para queries do overview
create index if not exists tarefas_status_prioridade_idx
  on tarefas (status, prioridade, created_at desc);
