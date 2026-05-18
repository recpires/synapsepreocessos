# Controle Financeiro — Synapse Code

_Atualizado em: 2026-05-18_

---

## Modelo de Receita

A Synapse Code opera com dois fluxos:

| Tipo | Fonte | Característica |
|------|-------|---------------|
| **Recorrente (MRR)** | Assinaturas dos SaaS | Previsível, cresce com base de clientes |
| **Pontual** | Projetos sob medida | Variável, depende do pipeline comercial |

O objetivo estratégico é aumentar o percentual de receita recorrente para reduzir dependência de projetos.

---

## Métricas que importam (revisar todo mês)

| Métrica | Descrição | Meta inicial |
|---------|-----------|-------------|
| **MRR** | Receita mensal recorrente total (soma de todos os SaaS) | Mapear atual |
| **MRR por produto** | MRR separado por Nero Barber, Psi Aura, etc. | Mapear atual |
| **Churn** | % de clientes que cancelaram no mês | < 5% |
| **Novos clientes/mês** | Quantos ativaram assinatura | Mapear atual |
| **Ticket médio** | Receita média por cliente | Mapear atual |
| **CAC** | Custo de aquisição por cliente | Mapear após marketing ativo |
| **LTV** | Receita total média por cliente | Mapear após 3 meses |
| **Receita total** | MRR + projetos do mês | Mapear atual |

---

## Custos fixos a mapear

| Categoria | Exemplos |
|-----------|---------|
| Infraestrutura | Vercel, Supabase, AWS, GCP, servidores |
| Ferramentas | GitHub, Figma, ferramentas de IA, analytics |
| Domínios e e-mails | Registro de domínios, Google Workspace |
| Marketing | Tráfego pago (quando ativar), ferramentas |
| Outros | Contador, serviços jurídicos, etc. |

**Ação imediata:** listar todos os serviços com cobrança recorrente e valor mensal. Isso revela o custo mínimo para manter a operação.

---

## Controle mensal (ritual do dia 1)

Todo primeiro dia útil do mês, revisar:

1. **Receita do mês anterior** — MRR + projetos
2. **Custos do mês anterior** — fixos + variáveis
3. **Resultado** — receita − custos = lucro/prejuízo
4. **MRR atual** — cresceu ou caiu?
5. **Churn** — alguém cancelou? Por quê?
6. **Meta do próximo mês** — quanto precisa faturar?

---

## Precificação dos SaaS (referência)

Modelo sugerido por produto:

| Produto | Plano Básico | Plano Pro | Plano Premium |
|---------|-------------|-----------|--------------|
| Nero Barber | R$ 79/mês | R$ 149/mês | R$ 249/mês |
| Psi Aura | R$ 69/mês | R$ 129/mês | R$ 199/mês |
| CRM Nexio | R$ 99/mês | R$ 199/mês | R$ 349/mês |
| Kubic Eng | R$ 149/mês | R$ 299/mês | R$ 499/mês |

> Valores de referência — ajustar conforme validação com clientes e concorrentes.

**Oferecer trial de 14 dias** em todos os SaaS para reduzir fricção de entrada.

---

## Regras financeiras básicas

1. **Separe pessoa física de pessoa jurídica** — pró-labore fixo, não retire ad hoc
2. **Reserva de emergência:** manter pelo menos 3 meses de custos fixos em caixa
3. **Reinvestimento:** definir % da receita que vai para crescimento (marketing, time)
4. **Acompanhe o MRR semanalmente** — é o sinal vital da empresa
5. **Nunca precifique por hora** nos SaaS — precifique por valor entregue

---

## Próximas ações financeiras

- [ ] Mapear MRR atual de cada SaaS
- [ ] Listar todos os custos fixos mensais
- [ ] Definir pró-labore mensal fixo
- [ ] Validar tabela de preços dos SaaS com clientes atuais
- [ ] Contratar contador (se ainda não tiver) — MEI não suporta SaaS com múltiplos clientes
