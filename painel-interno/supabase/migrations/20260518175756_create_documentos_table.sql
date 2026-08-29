create table if not exists documentos (
  id          uuid default gen_random_uuid() primary key,
  nome        text not null,
  descricao   text,
  categoria   text not null default 'Interno',
  arquivo_url  text,
  arquivo_nome text,
  arquivo_tipo text,
  tamanho_bytes bigint,
  created_at  timestamptz default now(),
  created_by  text not null
);

alter table documentos enable row level security;

create policy "documentos_select" on documentos
  for select to authenticated using (true);

create policy "documentos_insert" on documentos
  for insert to authenticated with check (true);

create policy "documentos_delete" on documentos
  for delete to authenticated using (true);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('documentos-files', 'documentos-files', true)
on conflict (id) do nothing;

create policy "documentos_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos-files');

create policy "documentos_read" on storage.objects
  for select using (bucket_id = 'documentos-files');

create policy "documentos_delete_storage" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos-files');
