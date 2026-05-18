# Configurar Pipeline — CRM Nexio

_Guia de setup do CRM para o processo comercial da Synapse Code_
_Atualizado em: 2026-05-18_

---

## Estágios do pipeline

Configure exatamente esses estágios no CRM Nexio, nessa ordem:

| # | Estágio | Descrição | Ação esperada |
|---|---------|-----------|---------------|
| 1 | **Novo Lead** | Chegou um contato, ainda não qualificado | Registrar em até 2h |
| 2 | **Qualificando** | Em conversa para entender o perfil | Fazer as 4 perguntas de qualificação |
| 3 | **Reunião Agendada** | Demo ou call marcada | Confirmar 24h antes |
| 4 | **Proposta Enviada** | Proposta enviada, aguardando resposta | Fazer follow-up +1, +3, +7 dias |
| 5 | **Negociação** | Cliente com dúvidas ou pedindo ajuste | Resolver objeções ativamente |
| 6 | **Fechado — Ganho** | Assinou / ativou o trial / pagou sinal | Iniciar onboarding |
| 7 | **Fechado — Perdido** | Não quis avançar | Registrar motivo |
| 8 | **Reativação** | Lead frio para abordar no futuro | Contato a cada 60–90 dias |

---

## Campos obrigatórios por lead

Todo lead cadastrado deve ter:

- **Nome completo**
- **WhatsApp** (principal canal de contato)
- **Empresa / Negócio**
- **Canal de origem** (Instagram, LinkedIn, indicação, Google, prospecção fria)
- **Produto de interesse** (Nero Barber, Psi Aura, CRM Nexio, Kubic Eng, Projeto)
- **Valor estimado** (MRR esperado ou valor do projeto)
- **Data do último contato**
- **Próxima ação** (o que fazer + quando)

---

## Tags para segmentar leads

Use tags para filtrar rapidamente:

| Tag | Uso |
|-----|-----|
| `nero-barber` | Lead para Nero Barber |
| `psi-aura` | Lead para Psi Aura |
| `crm-nexio` | Lead para CRM Nexio |
| `kubic-eng` | Lead para Kubic Eng |
| `projeto` | Projeto sob medida |
| `indicacao` | Veio por indicação |
| `trial-ativo` | Está no trial agora |
| `quente` | Alta probabilidade de fechar |
| `frio` | Sem resposta há mais de 7 dias |

---

## Rotina semanal no CRM (toda segunda-feira, 15 min)

1. Revisar todos os leads em **Proposta Enviada** — alguém precisando de follow-up?
2. Revisar **Negociação** — tem algo travado que precisa de ação?
3. Verificar **Novo Lead** — tem alguém sem qualificação há mais de 24h?
4. Atualizar "próxima ação" de todos os leads ativos
5. Mover para **Reativação** quem não respondeu em 14+ dias

---

## Primeiros leads para cadastrar

Antes de ativar o marketing, registre manualmente:
- Todos os clientes atuais (mover para "Fechado — Ganho")
- Qualquer pessoa que já perguntou sobre os produtos mas não fechou
- Contatos quentes que você tem em mente mas nunca formalizou

Isso já dá uma visão real do pipeline antes mesmo de prospectar.

---

## Métrica mensal do CRM

No dia 1 de cada mês, registrar:

| Métrica | Valor |
|---------|-------|
| Leads novos no mês | |
| Propostas enviadas | |
| Fechamentos (ganhos) | |
| Taxa de conversão (fechados / propostas) | |
| Ticket médio dos fechamentos | |
| Motivo mais comum de perda | |
