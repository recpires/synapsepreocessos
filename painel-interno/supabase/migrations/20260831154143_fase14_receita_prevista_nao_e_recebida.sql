-- A recorrência de receita tinha os mesmos defeitos da de despesa, e piores.
--
-- O cron gerava doze meses à frente com `status = 'confirmado'` — o mesmo
-- status que a Fase 06 usa para contar dinheiro como recebido. Bastava a data
-- chegar para faturamento inexistente entrar no resultado. Do lado da despesa
-- isso já custou R$ 4.500 do Barber Pro; do lado da receita é pior, porque
-- número inflado ali parece sucesso, não erro.
--
-- Faltavam ainda duas coisas: a linha nova não herdava `empresa_id`, caindo no
-- balde "sem empresa" que todo usuário restrito enxerga; e não havia como parar
-- a série, porque `receitas` não tinha o `assinatura_ativa` que despesa tem.

alter table public.receitas
  add column if not exists confirmado boolean not null default true,
  -- false = contrato encerrado; o cron para de estender.
  add column if not exists assinatura_ativa boolean not null default true;

-- Mesmo corte da despesa: o passado fica como está, o futuro nasce previsão.
update public.receitas set confirmado = false where data > current_date;

create index if not exists idx_receitas_a_confirmar
  on public.receitas (data) where not confirmado;

create or replace function public.estender_receitas_continuas()
returns integer language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  v_serie record; v_last record;
  v_horizonte date := (current_date + interval '12 months')::date;
  v_passo interval; v_next date; v_num int; v_inseridos int := 0;
BEGIN
  FOR v_serie IN
    SELECT serie_id FROM receitas
    WHERE serie_id IS NOT NULL AND recorrente = true AND parcela_total IS NULL
    GROUP BY serie_id
    -- Série cancelada para de crescer. Sem isto não havia como encerrar um
    -- contrato: o cron ressuscitava os meses seguintes toda semana.
    HAVING bool_and(assinatura_ativa)
  LOOP
    SELECT * INTO v_last FROM receitas WHERE serie_id = v_serie.serie_id ORDER BY data DESC LIMIT 1;
    v_passo := CASE coalesce(v_last.periodicidade,'Mensal')
      WHEN 'Anual' THEN interval '1 year' WHEN 'Quinzenal' THEN interval '15 days'
      WHEN 'Semanal' THEN interval '7 days' ELSE interval '1 month' END;
    SELECT coalesce(max(parcela_num),0) INTO v_num FROM receitas WHERE serie_id = v_serie.serie_id;
    v_next := (v_last.data + v_passo)::date;
    WHILE v_next <= v_horizonte LOOP
      IF NOT EXISTS (SELECT 1 FROM receitas WHERE serie_id = v_serie.serie_id AND data = v_next) THEN
        v_num := v_num + 1;
        INSERT INTO receitas (data, descricao, categoria, produto, cliente, valor, tipo, forma_pagamento,
          status, origem, observacao, created_by, recorrente, periodicidade, serie_id,
          parcela_num, parcela_total, empresa_id, confirmado, assinatura_ativa)
        VALUES (v_next, v_last.descricao, v_last.categoria, v_last.produto, v_last.cliente,
          v_last.valor, v_last.tipo, v_last.forma_pagamento,
          'confirmado', 'manual', v_last.observacao, 'cron', true, v_last.periodicidade,
          v_serie.serie_id, v_num, NULL,
          -- Herda o CNPJ da série e nasce como previsão, não como recebimento.
          v_last.empresa_id, false, true);
        v_inseridos := v_inseridos + 1;
      END IF;
      v_next := (v_next + v_passo)::date;
    END LOOP;
  END LOOP;
  INSERT INTO cron_log (job, criados) VALUES ('receitas_continuas', v_inseridos);
  RETURN v_inseridos;
END; $function$;
