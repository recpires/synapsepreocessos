-- Fase 01 · E-06 · Troca `auth.uid() IS NOT NULL` por `e_membro()`.
--
-- Antes: qualquer conta do projeto Supabase lia e escrevia tudo — inclusive
-- uma criada por signup. Agora só quem está em `membros` com ativo = true.
-- Os três membros atuais são 'dono', então o acesso de hoje não muda.
--
-- `service_role` ignora RLS, então o webhook do Asaas segue funcionando.

-- ── despesas ───────────────────────────────────────────────────────────────
drop policy if exists "despesas_apenas_autenticados" on public.despesas;
create policy despesas_membros on public.despesas
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── receitas ───────────────────────────────────────────────────────────────
drop policy if exists "receitas_apenas_autenticados" on public.receitas;
drop policy if exists "receitas_auth_select"         on public.receitas;
create policy receitas_membros on public.receitas
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── contratos ──────────────────────────────────────────────────────────────
drop policy if exists "contratos_apenas_autenticados" on public.contratos;
create policy contratos_membros on public.contratos
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

drop policy if exists "contrato_templates_apenas_autenticados" on public.contrato_templates;
create policy contrato_templates_membros on public.contrato_templates
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── documentos ─────────────────────────────────────────────────────────────
drop policy if exists "documentos_select" on public.documentos;
drop policy if exists "documentos_insert" on public.documentos;
drop policy if exists "documentos_delete" on public.documentos;
create policy documentos_membros on public.documentos
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── pipeline_leads ─────────────────────────────────────────────────────────
drop policy if exists "pipeline_select" on public.pipeline_leads;
drop policy if exists "pipeline_insert" on public.pipeline_leads;
drop policy if exists "pipeline_update" on public.pipeline_leads;
drop policy if exists "pipeline_delete" on public.pipeline_leads;
create policy pipeline_leads_membros on public.pipeline_leads
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── tarefas ────────────────────────────────────────────────────────────────
drop policy if exists "tarefas_select" on public.tarefas;
drop policy if exists "tarefas_insert" on public.tarefas;
drop policy if exists "tarefas_update" on public.tarefas;
drop policy if exists "tarefas_delete" on public.tarefas;
create policy tarefas_membros on public.tarefas
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── testes_resultados ──────────────────────────────────────────────────────
drop policy if exists "testes_select" on public.testes_resultados;
drop policy if exists "testes_upsert" on public.testes_resultados;
drop policy if exists "testes_update" on public.testes_resultados;
create policy testes_resultados_membros on public.testes_resultados
  for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- ── cron_log — só leitura, ninguém escreve pelo painel ─────────────────────
drop policy if exists cron_log_select on public.cron_log;
create policy cron_log_membros on public.cron_log
  for select to authenticated
  using (public.e_membro());
