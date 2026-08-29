create table if not exists pipeline_leads (
  id                uuid default gen_random_uuid() primary key,
  nome              text not null,
  empresa           text,
  produto           text not null default 'Geral',
  etapa             text not null default 'Prospecção',
  valor_estimado    numeric,
  contato_email     text,
  contato_whatsapp  text,
  proximo_passo     text,
  observacao        text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  created_by        text not null
);

alter table pipeline_leads enable row level security;

create policy "pipeline_select" on pipeline_leads
  for select to authenticated using (true);

create policy "pipeline_insert" on pipeline_leads
  for insert to authenticated with check (true);

create policy "pipeline_update" on pipeline_leads
  for update to authenticated using (true) with check (true);

create policy "pipeline_delete" on pipeline_leads
  for delete to authenticated using (true);
