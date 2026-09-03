-- Central pessoal: agenda do dia a dia e roadmap por frente.
--
-- Área privada de um membro só. Ao contrário do resto do painel — onde o dado
-- é da empresa e todos os membros veem —, aqui cada linha pertence a uma
-- pessoa: a agenda do Rodrigo não é assunto do Wilian.
--
-- Por isso a RLS é por dono, não por empresa. Esconder o item do menu não
-- protege nada: quem souber a URL, ou chamar a API direto, passa. A garantia
-- mora aqui.

-- Quem está pedindo, na tabela de membros. `security definer` porque a própria
-- política precisa ler `membros`, e a RLS dela barraria a leitura no meio da
-- checagem — mesma razão de `e_membro()`.
create or replace function public.membro_id_atual() returns uuid
language sql stable security definer set search_path to '' as $$
  select id from public.membros
   where user_id = (select auth.uid()) and ativo
   limit 1;
$$;

revoke execute on function public.membro_id_atual() from anon, public;
grant  execute on function public.membro_id_atual() to authenticated;

create table if not exists public.agenda_tarefas (
  id         uuid primary key default gen_random_uuid(),
  membro_id  uuid not null references public.membros(id) on delete cascade,
  titulo     text not null check (length(trim(titulo)) > 0),
  frente     text not null check (frente in ('synapse','barbearia','fiap','pessoal')),
  tipo       text not null default 'tarefa' check (tipo in ('tarefa','reuniao')),
  data       date not null,
  -- Sem hora é tarefa do dia, não do relógio: aparece fora da linha do tempo.
  hora       time,
  feito      boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_agenda_membro_data
  on public.agenda_tarefas (membro_id, data);

create table if not exists public.roadmap_itens (
  id         uuid primary key default gen_random_uuid(),
  membro_id  uuid not null references public.membros(id) on delete cascade,
  frente     text not null check (frente in ('synapse','barbearia','fiap','pessoal')),
  nome       text not null check (length(trim(nome)) > 0),
  status     text not null default 'planejado'
             check (status in ('planejado','andamento','pausado','concluido')),
  proximo    text not null default '',
  -- Ordem dentro da frente. Inteiro esparso para reordenar sem reescrever tudo.
  ordem      int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_roadmap_membro_frente
  on public.roadmap_itens (membro_id, frente, ordem);

alter table public.agenda_tarefas enable row level security;
alter table public.roadmap_itens  enable row level security;

-- Dono e mais ninguém. `with check` idêntico ao `using` impede que alguém
-- grave uma linha em nome de outro membro.
drop policy if exists agenda_tarefas_dono on public.agenda_tarefas;
create policy agenda_tarefas_dono on public.agenda_tarefas
  for all to authenticated
  using       (membro_id = public.membro_id_atual())
  with check  (membro_id = public.membro_id_atual());

drop policy if exists roadmap_itens_dono on public.roadmap_itens;
create policy roadmap_itens_dono on public.roadmap_itens
  for all to authenticated
  using       (membro_id = public.membro_id_atual())
  with check  (membro_id = public.membro_id_atual());

-- Fora do log de auditoria de propósito: `atividades` é legível por qualquer
-- membro, e mandar a agenda pessoal para lá desfaria a privacidade que as
-- políticas acima acabaram de estabelecer.
