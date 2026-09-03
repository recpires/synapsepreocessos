-- Anotação na tarefa: o que foi feito.
--
-- O título diz o que era para fazer; a anotação diz o que aconteceu. São
-- coisas diferentes, e é a segunda que sobra quando alguém pergunta uma semana
-- depois onde o dia foi parar. Sem ela, a agenda vira uma lista de caixinhas
-- marcadas sem memória nenhuma.
--
-- `default ''` e não nulo: a tela sempre lê a coluna, e null obrigaria um
-- coalesce em cada leitura para não escrever "null" no textarea.

alter table public.agenda_tarefas
  add column if not exists nota text not null default '';

-- `atualizado_em` só nasce agora porque só agora existe algo que se reescreve
-- várias vezes na mesma linha. Marcar feito e anotar são edições que valem
-- data; criar já tem `created_at`.
alter table public.agenda_tarefas
  add column if not exists atualizado_em timestamptz;

create or replace function public.tarefa_carimba_atualizacao()
returns trigger language plpgsql set search_path to '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_agenda_atualizada on public.agenda_tarefas;
create trigger trg_agenda_atualizada
  before update on public.agenda_tarefas
  for each row execute function public.tarefa_carimba_atualizacao();
