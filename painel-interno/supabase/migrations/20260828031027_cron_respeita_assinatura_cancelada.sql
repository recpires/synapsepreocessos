-- E-03 (parte 2) · Sem este filtro o cron continua criando meses novos para
-- assinaturas que o painel já cancelou. Uma série só é renovada se NENHUM dos
-- seus lançamentos estiver marcado como cancelado.
CREATE OR REPLACE FUNCTION public.estender_despesas_continuas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          serie_id, parcela_num, parcela_total, internacional, taxa_pct, valor_base)
        VALUES (v_next, v_last.descricao, v_last.categoria, v_last.produto, v_last.forma_pagamento, v_last.condicao,
          v_last.valor, v_last.tipo, true, v_last.periodicidade, v_last.observacao, 'cron',
          v_serie.serie_id, v_num, NULL, v_last.internacional, v_last.taxa_pct, v_last.valor_base);
        v_inseridos := v_inseridos + 1;
      END IF;
      v_next := (v_next + v_passo)::date;
    END LOOP;
  END LOOP;
  INSERT INTO cron_log (job, criados) VALUES ('despesas_continuas', v_inseridos);
  RETURN v_inseridos;
END; $function$;
