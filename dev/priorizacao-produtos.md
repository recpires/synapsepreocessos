# Priorização de Produtos — Synapse Code

_Como decidir em qual produto focar a cada sprint_
_Atualizado em: 2026-05-18_

---

## O problema

Com 5 produtos simultâneos e time pequeno, a pergunta mais importante é: **em qual produto eu trabalho agora?**

A resposta muda a cada sprint dependendo de 3 fatores: receita, tração e urgência técnica.

---

## Matriz de Prioridade

Avalie cada produto nos 3 critérios abaixo (nota 1–5) e some:

| Critério | Peso | Pergunta |
|---------|------|---------|
| **Receita / potencial** | 40% | Tem clientes pagando ou leads quentes esperando? |
| **Tração** | 35% | Tem usuários ativos, feedbacks, demanda real? |
| **Urgência técnica** | 25% | Tem bug crítico, débito que trava o produto, ou cliente esperando feature? |

**Fórmula:** `(Receita × 0,4) + (Tração × 0,35) + (Urgência × 0,25)`

---

## Avaliação atual (2026-05-18)

| Produto | Receita | Tração | Urgência | Score | Foco |
|---------|---------|--------|----------|-------|------|
| **Nero Barber** | 4 | 5 | 3 | **4,1** | 🥇 Sprint 1 |
| **Psi Aura** | 3 | 3 | 4 | **3,25** | 🥈 Sprint 2 |
| **CRM Nexio** | 2 | 2 | 4 | **2,8** | 🥉 Sprint 3 |
| **Kubic Eng** | 2 | 3 | 3 | **2,6** | Sprint 4 |
| **Arquetipos App** | 1 | 1 | 4 | **2,0** | Sprint 5 |

> **Reavalie a cada mês** — um cliente novo ou um bug crítico muda a ordem.

---

## Rotação sugerida (próximas 10 semanas)

| Sprint | Produto foco | Objetivo principal |
|--------|-------------|-------------------|
| Sprint 1 (mai) | **Nero Barber** | Estabilizar, preparar para marketing ativo |
| Sprint 2 (jun) | **Psi Aura** | Features essenciais + corrigir débito técnico |
| Sprint 3 (jun) | **CRM Nexio** | Avançar MVP para uso interno + primeiros clientes |
| Sprint 4 (jul) | **Kubic Eng** | Features core + validar com 2–3 clientes piloto |
| Sprint 5 (jul) | **Arquetipos App** | Definir escopo e entregar MVP |

---

## Regra de ouro: 60/20/20

Em qualquer sprint, distribua assim:
- **60%** no produto foco da sprint
- **20%** em manutenção dos outros produtos (só bugs importantes)
- **20%** em projetos de clientes ou infra

Se um projeto de cliente tomar mais de 30% do tempo, é sinal de que precisa de um escopo mais claro ou um prazo renegociado.

---

## Como lidar com "tudo é urgente"

Quando tudo parece urgente ao mesmo tempo:

1. Escreva tudo que está na cabeça numa lista
2. Para cada item, pergunte: "Se eu não fizer isso hoje, alguém perde dinheiro ou o sistema quebra?"
3. O que ficou com "sim" vira prioridade imediata. O resto volta para o backlog
4. Nunca mais de 3 prioridades imediatas ao mesmo tempo

---

## Quando parar tudo e mudar o foco

Situações que justificam mudar o produto foco no meio de uma sprint:

- Sistema de produção fora do ar (qualquer produto)
- Cliente chave ameaçando cancelar por causa de bug
- Oportunidade de venda grande que depende de uma feature específica

Em todos os outros casos: **concluir a sprint atual antes de mudar**.
