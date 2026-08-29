# Banco — Painel Interno

Projeto Supabase: **Processo Synapse Code** · ref `bdfgmgxajzyjtunetnuw` · região `sa-east-1`

## Regra

Nenhuma alteração de schema fora de `supabase/migrations/`. Sem exceção.

O painel já quebrou uma vez por causa disso: o commit `78e3008` entregou o cancelamento de
assinatura usando a coluna `assinatura_ativa`, mas o SQL ficou solto em `sql/` e nunca foi
aplicado. O botão devolvia erro do Postgres em produção e ninguém percebeu.

## Fluxo

Primeira vez na máquina — o login abre o navegador uma vez só:

```bash
npx supabase login
```

Depois, ligar a pasta ao projeto remoto:

```bash
npx supabase link --project-ref bdfgmgxajzyjtunetnuw
```

Criar uma migration:

```bash
npx supabase migration new nome_em_snake_case
```

Aplicar no remoto:

```bash
npx supabase db push
```

Conferir se o banco e o repositório estão em sincronia:

```bash
npx supabase migration list
```

As colunas `Local` e `Remote` têm que bater linha a linha. Divergência aí é o mesmo tipo de
bug que gerou o E-03.

## Histórico

As 22 migrations até 28/08/2026 foram recuperadas de `supabase_migrations.schema_migrations`
no remoto — elas tinham sido aplicadas ao longo do tempo pela API, sem cópia no git. Os nomes
de arquivo usam a mesma `version` do remoto, então `migration list` reconcilia sem duplicar.

## Divergências conhecidas

O job `estender-despesas-continuas` no `pg_cron` foi criado fora do sistema de migrations —
só o de receitas tem `cron.schedule` numa migration. Os dois estão ativos e rodam como
`postgres` em `0 3 1 * *`. Conferir com:

```sql
select jobid, jobname, schedule, command, active from cron.job order by jobid;
```
