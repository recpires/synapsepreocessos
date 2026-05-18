# Processo de Desenvolvimento — Synapse Code

_Atualizado em: 2026-05-18_

---

## Contexto

Time pequeno (Rodrigo como dev principal) gerenciando 5 produtos simultâneos. O modelo precisa ser leve, sem cerimônia excessiva, mas com ritmo claro para não travar.

---

## Modelo: Sprint de 2 semanas com foco em 1 produto por vez

A armadilha mais comum com múltiplos produtos é dividir atenção em 5 frentes ao mesmo tempo — o resultado é 5 produtos sem progresso real. A solução é **foco rotativo com janelas fixas**.

### Estrutura da sprint

```
Semana 1 + 2 = Sprint completa (10 dias úteis)
├── Dias 1–8: desenvolvimento (produto foco)
├── Dia 9: revisão + testes
└── Dia 10: deploy + planejamento da próxima sprint
```

### Distribuição de tempo por tipo de trabalho

| Tipo | % do tempo | Descrição |
|------|-----------|-----------|
| Produto foco | 60% | Features e melhorias do SaaS da vez |
| Manutenção geral | 20% | Bugs e suporte dos outros produtos |
| Projetos clientes | 15% | Projetos sob medida em andamento |
| Dívida técnica | 5% | Refatorações, segurança, infra |

---

## Cerimônias (mínimas e práticas)

### Planejamento de sprint (30 min — início de cada sprint)
- Definir produto foco da sprint
- Selecionar 3–5 itens do backlog para entregar
- Estimar em pontos simples: P (1–2h), M (meio dia), G (1–2 dias), XG (3+ dias)
- Nunca colocar mais do que cabe em 8 dias de trabalho

### Review semanal (15 min — toda sexta)
- O que foi entregue?
- O que travou?
- Precisa reajustar alguma prioridade?

### Retrospectiva de sprint (15 min — ao fim de cada sprint)
- O que funcionou bem?
- O que atrapalhou?
- 1 melhoria para aplicar na próxima sprint

---

## Fluxo de uma tarefa

```
IDEIA / BUG REPORTADO
       ↓
Entra no Backlog do produto (TASKS.md ou ferramenta)
       ↓
Priorizado no Planejamento de Sprint
       ↓
Em desenvolvimento → em revisão → testado
       ↓
Deploy (staging → produção)
       ↓
Comunicado ao cliente/time se relevante
```

---

## Definição de "pronto" (Definition of Done)

Uma tarefa só é marcada como concluída quando:
- [ ] Código revisado (mesmo que seja só você — releitura rápida)
- [ ] Testado no ambiente de staging
- [ ] Nenhum erro óbvio no console ou logs
- [ ] Deploy feito em produção
- [ ] Documentado se for algo que o time ou cliente precisa saber

---

## Gestão de bugs urgentes

Todo bug recebido passa pelo filtro:

| Severidade | Critério | Resposta |
|-----------|---------|---------|
| 🔴 Crítico | Sistema fora do ar, dados perdidos, pagamento quebrado | Parar tudo, resolver na hora |
| 🟠 Alto | Feature principal não funciona para usuários ativos | Resolver dentro de 24h |
| 🟡 Médio | Feature secundária com problema | Entra na próxima sprint |
| 🟢 Baixo | Visual, melhoria, sugestão | Acumula no backlog |

---

## Branches e deploy (padrão sugerido)

```
main (produção)
 └── develop (staging)
      └── feature/nome-da-feature
      └── fix/nome-do-bug
      └── chore/nome-da-tarefa
```

- Nunca commitar direto na `main`
- Toda feature passa por `develop` antes de ir pra `main`
- Deploy para produção: só após teste em staging

---

## Ferramentas recomendadas (sem overhead)

| Necessidade | Ferramenta |
|------------|-----------|
| Backlog e tarefas | TASKS.md (este sistema) ou Linear (gratuito para times pequenos) |
| Código e versionamento | GitHub |
| Comunicação interna | WhatsApp (até contratar mais pessoas) |
| Documentação técnica | Notion ou README por repositório |
| Monitoramento | Sentry (erros) + Vercel Analytics (Next.js) |
