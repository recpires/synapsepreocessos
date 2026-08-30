-- Recorrência criava fato, não previsão.
--
-- O cron gera doze meses à frente, e a linha nasce indistinguível de uma
-- despesa que aconteceu. Quando a data chega, ela vira "realizado" sozinha —
-- ninguém confirmou que o dinheiro saiu. Foi assim que três parcelas do Barber
-- Pro criadas de uma vez em 22/06 somaram R$ 7.500 ao resultado quando o
-- pagamento tinha sido um só de R$ 3.000.
--
-- `confirmado` separa os dois estados. Realizado passa a ser
-- `data <= hoje AND confirmado`; o que venceu sem confirmação fica numa fila de
-- pendências em vez de entrar calado no resultado.
alter table public.despesas
  add column if not exists confirmado boolean not null default true;

-- O passado fica como está: já foi contado, e não dá para reverificar agora
-- linha a linha. Só o que ainda não aconteceu nasce como previsão.
update public.despesas set confirmado = false where data > current_date;

-- Índice para a fila de "venceu e ninguém confirmou", que é a consulta nova.
create index if not exists idx_despesas_a_confirmar
  on public.despesas (data) where not confirmado;

-- O gerador passa a marcar o que cria como previsão. É a origem do problema:
-- a linha nascia com a mesma cara de uma despesa paga.
create or replace function public.estender_despesas_continuas()
returns integer language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  v_serie record; v_last record;
  v_horizonte date := (current_date + interval '12 months')::date;
  v_passo interval; v_next date; v_num int; v_inseridos int := 0;
BEGIN
  FOR v_serie IN
    SELECT serie_id FROM despesas
    WHERE serie_id IS NOT NULL AND recorrente = true AND parcela_total IS NULL
    GROUP BY serie_id
    HAVING bool_and(assinatura_ativa)
  LOOP
    SELECT * INTO v_last FROM despesas WHERE serie_id = v_serie.serie_id ORDER BY data DESC LIMIT 1;
    v_passo := CASE coalesce(v_last.periodicidade,'Mensal')
      WHEN 'Anual' THEN interval '1 year' WHEN 'Quinzenal' THEN interval '15 days'
      WHEN 'Semanal' THEN interval '7 days' ELSE interval '1 month' END;
    SELECT coalesce(max(parcela_num),0) INTO v_num FROM despesas WHERE serie_id = v_serie.serie_id;
    v_next := (v_last.data + v_passo)::date;
    WHILE v_next <= v_horizonte LOOP
      IF NOT EXISTS (SELECT 1 FROM despesas WHERE serie_id = v_serie.serie_id AND data = v_next) THEN
        v_num := v_num + 1;
        INSERT INTO despesas (data, descricao, categoria, produto, forma_pagamento, condicao,
          valor, tipo, recorrente, periodicidade, observacao, created_by,
          serie_id, parcela_num, parcela_total, internacional, taxa_pct, valor_base,
          empresa_id, confirmado)
        VALUES (v_next, v_last.descricao, v_last.categoria, v_last.produto, v_last.forma_pagamento, v_last.condicao,
          v_last.valor, v_last.tipo, true, v_last.periodicidade, v_last.observacao, 'cron',
          v_serie.serie_id, v_num, NULL, v_last.internacional, v_last.taxa_pct, v_last.valor_base,
          -- A empresa da série vinha ficando nula na renovação: a linha nova
          -- não herdava o dono e caía no balde "sem empresa".
          v_last.empresa_id, false);
        v_inseridos := v_inseridos + 1;
      END IF;
      v_next := (v_next + v_passo)::date;
    END LOOP;
  END LOOP;
  INSERT INTO cron_log (job, criados) VALUES ('despesas_continuas', v_inseridos);
  RETURN v_inseridos;
END; $function$;
