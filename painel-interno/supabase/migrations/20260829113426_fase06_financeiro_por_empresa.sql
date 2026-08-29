-- Fase 06 · Financeiro por empresa própria.
--
-- Até aqui o financeiro tratava a Synapse como uma coisa só. Com mais de um
-- CNPJ isso não fecha: cada entidade tem seu faturamento, seu teto de regime,
-- suas dívidas e seu resultado. Esta migration dá a dimensão "empresa" ao que
-- já existe e cria o que faltava — nota fiscal e dívida.

-- ── 1. A empresa própria ganha identidade fiscal ────────────────────────────
alter table public.empresas
  add column if not exists regime_tributario text
    check (regime_tributario in ('mei','simples','presumido','real')),
  -- O teto muda por lei. Guardar o número em vez de derivar do regime evita um
  -- valor fixo no código envelhecendo em silêncio até estourar sem aviso.
  add column if not exists teto_faturamento numeric(14,2),
  add column if not exists abertura date;

-- ── 2. Despesa passa a saber de que empresa saiu ────────────────────────────
-- `receitas` já tinha `empresa_id`; `despesas` não. Sem os dois lados não há
-- resultado por CNPJ, só metade dele.
alter table public.despesas
  add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
create index if not exists idx_despesas_empresa on public.despesas (empresa_id);
create index if not exists idx_receitas_empresa on public.receitas (empresa_id);

-- ── 3. Nota fiscal ──────────────────────────────────────────────────────────
-- Faturar e receber são eventos distintos: a NF sai numa competência e o
-- dinheiro cai noutra. Misturar os dois é o que faz o teto do Simples estourar
-- sem ninguém ver. `receita_id` liga os dois quando o pagamento entra.
create table if not exists public.notas_fiscais (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete restrict,
  tomador_id     uuid references public.empresas(id) on delete set null,
  -- Cliente eventual que não vale cadastrar como empresa.
  tomador_nome   text,
  numero         text not null,
  serie          text,
  tipo           text not null default 'servico' check (tipo in ('servico','produto')),
  data_emissao   date not null,
  competencia    date not null,
  valor_servicos numeric(14,2) not null check (valor_servicos >= 0),
  iss            numeric(14,2) not null default 0,
  irrf           numeric(14,2) not null default 0,
  pis            numeric(14,2) not null default 0,
  cofins         numeric(14,2) not null default 0,
  csll           numeric(14,2) not null default 0,
  inss           numeric(14,2) not null default 0,
  -- Sempre coerente com as retenções: calculado, nunca digitado.
  valor_liquido  numeric(14,2) generated always as
                   (valor_servicos - iss - irrf - pis - cofins - csll - inss) stored,
  status         text not null default 'emitida'
                   check (status in ('emitida','cancelada','substituida')),
  receita_id     uuid references public.receitas(id) on delete set null,
  projeto_id     uuid references public.projetos(id) on delete set null,
  arquivo_path   text,
  arquivo_nome   text,
  observacao     text,
  created_at     timestamptz not null default now(),
  created_by     text,
  unique (empresa_id, numero, serie)
);
create index if not exists idx_nf_competencia on public.notas_fiscais (empresa_id, competencia desc);

-- Nota fiscal é emitida por empresa nossa, não por cliente. A regra fica no
-- banco porque validação que mora só na tela some no primeiro script.
create or replace function public.nf_emitente_e_propria() returns trigger
language plpgsql as $$
begin
  if not exists (
    select 1 from public.empresas
    where id = new.empresa_id and tipo = 'propria'
  ) then
    raise exception 'Emitente da NF precisa ser uma empresa própria (empresas.tipo = propria).';
  end if;
  return new;
end $$;

drop trigger if exists trg_nf_emitente on public.notas_fiscais;
create trigger trg_nf_emitente before insert or update of empresa_id on public.notas_fiscais
  for each row execute function public.nf_emitente_e_propria();

-- ── 4. Dívidas ──────────────────────────────────────────────────────────────
-- Empréstimo, financiamento, compra parcelada, imposto parcelado e conta a
-- pagar são a mesma coisa por baixo: um valor devido que se quita em parcelas.
-- Uma tabela só, com o tipo dizendo qual é.
create table if not exists public.dividas (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete restrict,
  tipo             text not null check (tipo in
                     ('emprestimo','financiamento','parcelamento_compra',
                      'parcelamento_imposto','conta_pagar')),
  credor           text not null,
  descricao        text,
  -- Número do contrato, do parcelamento na Receita, da nota do fornecedor.
  documento        text,
  valor_principal  numeric(14,2) not null check (valor_principal >= 0),
  -- Com juros: o que de fato vai sair do caixa até quitar.
  valor_total      numeric(14,2) not null check (valor_total >= 0),
  taxa_juros_mes   numeric(6,3),
  parcelas_total   int not null default 1 check (parcelas_total >= 1),
  data_contratacao date not null,
  status           text not null default 'ativa'
                     check (status in ('ativa','quitada','renegociada','cancelada')),
  anexo_path       text,
  anexo_nome       text,
  observacao       text,
  created_at       timestamptz not null default now(),
  created_by       text
);
create index if not exists idx_dividas_empresa on public.dividas (empresa_id, status);

create table if not exists public.divida_parcelas (
  id          uuid primary key default gen_random_uuid(),
  divida_id   uuid not null references public.dividas(id) on delete cascade,
  numero      int not null,
  vencimento  date not null,
  valor       numeric(14,2) not null check (valor >= 0),
  pago_em     date,
  valor_pago  numeric(14,2),
  -- Pagar a parcela é uma despesa. O vínculo evita lançar o mesmo dinheiro
  -- duas vezes: a dívida é saldo, a despesa é o que saiu.
  despesa_id  uuid references public.despesas(id) on delete set null,
  observacao  text,
  unique (divida_id, numero)
);
create index if not exists idx_parcelas_vencimento on public.divida_parcelas (vencimento)
  where pago_em is null;

-- Saldo devedor sai da soma das parcelas abertas. Gravar o saldo numa coluna
-- seria um número a manter em dia — e a divergir do dia em que ninguém olhou.
create or replace view public.dividas_resumo as
  select d.*,
         e.razao_social as empresa_nome,
         coalesce(sum(p.valor) filter (where p.pago_em is null), 0) as saldo_devedor,
         coalesce(sum(p.valor_pago) filter (where p.pago_em is not null), 0) as total_pago,
         count(p.id) filter (where p.pago_em is null) as parcelas_abertas,
         count(p.id) filter (where p.pago_em is null and p.vencimento < current_date)
           as parcelas_atrasadas,
         min(p.vencimento) filter (where p.pago_em is null) as proximo_vencimento
  from public.dividas d
  join public.empresas e on e.id = d.empresa_id
  left join public.divida_parcelas p on p.divida_id = d.id
  group by d.id, e.razao_social;

-- ── 5. Faturamento e teto do regime ─────────────────────────────────────────
create or replace view public.faturamento_mensal as
  select n.empresa_id, e.razao_social as empresa_nome,
         date_trunc('month', n.competencia)::date as competencia,
         count(*)                       as notas,
         sum(n.valor_servicos)          as bruto,
         sum(n.iss + n.irrf + n.pis + n.cofins + n.csll + n.inss) as retido,
         sum(n.valor_liquido)           as liquido
  from public.notas_fiscais n
  join public.empresas e on e.id = n.empresa_id
  where n.status = 'emitida'
  group by n.empresa_id, e.razao_social, date_trunc('month', n.competencia);

-- Doze meses corridos é a janela que a Receita usa. Comparar com o ano-calendário
-- avisaria tarde demais.
create or replace view public.teto_faturamento as
  select e.id as empresa_id, e.razao_social, e.regime_tributario, e.teto_faturamento,
         coalesce((
           select sum(n.valor_servicos) from public.notas_fiscais n
           where n.empresa_id = e.id and n.status = 'emitida'
             and n.competencia > current_date - interval '12 months'
         ), 0) as faturado_12m,
         case when e.teto_faturamento > 0 then round(coalesce((
           select sum(n.valor_servicos) from public.notas_fiscais n
           where n.empresa_id = e.id and n.status = 'emitida'
             and n.competencia > current_date - interval '12 months'
         ), 0) / e.teto_faturamento * 100, 1) end as uso_pct
  from public.empresas e
  where e.tipo = 'propria';

-- ── 6. Parcela em aberto entra na central de vencimentos ────────────────────
create or replace view public.vencimentos as
with tudo as (
  select 'contrato'::text as origem, c.id as entidade_id,
         coalesce(e.razao_social, c.cliente) as titulo,
         c.tipo as detalhe, c.data_vencimento as vence_em,
         c.valor, '/contratos'::text as link
  from public.contratos c
  left join public.empresas e on e.id = c.empresa_id
  where c.data_vencimento is not null and c.status <> 'encerrado'

  union all
  select 'dominio', s.id, s.nome, coalesce(s.registrar, 'Registrador não informado'),
         s.dominio_expira, null, '/sites'
  from public.sites s
  where s.dominio_expira is not null and s.status <> 'encerrado'

  union all
  select 'ssl', s.id, s.nome, coalesce(s.hospedagem, 'Hospedagem não informada'),
         s.ssl_expira, null, '/sites'
  from public.sites s
  where s.ssl_expira is not null and s.status <> 'encerrado'

  union all
  select 'imposto', i.id, i.tipo,
         'competência ' || to_char(i.competencia, 'MM/YYYY'),
         i.vencimento, i.valor, '/financeiro/caixa'
  from public.impostos i
  where i.pago_em is null

  union all
  select 'proposta', p.id, p.titulo, 'proposta ' || p.numero,
         p.validade, p.valor_total, '/comercial/propostas'
  from public.propostas p
  where p.validade is not null
    and p.status in ('rascunho','enviada','em_negociacao')

  union all
  select 'projeto', pr.id, pr.nome, 'prazo do projeto',
         pr.prazo, pr.valor_contratado, '/projetos'
  from public.projetos pr
  where pr.prazo is not null and not pr.arquivado
    and pr.fase_atual not in ('operacao','encerrado')

  union all
  -- Parcela de dívida em aberto: a única fonte que já nasce com data e valor
  -- certos, e a que mais dói esquecer.
  select 'divida', p.id,
         d.credor || ' — parcela ' || p.numero || '/' || d.parcelas_total,
         coalesce(d.descricao, d.tipo),
         p.vencimento, p.valor, '/financeiro/dividas'
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
        and (s.silenciado_ate is null or s.silenciado_ate >= current_date)) as silenciado
from tudo t
left join public.alertas_silenciados s
  on s.origem = t.origem and s.entidade_id = t.entidade_id;

-- ── 7. RLS ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['notas_fiscais','dividas','divida_parcelas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.e_membro()) with check (public.e_membro())',
      t || '_membros', t
    );
  end loop;
end $$;
