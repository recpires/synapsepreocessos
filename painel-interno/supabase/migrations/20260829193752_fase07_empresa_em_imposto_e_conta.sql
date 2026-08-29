-- Fase 07 · A dimensão empresa chega ao resto do financeiro.
--
-- `despesas`, `receitas`, `notas_fiscais` e `dividas` já sabiam de que CNPJ
-- são. Imposto e conta bancária não — e são justamente os dois em que a
-- separação é obrigatória: o DAS é apurado por CNPJ, e o saldo de uma empresa
-- não paga a conta da outra. Somar os dois num caixa só mostra folga que não
-- existe.

alter table public.impostos
  add column if not exists empresa_id uuid references public.empresas(id) on delete set null;

alter table public.contas_bancarias
  add column if not exists empresa_id uuid references public.empresas(id) on delete set null;

create index if not exists idx_impostos_empresa on public.impostos (empresa_id);
create index if not exists idx_contas_empresa on public.contas_bancarias (empresa_id);

-- A view de vencimentos passa a expor `empresa_id`, no fim da lista de colunas:
-- `create or replace view` não deixa inserir coluna no meio. A semântica dessa
-- coluna é corrigida na migration seguinte — aqui ela só passa a existir.
create or replace view public.vencimentos as
with tudo as (
  select 'contrato'::text as origem, c.id as entidade_id,
         coalesce(e.razao_social, c.cliente) as titulo,
         c.tipo as detalhe, c.data_vencimento as vence_em,
         c.valor, '/contratos'::text as link, c.empresa_id
  from public.contratos c
  left join public.empresas e on e.id = c.empresa_id
  where c.data_vencimento is not null and c.status <> 'encerrado'

  union all
  select 'dominio', s.id, s.nome, coalesce(s.registrar, 'Registrador não informado'),
         s.dominio_expira, null, '/sites', s.empresa_id
  from public.sites s
  where s.dominio_expira is not null and s.status <> 'encerrado'

  union all
  select 'ssl', s.id, s.nome, coalesce(s.hospedagem, 'Hospedagem não informada'),
         s.ssl_expira, null, '/sites', s.empresa_id
  from public.sites s
  where s.ssl_expira is not null and s.status <> 'encerrado'

  union all
  select 'imposto', i.id, i.tipo,
         'competência ' || to_char(i.competencia, 'MM/YYYY'),
         i.vencimento, i.valor, '/financeiro/caixa', i.empresa_id
  from public.impostos i
  where i.pago_em is null

  union all
  select 'proposta', p.id, p.titulo, 'proposta ' || p.numero,
         p.validade, p.valor_total, '/comercial/propostas', p.empresa_id
  from public.propostas p
  where p.validade is not null
    and p.status in ('rascunho','enviada','em_negociacao')

  union all
  select 'projeto', pr.id, pr.nome, 'prazo do projeto',
         pr.prazo, pr.valor_contratado, '/projetos', pr.empresa_id
  from public.projetos pr
  where pr.prazo is not null and not pr.arquivado
    and pr.fase_atual not in ('operacao','encerrado')

  union all
  select 'divida', p.id,
         d.credor || ' — parcela ' || p.numero || '/' || d.parcelas_total,
         coalesce(d.descricao, d.tipo),
         p.vencimento, p.valor, '/financeiro/dividas', d.empresa_id
  from public.divida_parcelas p
  join public.dividas d on d.id = p.divida_id
  where p.pago_em is null and d.status = 'ativa'
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
        and (s.silenciado_ate is null or s.silenciado_ate >= current_date)) as silenciado,
       t.empresa_id
from tudo t
left join public.alertas_silenciados s
  on s.origem = t.origem and s.entidade_id = t.entidade_id;
