-- Fase 05 · Tudo que vence, num lugar só.
--
-- Feito como view, não como tabela de alertas materializada: alerta gravado
-- precisa ser sincronizado a cada mudança e desincroniza silenciosamente. A
-- view sempre reflete o estado real das tabelas de origem.

create table if not exists public.alertas_silenciados (
  id             uuid primary key default gen_random_uuid(),
  origem         text not null,
  entidade_id    uuid not null,
  silenciado_ate date,
  motivo         text,
  criado_por     text,
  created_at     timestamptz not null default now(),
  unique (origem, entidade_id)
);

alter table public.alertas_silenciados enable row level security;
drop policy if exists alertas_silenciados_membros on public.alertas_silenciados;
create policy alertas_silenciados_membros on public.alertas_silenciados
  for all to authenticated using (public.e_membro()) with check (public.e_membro());

create or replace view public.vencimentos as
with tudo as (
  -- Contratos com data de vencimento
  select 'contrato'::text as origem, c.id as entidade_id,
         coalesce(e.razao_social, c.cliente) as titulo,
         c.tipo as detalhe, c.data_vencimento as vence_em,
         c.valor, '/contratos'::text as link
  from public.contratos c
  left join public.empresas e on e.id = c.empresa_id
  where c.data_vencimento is not null and c.status <> 'encerrado'

  union all
  -- Domínio de site
  select 'dominio', s.id, s.nome, coalesce(s.registrar, 'Registrador não informado'),
         s.dominio_expira, null, '/sites'
  from public.sites s
  where s.dominio_expira is not null and s.status <> 'encerrado'

  union all
  -- Certificado SSL
  select 'ssl', s.id, s.nome, coalesce(s.hospedagem, 'Hospedagem não informada'),
         s.ssl_expira, null, '/sites'
  from public.sites s
  where s.ssl_expira is not null and s.status <> 'encerrado'

  union all
  -- Impostos em aberto
  select 'imposto', i.id, i.tipo,
         'competência ' || to_char(i.competencia, 'MM/YYYY'),
         i.vencimento, i.valor, '/financeiro/caixa'
  from public.impostos i
  where i.pago_em is null

  union all
  -- Propostas ainda em jogo
  select 'proposta', p.id, p.titulo, 'proposta ' || p.numero,
         p.validade, p.valor_total, '/comercial/propostas'
  from public.propostas p
  where p.validade is not null
    and p.status in ('rascunho','enviada','em_negociacao')

  union all
  -- Prazo de projeto
  select 'projeto', pr.id, pr.nome, 'prazo do projeto',
         pr.prazo, pr.valor_contratado, '/projetos'
  from public.projetos pr
  where pr.prazo is not null and not pr.arquivado
    and pr.fase_atual not in ('operacao','encerrado')
)
select t.origem, t.entidade_id, t.titulo, t.detalhe, t.vence_em, t.valor, t.link,
       (t.vence_em - current_date) as dias,
       case
         when t.vence_em < current_date then 'vencido'
         when t.vence_em <= current_date + 7  then 'critico'
         when t.vence_em <= current_date + 30 then 'atencao'
         else 'ok'
       end as severidade,
       (s.id is not null
        and (s.silenciado_ate is null or s.silenciado_ate >= current_date)) as silenciado
from tudo t
left join public.alertas_silenciados s
  on s.origem = t.origem and s.entidade_id = t.entidade_id;
