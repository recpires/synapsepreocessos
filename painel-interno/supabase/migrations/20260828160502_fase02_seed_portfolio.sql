-- Seed do portfólio real. Os percentuais vêm do CLAUDE.md — são os números
-- que o Rodrigo já mantém à mão. As notas por camada NÃO são semeadas: seriam
-- invenção. Ficam para a primeira avaliação, e até lá a UI usa maturidade_pct.

-- ── Rubrica de maturidade (config, não dado de projeto) ───────────────────
create table if not exists public.maturidade_camadas (
  camada text primary key,
  peso   numeric(4,2) not null,
  ordem  int not null,
  ajuda  text
);
alter table public.maturidade_camadas enable row level security;
drop policy if exists maturidade_camadas_membros on public.maturidade_camadas;
create policy maturidade_camadas_membros on public.maturidade_camadas
  for all to authenticated using (public.e_membro()) with check (public.e_membro());

insert into public.maturidade_camadas (camada, peso, ordem, ajuda) values
  ('Produto & escopo',        1.0, 1, 'Descoberta feita, ICP definido, escopo fechado'),
  ('Backend & dados',         2.0, 2, 'Modelo estável, migrations versionadas, RLS correta'),
  ('Frontend & UX',           2.0, 3, 'Telas completas, responsivo, design system aplicado'),
  ('Integrações',             1.5, 4, 'Pagamento, e-mail, WhatsApp e webhooks em produção'),
  ('Segurança & LGPD',        1.5, 5, 'Sem segredo exposto, RLS auditada, política publicada'),
  ('Testes & QA',             1.0, 6, 'Cobertura do fluxo crítico, regressão passando'),
  ('Deploy & observabilidade',1.0, 7, 'CI verde, rollback possível, erro monitorado')
on conflict (camada) do nothing;

-- ── A própria Synapse ──────────────────────────────────────────────────────
insert into public.empresas (tipo, razao_social, nome_fantasia, segmento, site, responsavel)
values ('propria', 'Synapse Code', 'Synapse Code', 'Software house', 'https://synapsecode.com.br', 'Rodrigo')
on conflict do nothing;

-- ── Produtos próprios ──────────────────────────────────────────────────────
insert into public.produtos (slug, nome, tagline, status, url, ordem) values
  ('nero-barber',    'Nero Barber',    'Plataforma premium para barbearias',            'ativo',  null, 1),
  ('financa-a-dois', 'Finança a Dois', 'Finanças para casais',                          'ativo',  null, 2),
  ('lumia',          'lumIA',          'Atendimento com IA multi-tenant',               'ativo',  'https://lumia-theta-nine.vercel.app', 3),
  ('agentwas',       'AgentWAS',       'Agente de vendas IA para WhatsApp',             'pausado', null, 4),
  ('psi-aura',       'Psi Aura',       'Gestão clínica para psicólogos',                'pausado', null, 5),
  ('kubic-eng',      'Kubic Eng',      'ERP para construtoras',                         'pausado', null, 6),
  ('crm-nexio',      'CRM Nexio',      'CRM próprio da Synapse Code',                   'pausado', null, 7),
  ('arquetipos',     'Arquetipos App', 'Autodescoberta psicológica',                    'pausado', null, 8)
on conflict (slug) do nothing;

-- ── Projetos ───────────────────────────────────────────────────────────────
insert into public.projetos
  (nome, empresa_id, produto_id, tipo, fase_atual, saude, maturidade_pct, responsavel, observacao)
select p.nome,
       (select id from public.empresas where tipo = 'propria' limit 1),
       p.id, 'saas'::public.tipo_projeto, v.fase, v.saude, v.pct, 'Rodrigo', v.nota
from public.produtos p
join (values
  ('nero-barber',    'operacao'::public.fase_projeto,        'verde'::public.saude,    98, 'Referência do portfólio.'),
  ('financa-a-dois', 'homologacao'::public.fase_projeto,     'verde'::public.saude,    92, null),
  ('lumia',          'homologacao'::public.fase_projeto,     'amarelo'::public.saude,  90, 'Pendente: migração de billing Stripe para Asaas e chaves de produção.'),
  ('agentwas',       'desenvolvimento'::public.fase_projeto, 'vermelho'::public.saude, 67, 'Em pausa. Secrets expostos, sem persistência nem testes.'),
  ('psi-aura',       'qa'::public.fase_projeto,              'vermelho'::public.saude, 65, 'Em pausa. 18 issues críticas de segurança.'),
  ('kubic-eng',      'desenvolvimento'::public.fase_projeto, 'amarelo'::public.saude,  45, 'Em pausa. Gaps de compliance de engenharia civil.'),
  ('crm-nexio',      'desenvolvimento'::public.fase_projeto, 'vermelho'::public.saude, 40, 'Em pausa. Bloqueado por auditoria de segurança e testes.'),
  ('arquetipos',     'descoberta'::public.fase_projeto,      'amarelo'::public.saude,  15, 'Em pausa. Escopo e ICP a definir.')
) as v(slug, fase, saude, pct, nota) on v.slug = p.slug
where not exists (select 1 from public.projetos where nome = p.nome);
