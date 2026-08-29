-- Snapshot de segurança antes da reformulação (Fase 01).
-- O schema `backups` NÃO está exposto na API (config expõe só public e
-- graphql_public), então estas cópias não são alcançáveis pelo PostgREST.
create schema if not exists backups;

revoke all on schema backups from anon, authenticated;

create table if not exists backups.despesas_20260828      as select * from public.despesas;
create table if not exists backups.receitas_20260828      as select * from public.receitas;
create table if not exists backups.contratos_20260828     as select * from public.contratos;
create table if not exists backups.documentos_20260828    as select * from public.documentos;
create table if not exists backups.pipeline_leads_20260828 as select * from public.pipeline_leads;
create table if not exists backups.tarefas_20260828       as select * from public.tarefas;

comment on schema backups is
  'Snapshots pre-reformulacao. Nao expostos na API. Conferir antes de apagar.';
