-- Conhecimento importado dos Markdown da raiz do repositório.
-- Gerado por scripts/importar-conhecimento.mjs — não edite à mão.
--
-- ON CONFLICT DO NOTHING: rodar de novo não sobrescreve o que já foi editado
-- pela tela.

insert into public.conhecimento (area, titulo, slug, conteudo_md, origem) values
  ('Comercial', 'Configurar Pipeline — CRM Nexio', 'comercial-configurar-crm-nexio', $md$# Configurar Pipeline — CRM Nexio

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
| Motivo mais comum de perda | |$md$, 'comercial/configurar-crm-nexio.md'),
  ('Comercial', 'ICP por Produto — Synapse Code', 'comercial-icp-por-produto', $md$# ICP por Produto — Synapse Code

_Ideal Customer Profile — quem é o cliente certo para cada solução_

_Atualizado em: 2026-05-18_

---

## Nero Barber

**Cliente ideal:**
- Barbeiro ou dono de barbearia com 1 a 3 cadeiras
- Faz agendamento pelo WhatsApp ou de cabeça (sem sistema)
- Tem entre 20 e 80 atendimentos por semana
- Quer parecer mais profissional e parar de perder horário

**Dores principais:**
- Esquece agendamentos, cliente chega e não tem horário livre
- Não controla quanto faturou no mês
- Fica refém do WhatsApp para tudo

**Gatilho de compra:** "Perdi cliente porque esqueci o horário" ou "Quero abrir mais uma unidade"

**Canal de prospecção:** Instagram (busca por perfis de barbearia), grupos de barbeiros no WhatsApp, Google Maps

---

## Psi Aura

**Cliente ideal:**
- Psicólogo autônomo ou em início de consultório próprio
- Atende 10–30 pacientes por semana
- Usa caderno, Google Agenda ou planilha para organizar
- Quer separar vida pessoal do consultório e ter mais controle

**Dores principais:**
- Dificuldade de controlar pagamentos e inadimplência
- Sem histórico organizado de sessões por paciente
- Agenda confusa, misturada com compromissos pessoais

**Gatilho de compra:** "Preciso de prontuário digital" ou "Tô começando o consultório e quero fazer direito"

**Canal de prospecção:** Instagram (psicólogos CRP), grupos de psicólogos no Facebook/Telegram, LinkedIn

---

## CRM Nexio

**Cliente ideal:**
- Pequenas empresas com time comercial de 1 a 5 pessoas
- Hoje usam planilha Excel ou nada para controlar leads
- Faturam entre R$10k e R$100k/mês
- Setor: serviços, tech, agências, software houses

**Dores principais:**
- Perde leads por falta de follow-up
- Não sabe em que estágio está cada negociação
- Não consegue medir a taxa de conversão do time

**Gatilho de compra:** "Estamos crescendo e a planilha não aguenta mais"

**Canal de prospecção:** LinkedIn (diretores comerciais, sócios de pequenas empresas), contato frio direto

---

## Kubic Eng

**Cliente ideal:**
- Engenheiro civil autônomo ou pequena construtora (até 20 funcionários)
- Gerencia obras com papel, WhatsApp e planilha
- Faz entre 2 e 10 obras simultâneas por ano

**Dores principais:**
- Controle de custo de obra manual e impreciso
- Comunicação com equipe desorganizada
- Sem visibilidade de cronograma em tempo real

**Gatilho de compra:** "Tivemos prejuízo numa obra por falta de controle" ou "Quero crescer mas não consigo gerenciar tudo"

**Canal de prospecção:** LinkedIn (engenheiros e arquitetos), grupos de construção civil, associações de engenharia

---

## Projetos sob medida (Agentes IA, Sistemas, LPs)

**Cliente ideal:**
- Empresas com problema específico que nenhum SaaS resolve
- Ou empresas que querem automatizar atendimento via WhatsApp
- Ticket médio: R$3.000 a R$30.000

**Dores principais:**
- Equipe sobrecarregada com atendimento repetitivo
- Processo interno manual que poderia ser automatizado
- Site/LP desatualizado que não converte

**Gatilho de compra:** "Preciso de algo que não existe pronto no mercado"

**Canal de prospecção:** indicação de clientes atuais, LinkedIn, contato frio direto

---

## Resumo — Canais Prioritários por Produto

| Produto | Canal #1 | Canal #2 |
|---------|----------|----------|
| Nero Barber | Instagram (barbearias) | Google Maps |
| Psi Aura | Instagram (psicólogos) | Grupos Facebook/Telegram |
| CRM Nexio | LinkedIn | Contato frio direto |
| Kubic Eng | LinkedIn | Grupos construção civil |
| Projetos | Indicação | LinkedIn |$md$, 'comercial/icp-por-produto.md'),
  ('Comercial', 'Precificação dos SaaS — Synapse Code', 'comercial-precificacao-saas', $md$# Precificação dos SaaS — Synapse Code

_Atualizado em: 2026-05-18_

---

## Princípios de precificação

1. **Precifique por valor, não por hora** — o cliente paga pelo problema resolvido, não pelo tempo gasto
2. **Sempre 3 planos** — o do meio é o que você quer vender (efeito ancoragem)
3. **Trial de 14 dias em todos** — reduz fricção de entrada sem custar receita
4. **Reajuste anual** — IPCA ou 10%, comunicado com 30 dias de antecedência
5. **Sem plano gratuito permanente** — devalua o produto e atrai o público errado

---

## 💈 Nero Barber

**Público:** donos de barbearia 1–5 cadeiras

| | Starter | Pro ⭐ | Premium |
|---|---|---|---|
| **Preço/mês** | R$ 79 | R$ 149 | R$ 249 |
| **Preço/ano** | R$ 790 (2 meses grátis) | R$ 1.490 | R$ 2.490 |
| Profissionais | 1 | até 3 | ilimitado |
| Agendamentos/mês | ilimitado | ilimitado | ilimitado |
| App para o cliente | ✅ | ✅ | ✅ |
| Notificações WhatsApp | ❌ | ✅ | ✅ |
| Relatório financeiro | básico | completo | completo |
| Multi-unidade | ❌ | ❌ | ✅ |
| Suporte | e-mail | WhatsApp | WhatsApp prioritário |

**Por que funciona:** Starter cobre o barbeiro solo. Pro é o ponto-chave (3 cadeiras = o modelo mais comum). Premium fecha quem quer crescer para múltiplas unidades.

**Trial:** 14 dias no Pro, sem cartão.

---

## 🧠 Psi Aura

**Público:** psicólogos autônomos e pequenos consultórios

| | Essencial | Clínico ⭐ | Consultório |
|---|---|---|---|
| **Preço/mês** | R$ 69 | R$ 129 | R$ 219 |
| **Preço/ano** | R$ 690 | R$ 1.290 | R$ 2.190 |
| Pacientes ativos | até 20 | até 60 | ilimitado |
| Prontuário digital | básico | completo | completo |
| Controle de pagamentos | ❌ | ✅ | ✅ |
| Agendamento online | ✅ | ✅ | ✅ |
| Múltiplos profissionais | ❌ | ❌ | até 5 |
| LGPD / criptografia | ✅ | ✅ | ✅ |
| Suporte | e-mail | WhatsApp | WhatsApp prioritário |

**Por que funciona:** Psicólogo em início de carreira entra no Essencial. Quem tem consultório consolidado (20+ pacientes) vai pro Clínico. Quem tem sócios ou contrata outros psicólogos vai pro Consultório.

**Trial:** 14 dias no Clínico, sem cartão.

---

## 📊 CRM Nexio

**Público:** times comerciais de 1–10 pessoas (agências, software houses, serviços B2B)

| | Solo | Time ⭐ | Empresa |
|---|---|---|---|
| **Preço/mês** | R$ 79 | R$ 189 | R$ 349 |
| **Preço/ano** | R$ 790 | R$ 1.890 | R$ 3.490 |
| Usuários | 1 | até 5 | até 15 |
| Negociações ativas | até 50 | ilimitado | ilimitado |
| Automação de follow-up | ❌ | ✅ | ✅ |
| Integração WhatsApp | ❌ | ✅ | ✅ |
| Relatórios de funil | básico | completo | completo + exportação |
| API de integração | ❌ | ❌ | ✅ |
| Suporte | e-mail | WhatsApp | conta dedicada |

**Por que funciona:** Solo serve para o Rodrigo e Wilian usarem agora na Synapse Code (dogfood). Time é o produto para vender para clientes. Empresa fecha tickets maiores.

**Trial:** 14 dias no Time, sem cartão.

---

## 🏗️ Kubic Eng

**Público:** engenheiros autônomos e pequenas construtoras

| | Obra | Construtora ⭐ | Enterprise |
|---|---|---|---|
| **Preço/mês** | R$ 129 | R$ 279 | R$ 499 |
| **Preço/ano** | R$ 1.290 | R$ 2.790 | R$ 4.990 |
| Obras simultâneas | até 3 | até 10 | ilimitado |
| Usuários | 1 | até 5 | ilimitado |
| Controle de custos | básico | completo | completo |
| Cronograma Gantt | ❌ | ✅ | ✅ |
| Gestão de equipe | ❌ | ✅ | ✅ |
| Relatório para cliente | ❌ | ✅ | ✅ |
| Integração com fornecedores | ❌ | ❌ | ✅ |
| Suporte | e-mail | WhatsApp | conta dedicada |

**Por que funciona:** Ticket maior justificado pelo setor (construção = dinheiro grande). Obra serve para validar. Construtora é o produto real. Enterprise para empresas maiores.

**Trial:** 14 dias no Construtora, sem cartão.

---

## Regras comerciais para todos os planos

- **Trial de 14 dias** sem cartão de crédito em todos os produtos (plano do meio)
- **Desconto anual:** equivale a 2 meses grátis (aprox. 17% de desconto)
- **Desconto para indicação:** 1 mês grátis para quem indicar um cliente que fechar
- **Desconto para volume:** negociar caso a caso para planos Enterprise com múltiplas unidades
- **Sem desconto no plano mensal** — desvaloriza o produto; desconto só no anual

---

## Argumento de valor por produto

| Produto | Argumento central |
|---------|------------------|
| Nero Barber | "1 horário recuperado por dia = o sistema se paga" |
| Psi Aura | "1 paciente inadimplente a menos por mês = o sistema se paga" |
| CRM Nexio | "1 negociação fechada a mais por mês = o sistema se paga" |
| Kubic Eng | "1% de desperdício evitado numa obra = o sistema se paga" |

Use esses argumentos **sempre** quando o cliente disser que o preço é caro.

---

## Próximos passos

- [ ] Validar esses valores com 3 clientes atuais (pergunta direta: "você pagaria X pelo que usa?")
- [ ] Criar página de preços para cada SaaS no site
- [ ] Configurar os planos nas ferramentas de pagamento (Stripe, Asaas ou similar)
- [ ] Treinar Wilian com os argumentos de valor acima$md$, 'comercial/precificacao-saas.md'),
  ('Comercial', 'Processo de Vendas — Synapse Code', 'comercial-processo-de-vendas', $md$# Processo de Vendas — Synapse Code

_Atualizado em: 2026-05-18_

---

## Visão Geral

A Synapse Code vende dois tipos de solução:
- **SaaS** (Nero Barber, Psi Aura, CRM Nexio, Kubic Eng) — receita recorrente
- **Projetos sob medida** (sistemas, agentes IA, landing pages) — receita pontual

O fluxo de vendas é o mesmo para ambos, com variações na etapa de proposta.

---

## Funil Comercial

```
LEAD → QUALIFICAÇÃO → APRESENTAÇÃO → PROPOSTA → FOLLOW-UP → FECHAMENTO → ONBOARDING
```

---

### Etapa 1 — Geração de Lead

**Canais ativos:**
- Contato frio direto (WhatsApp, Instagram DM, LinkedIn)
- Google / SEO (visitante orgânico entra em contato)

**Ação imediata ao receber um lead:**
1. Responder em até **2 horas** no horário comercial
2. Registrar no CRM Nexio: nome, canal de origem, produto de interesse
3. Mover para "Qualificação"

---

### Etapa 2 — Qualificação (5–10 min)

**Objetivo:** descobrir se vale a pena avançar.

Perguntas obrigatórias:
- "Qual é o seu negócio / segmento?"
- "O que você precisa resolver agora?"
- "Você já usa algum sistema hoje?"
- "Qual é o prazo que você tem em mente?"

**Resultado:**
- ✅ Qualificado → agendar apresentação
- ❌ Não qualificado → registrar motivo no CRM e arquivar

---

### Etapa 3 — Apresentação (30–45 min)

**Para SaaS:** demonstração ao vivo do produto (Nero Barber, Psi Aura, etc.)
**Para projetos:** conversa de descoberta — entender o problema em profundidade

**Checklist da apresentação:**
- [ ] Mostrar o produto / solução focado no problema do cliente
- [ ] Levantar objeções durante a call, não depois
- [ ] Perguntar: "Isso resolve o que você precisa?"
- [ ] Definir próximo passo antes de desligar a call

---

### Etapa 4 — Proposta

**Tempo máximo para enviar:** 24 horas após a apresentação.

**Estrutura da proposta (SaaS):**
1. Problema identificado
2. Solução (plano recomendado + features)
3. Investimento (planos e valores)
4. Próximos passos (trial ou ativação)

**Estrutura da proposta (Projeto sob medida):**
1. Entendimento do projeto
2. Escopo de entrega
3. Prazo estimado
4. Investimento total + forma de pagamento
5. O que está fora do escopo
6. Próximos passos

---

### Etapa 5 — Follow-up

Sequência padrão após envio da proposta:

| Dia | Ação |
|-----|------|
| +1 | WhatsApp: "Conseguiu ver a proposta? Alguma dúvida?" |
| +3 | WhatsApp: "Quero entender se faz sentido pra você, posso te ligar?" |
| +7 | Última tentativa: "Vou deixar a proposta aberta por mais alguns dias. Se quiser conversar, é só falar." |
| +14 | Arquivar como "Sem resposta" no CRM, adicionar ao fluxo de reativação futura |

---

### Etapa 6 — Fechamento

**Para SaaS:**
- Ativar conta / trial
- Enviar link de pagamento (assinatura)
- Mover para "Cliente Ativo" no CRM

**Para projeto:**
- Enviar contrato
- Receber sinal de entrada (% do valor total)
- Criar projeto no sistema interno
- Mover para "Em execução" no CRM

---

### Etapa 7 — Onboarding

**SaaS:** enviar sequência de boas-vindas (e-mail ou WhatsApp) com:
- Link de acesso
- Tutorial em vídeo ou doc de primeiros passos
- Contato direto para suporte

**Projeto:** alinhar kickoff, definir cronograma e canal de comunicação com o cliente.

---

## Estágios do CRM Nexio

Configure os seguintes estágios no pipeline:

```
Novo Lead → Qualificando → Apresentação Agendada → Proposta Enviada → Negociação → Fechado (ganho) → Fechado (perdido) → Cliente Ativo
```

**Campos obrigatórios por lead:**
- Nome e empresa
- Canal de origem
- Produto de interesse (SaaS ou projeto)
- Valor estimado
- Data de último contato
- Próxima ação

---

## Regras de Ouro

1. **Todo lead entra no CRM** — sem exceção.
2. **Proposta em 24h** — quem demora perde.
3. **Follow-up ativo** — a maioria das vendas fecha no 2º ou 3º contato.
4. **Não adivinhe — pergunte** — levante objeções na call, não depois.
5. **Meça** — todo mês revisar: quantos leads, quantas propostas, quantos fechamentos.$md$, 'comercial/processo-de-vendas.md'),
  ('Comercial', 'Scripts de Prospecção Fria — Synapse Code', 'comercial-script-prospeccao-frio', $md$# Scripts de Prospecção Fria — Synapse Code

_Atualizado em: 2026-05-18_

---

## Regras gerais

- Mensagem curta — máximo 3 linhas no primeiro contato
- Personalizar o nome e o negócio do prospecto
- Foco no problema deles, não no produto
- Sempre terminar com uma pergunta ou CTA claro
- Não mandar áudio sem permissão no primeiro contato

---

## Nero Barber — Instagram / WhatsApp

**1º contato (DM ou WhatsApp):**
> Oi [Nome], vi a sua barbearia no Instagram e achei o trabalho top.
> Tenho um sistema de agendamento online criado especialmente pra barbearias — os clientes agendam direto pelo celular, sem precisar falar pelo WhatsApp.
> Faz sentido te mostrar em 10 minutos como funciona?

---

## Psi Aura — Instagram / DM

**1º contato:**
> Oi [Nome], vi seu perfil aqui no Instagram.
> Desenvolvemos um sistema de gestão para psicólogos — agenda, prontuário digital e controle de pagamentos num lugar só.
> Você usa algum sistema hoje ou ainda é no papel/planilha?

---

## CRM Nexio — LinkedIn / WhatsApp

**1º contato (LinkedIn InMail):**
> Oi [Nome], vi que você cuida do comercial na [Empresa].
> A maioria dos times que falo usam planilha pra controlar leads e acabam perdendo negociações por falta de follow-up.
> Desenvolvemos um CRM simples, feito pra times pequenos.
> Faz sentido trocarmos 15 minutos pra ver se resolve o que vocês precisam?

---

## Kubic Eng — LinkedIn / WhatsApp

**1º contato:**
> Oi [Nome], vi que você é engenheiro / atua em obras.
> Desenvolvemos um sistema de gestão de obras — cronograma, custos e equipe num lugar só, sem planilha.
> Você topa ver uma demonstração rápida?

---

## Agentes IA — LinkedIn / Indicação

**1º contato:**
> Oi [Nome], trabalho com automação de atendimento via WhatsApp usando IA.
> Basicamente, o agente responde clientes 24h, faz triagem e agenda — sem precisar de atendente humano pra tudo.
> Faz sentido te mostrar um exemplo funcionando?

---

## Sequência de follow-up após silêncio

Se não houve resposta em 3 dias:
> [Nome], só passando pra ver se você recebeu minha mensagem anterior.
> Se não for o momento certo, tudo bem — é só me falar!

Se não houve resposta após mais 4 dias:
> [Nome], última mensagem da minha parte.
> Se em algum momento fizer sentido conversar sobre [problema específico], estarei por aqui.

---

## O que NÃO fazer

- ❌ Mandar proposta sem ter falado antes
- ❌ Copiar e colar o mesmo texto sem personalizar
- ❌ Perguntar "posso te apresentar nossa empresa?" — direto ao problema
- ❌ Pressionar após duas tentativas sem resposta$md$, 'comercial/script-prospeccao-frio.md'),
  ('Comercial', 'Template de Proposta Comercial — Synapse Code', 'comercial-template-proposta', $md$# Template de Proposta Comercial — Synapse Code

_Use este template em até 24h após a reunião com o lead_
_Adapte os campos entre [colchetes] para cada cliente_

---

## PROPOSTA — SaaS (Nero Barber / Psi Aura / CRM Nexio / Kubic Eng)

---

**Para:** [Nome do lead]
**De:** Synapse Code — [Rodrigo / Wilian]
**Data:** [data]
**Válida até:** [data + 5 dias úteis]

---

### O que entendemos do seu negócio

[2–3 frases resumindo o problema específico do cliente, usando as palavras dele]

Exemplo: *"Você atende em média 40 clientes por semana e ainda agenda tudo pelo WhatsApp. Isso gera confusão de horários, clientes sem confirmação e faturamento sem controle."*

---

### O que propomos

**[Nome do produto]** — plano **[Plano recomendado]**

[Descrever em 2–3 linhas como o produto resolve especificamente o problema identificado]

**Principais funcionalidades incluídas:**
- [Feature 1 relevante para esse cliente]
- [Feature 2 relevante para esse cliente]
- [Feature 3 relevante para esse cliente]

---

### Investimento

| | [Plano recomendado] |
|---|---|
| **Mensalidade** | R$ [valor]/mês |
| **Plano anual** | R$ [valor]/ano (equivale a 2 meses grátis) |
| **Trial gratuito** | 14 dias sem cartão |

> Recomendamos começar pelo trial de 14 dias para você testar com seus clientes reais antes de qualquer compromisso.

---

### Como começar

1. Confirma o interesse respondendo essa mensagem ou me ligando
2. Ativamos seu trial em menos de 5 minutos
3. Faço uma sessão de onboarding de 30 min para configurar tudo junto
4. Você começa a usar hoje mesmo

---

### Perguntas frequentes

**"Preciso migrar meus dados?"**
Sim, e a gente ajuda. Importamos sua agenda e clientes existentes no onboarding.

**"E se eu não gostar?"**
Trial de 14 dias sem compromisso. Se não resolver, nada é cobrado.

**"Tem contrato de fidelidade?"**
Não. Plano mensal cancela quando quiser. Plano anual tem desconto maior mas não é obrigatório.

---

**[Assinatura]**
[Nome] — Synapse Code
[WhatsApp] | [e-mail]

---
---

## PROPOSTA — Projeto Sob Medida

---

**Para:** [Nome do cliente]
**De:** Synapse Code — [Rodrigo / Wilian]
**Data:** [data]
**Válida até:** [data + 7 dias úteis]

---

### Entendimento do projeto

[3–5 frases descrevendo o problema, o objetivo e o contexto do cliente]

---

### Escopo de entrega

**O que está incluído:**
- [Entregável 1]
- [Entregável 2]
- [Entregável 3]

**O que NÃO está incluído neste escopo:**
- [Item fora do escopo 1]
- [Item fora do escopo 2]

> Qualquer funcionalidade não listada acima será tratada como novo escopo e orçada separadamente.

---

### Prazo

| Fase | Entrega |
|------|---------|
| [Fase 1] | [X dias após início] |
| [Fase 2] | [X dias após fase 1] |
| Entrega final | [Data estimada] |

O prazo começa a contar a partir da aprovação da proposta e do recebimento do sinal.

---

### Investimento

| | Valor |
|---|---|
| **Total do projeto** | R$ [valor] |
| **Sinal (início)** | R$ [50% do valor] |
| **Entrega final** | R$ [50% restante] |

Formas de pagamento: PIX, transferência ou boleto.

---

### Próximos passos

1. Aprovação desta proposta (resposta por escrito ou assinatura)
2. Pagamento do sinal
3. Kickoff em até 2 dias úteis após confirmação
4. [Data de início estimada]

---

**[Assinatura]**
[Nome] — Synapse Code
[WhatsApp] | [e-mail]$md$, 'comercial/template-proposta.md'),
  ('Desenvolvimento', 'Painel Interno — Next.js + Supabase', 'dev-painel-interno-nextjs', $md$# Painel Interno — Next.js + Supabase

_Guia de implementação do painel interno da Synapse Code_
_Atualizado em: 2026-05-18_

---

## Visão geral

Painel interno multi-usuário (Rodrigo + Wilian + futuros colaboradores) para gestão financeira, comercial e operacional da Synapse Code. Evolução natural do HTML prototype (`controle-financeiro.html`).

**Stack:** Next.js 14 (App Router) · Supabase · TypeScript · Tailwind CSS

---

## Estrutura de pastas

```
painel-interno/
├── app/
│   ├── layout.tsx                  # Layout raiz (provider de sessão)
│   ├── page.tsx                    # Redirect → /financeiro ou /login
│   ├── login/
│   │   └── page.tsx                # Auth com Supabase (magic link ou email/senha)
│   ├── financeiro/
│   │   ├── page.tsx                # Dashboard financeiro (despesas + receitas)
│   │   ├── despesas/
│   │   │   └── page.tsx            # Lista e cadastro de despesas
│   │   └── receitas/
│   │       └── page.tsx            # Lista e cadastro de receitas (MRR)
│   ├── comercial/
│   │   └── page.tsx                # Pipeline / CRM (futuro)
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts        # Callback OAuth do Supabase
├── components/
│   ├── ui/                         # Componentes base (Button, Input, Modal…)
│   ├── financeiro/
│   │   ├── StatsCards.tsx
│   │   ├── DespesasTable.tsx
│   │   ├── DespesaForm.tsx
│   │   └── GraficoMensal.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   ├── server.ts               # createServerClient (RSC + Server Actions)
│   │   └── middleware.ts           # Refresh de sessão
│   └── utils.ts
├── types/
│   └── financeiro.ts               # Tipos TypeScript
├── middleware.ts                   # Proteção de rotas
├── .env.local                      # Variáveis de ambiente
└── supabase/
    └── migrations/
        └── 001_financeiro.sql      # Schema (mesmo do supabase-schema.sql)
```

---

## Tipos TypeScript (`types/financeiro.ts`)

```typescript
export type Despesa = {
  id: string
  data: string
  descricao: string
  categoria: string
  produto: string
  forma_pagamento: string
  condicao: string
  valor: number
  tipo: 'fixo' | 'variavel' | 'pontual'
  recorrente: boolean
  observacao?: string
  created_at: string
  created_by: string
}

export type Receita = {
  id: string
  data: string
  descricao: string
  produto: string
  cliente?: string
  valor: number
  tipo: 'recorrente' | 'pontual'
  observacao?: string
  created_at: string
  created_by: string
}

export type DespesaInsert = Omit<Despesa, 'id' | 'created_at'>
export type ReceitaInsert = Omit<Receita, 'id' | 'created_at'>

// Categorias fixas
export const CATEGORIAS = [
  'Infraestrutura',
  'Ferramentas',
  'IA / APIs',
  'Hardware',
  'Marketing',
  'Educação',
  'Impostos',
  'Pessoal',
  'Outros',
] as const

export const FORMAS_PAGAMENTO = [
  'Cartão Santander',
  'PIX',
  'Itaú',
  'Boleto',
] as const

export const PRODUTOS_LISTA = [
  'Geral',
  'Nero Barber',
  'Psi Aura',
  'CRM Nexio',
  'Kubic Eng',
  'Arquetipos App',
  'Agentes IA',
  'Design',
] as const
```

---

## Supabase Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Supabase Server (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

---

## Middleware (`middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redireciona para login se não autenticado (exceto rotas públicas)
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
```

---

## Variáveis de ambiente (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

## Página financeiro (`app/financeiro/page.tsx`) — estrutura

```typescript
import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/financeiro/StatsCards'
import { DespesasTable } from '@/components/financeiro/DespesasTable'
import { type Despesa } from '@/types/financeiro'

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const { data: despesas } = await supabase
    .from('despesas')
    .select('*')
    .order('data', { ascending: false })

  const { data: receitas } = await supabase
    .from('receitas')
    .select('*')
    .order('data', { ascending: false })

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>
      <StatsCards despesas={despesas ?? []} receitas={receitas ?? []} />
      <DespesasTable despesas={despesas ?? []} />
    </main>
  )
}
```

---

## Como iniciar o projeto

```bash
# 1. Criar projeto Next.js
npx create-next-app@latest painel-interno --typescript --tailwind --app --src-dir no

# 2. Instalar dependências Supabase
cd painel-interno
npm install @supabase/supabase-js @supabase/ssr

# 3. Configurar .env.local com as credenciais do Supabase

# 4. Rodar o schema SQL no Supabase
# Cole o conteúdo de financeiro/supabase-schema.sql no SQL Editor do Supabase

# 5. Habilitar autenticação no Supabase
# Authentication → Providers → Email → Enable "Email + Password"
# Criar usuário: contato.synapsecode@gmail.com (Rodrigo)
# Criar usuário: wilian@synapsecode.com.br (Wilian)

# 6. Rodar em dev
npm run dev
```

---

## Roadmap do painel (ordem de implementação)

| # | Módulo | Descrição | Prioridade |
|---|--------|-----------|------------|
| 1 | Auth | Login email/senha, sessão persistente | 🔴 Urgente |
| 2 | Financeiro | Despesas + receitas (migrar do HTML) | 🔴 Urgente |
| 3 | Dashboard | MRR, burn rate, saldo estimado | 🟡 Alta |
| 4 | Comercial | Pipeline básico (integrar CRM Nexio futuro) | 🟡 Alta |
| 5 | Produtos | Status dos SaaS, métricas por produto | 🟢 Média |
| 6 | Time | Sprints, tarefas, foco semanal | 🟢 Média |

---

## Migração do HTML → Next.js

O arquivo `financeiro/controle-financeiro.html` já está funcional e usando o mesmo Supabase. A migração é direto — as queries são idênticas, só mudam de `supabase.from(...).select(...)` client-side para Server Components ou Server Actions.

**Estratégia recomendada:**
1. Criar o projeto Next.js e configurar auth
2. Criar a página `/financeiro` usando os dados já no Supabase
3. Manter o HTML como fallback até o Next.js estar em produção
4. Deploy no Vercel (já usam) — zero configuração adicional$md$, 'dev/painel-interno-nextjs.md'),
  ('Desenvolvimento', 'Priorização de Produtos — Synapse Code', 'dev-priorizacao-produtos', $md$# Priorização de Produtos — Synapse Code

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

Em todos os outros casos: **concluir a sprint atual antes de mudar**.$md$, 'dev/priorizacao-produtos.md'),
  ('Desenvolvimento', 'Processo de Desenvolvimento — Synapse Code', 'dev-processo-de-desenvolvimento', $md$# Processo de Desenvolvimento — Synapse Code

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
| Monitoramento | Sentry (erros) + Vercel Analytics (Next.js) |$md$, 'dev/processo-de-desenvolvimento.md'),
  ('Desenvolvimento', 'Roadmap Overview — Todos os Produtos', 'dev-roadmap-overview', $md$# Roadmap Overview — Todos os Produtos

_Synapse Code · Atualizado em: 2026-05-18_

---

## Visão macro (próximos 6 meses)

| Produto | Mai–Jun | Jul–Ago | Set–Out |
|---------|---------|---------|---------|
| **Nero Barber** | Estabilizar + marketing ativo | Novas features (feedback clientes) | Escalar aquisição |
| **Psi Aura** | Corrigir débito técnico | Features core (prontuário, pagamento) | Lançamento ativo |
| **CRM Nexio** | MVP funcional | Uso interno + primeiros clientes | Lançamento externo |
| **Kubic Eng** | Diagnóstico + priorização | Features essenciais | Piloto com 3 clientes |
| **Arquetipos App** | Definir escopo e MVP | Desenvolvimento core | Beta fechado |

---

## Nero Barber — Backlog Priorizado

**Status:** mais maduro, foco em estabilidade e crescimento

| Prioridade | Item | Tamanho |
|-----------|------|---------|
| 🔴 Alta | Preparar ambiente para aumento de usuários (marketing ativo) | M |
| 🔴 Alta | Revisar onboarding do cliente (primeiro acesso) | M |
| 🟠 Média | Notificações de agendamento (WhatsApp ou e-mail) | G |
| 🟠 Média | Relatório financeiro simples para o barbeiro | G |
| 🟡 Baixa | App mobile (se ainda não existir) | XG |
| 🟡 Baixa | Multi-unidade (para quem tem mais de 1 barbearia) | XG |

---

## Psi Aura — Backlog Priorizado

**Status:** precisa de atenção — débito técnico + features core

| Prioridade | Item | Tamanho |
|-----------|------|---------|
| 🔴 Alta | Auditoria de débito técnico + LGPD (dados sensíveis de pacientes) | G |
| 🔴 Alta | Prontuário digital funcional e seguro | G |
| 🟠 Média | Controle de pagamentos e inadimplência | M |
| 🟠 Média | Agenda com bloqueio de horários e recorrência | M |
| 🟡 Baixa | Portal do paciente (agendamento próprio) | XG |

---

## CRM Nexio — Backlog Priorizado

**Status:** em desenvolvimento — foco em MVP

| Prioridade | Item | Tamanho |
|-----------|------|---------|
| 🔴 Alta | Pipeline visual (kanban de leads) | G |
| 🔴 Alta | Cadastro e histórico de contatos | M |
| 🔴 Alta | Registro de atividades (ligações, reuniões, e-mails) | M |
| 🟠 Média | Follow-up automático por e-mail ou WhatsApp | G |
| 🟠 Média | Relatório de funil (taxa de conversão por etapa) | M |
| 🟡 Baixa | Integração com WhatsApp Business API | XG |

---

## Kubic Eng — Backlog Priorizado

**Status:** precisa de atenção — validar escopo com usuários reais

| Prioridade | Item | Tamanho |
|-----------|------|---------|
| 🔴 Alta | Conversar com 3 engenheiros/construtoras para validar MVP | P |
| 🔴 Alta | Gestão de obras (cronograma, etapas, status) | G |
| 🟠 Média | Controle de custos por obra | G |
| 🟠 Média | Gestão de equipe / tarefas por obra | M |
| 🟡 Baixa | Orçamento e proposta integrados | XG |

---

## Arquetipos App — Backlog Priorizado

**Status:** em desenvolvimento — definir escopo primeiro

| Prioridade | Item | Tamanho |
|-----------|------|---------|
| 🔴 Alta | Definir setor, público-alvo e problema central | P |
| 🔴 Alta | Validar ideia com 5 potenciais usuários antes de codar | P |
| 🟠 Média | Protótipo / wireframe do MVP | M |
| 🟠 Média | Desenvolver MVP funcional | XG |

---

## Tamanhos de referência

| Símbolo | Tempo estimado |
|---------|---------------|
| P | 1–2 horas |
| M | Meio dia |
| G | 1–2 dias |
| XG | 3+ dias |$md$, 'dev/roadmap-overview.md'),
  ('Marketing', 'Calendário de Conteúdo — Nero Barber (30 dias)', 'marketing-calendario-nero-barber-30dias', $md$# Calendário de Conteúdo — Nero Barber (30 dias)

_Foco: Instagram · Objetivo: gerar leads de barbearias_
_Atualizado em: 2026-05-18_

---

## Semana 1 — Apresentação do produto

| Dia | Formato | Tema | Caption (resumo) |
|-----|---------|------|-----------------|
| Seg | Reels | "Seu cliente ainda agenda pelo WhatsApp?" | Mostrar o problema + solução em 30s |
| Ter | Carrossel | 5 problemas que toda barbearia tem (e como resolver) | Educativo, gera salvamento |
| Qui | Reels | Demo ao vivo: como o cliente agenda em 3 cliques | Mostrar o produto funcionando |
| Sex | Stories | Enquete: "Você já perdeu cliente por confusão de horário?" | Engajamento + lead quente |

---

## Semana 2 — Prova social e resultado

| Dia | Formato | Tema | Caption (resumo) |
|-----|---------|------|-----------------|
| Seg | Reels | "De WhatsApp caótico para agenda organizada" | Antes/depois fictício ou de cliente |
| Ter | Carrossel | Como o Nero Barber funciona — passo a passo | Educativo de produto |
| Qui | Reels | "Quanto dinheiro você perde com horário vazio?" | Ângulo financeiro — dói no bolso |
| Sex | Post estático | Depoimento de cliente (real ou mock) | Prova social |

---

## Semana 3 — Autoridade no nicho

| Dia | Formato | Tema | Caption (resumo) |
|-----|---------|------|-----------------|
| Seg | Reels | "3 coisas que todo barbeiro profissional faz diferente" | Educativo nicho — não fala do produto |
| Ter | Carrossel | Como montar sua agenda online do zero (com Nero Barber) | Tutorial com CTA no final |
| Qui | Reels | Bastidores: como o sistema foi criado (story do produto) | Humaniza a marca |
| Sex | Stories | Caixa de perguntas: "Me manda sua dúvida sobre gestão de barbearia" | Engajamento + conteúdo futuro |

---

## Semana 4 — Conversão

| Dia | Formato | Tema | Caption (resumo) |
|-----|---------|------|-----------------|
| Seg | Reels | "Por que barbearias que crescem usam sistema?" | Gatilho de crescimento |
| Ter | Carrossel | Comparativo: Nero Barber vs. agendar pelo WhatsApp | Quebra objeção do "tá bom assim" |
| Qui | Reels | CTA direto: "Teste grátis por 14 dias — link na bio" | Conversão direta |
| Sex | Stories | Bastidores do time Synapse Code + CTA de demo | Humanização + fechamento do mês |

---

## Templates de Caption

### Reels educativo
```
[Gancho forte na primeira linha — provoca ou surpreende]

[Desenvolvimento em 3 pontos ou steps]

Se você tem uma barbearia e ainda agenda pelo WhatsApp, isso vai mudar seu dia a dia.

👉 Testa grátis: link na bio
📲 Ou me manda uma DM
```

### Carrossel
```
Slide 1: [Headline que gera curiosidade]
Slides 2-5: [Conteúdo em tópicos curtos]
Slide final: [CTA + @synapsecode]

Caption: Salva esse post — você vai querer ter esse conteúdo por perto.
Dúvidas? Me manda uma DM 👇
```

---

## Hashtags Nero Barber

Bloco 1 (nicho):
`#barbearia #barbeiro #barberlife #barbeariabrasil #barbershop`

Bloco 2 (gestão):
`#gestaoparabarbearia #sistemadebarbearia #agendamentoonline #softwarebarbearia`

Bloco 3 (marca):
`#nerobarber #synapsecode #techparabarbearia`

---

## Notas de execução

- Gravar Reels em lote: 1 tarde por semana produz o conteúdo da semana inteira
- Stories podem ser mais informais — bastidores, enquetes, reposts de clientes
- Sempre responder comentários nas primeiras 1h após postar (algoritmo)
- Fixar post de "Como testar grátis" no perfil$md$, 'marketing/calendario-nero-barber-30dias.md'),
  ('Marketing', 'Estratégia de Marketing — Synapse Code', 'marketing-estrategia-geral', $md$# Estratégia de Marketing — Synapse Code

_Atualizado em: 2026-05-18_

---

## Posicionamento de Marca

**Quem somos:**
> "A Synapse Code transforma negócios com software sob medida — desde SaaS verticais até agentes de IA que atendem 24h pelo WhatsApp."

**Tom de voz:**
- Direto e técnico, mas acessível
- Confiante sem ser arrogante
- Focado em resultado, não em feature

**O que NÃO somos:**
- Agência genérica de "sites"
- Freelancer de desenvolvimento
- Empresa que faz de tudo sem especialidade

---

## Estratégia por Canal

### Instagram (@synapsecode — marca guarda-chuva)
**Objetivo:** autoridade em tech + geração de leads para os SaaS e projetos
**Frequência:** 4–5 posts/semana + Stories diários
**Formato mix:**
- 40% Reels educativos (dicas, bastidores, demos dos SaaS)
- 30% Cases e resultados de clientes
- 20% Conteúdo de produto (demos, features novas)
- 10% Bastidores da empresa (cultura, time, processo)

**Perfis separados por SaaS:** criar @nerobarberapp, @psiaura e @kubiceng no momento certo. Por enquanto, tudo pela @synapsecode com destaque nos Highlights.

---

### LinkedIn (Rodrigo Eufrasio + página Synapse Code)
**Objetivo:** B2B — atrair clientes corporativos para CRM Nexio, Kubic Eng e projetos sob medida
**Frequência:** 3x/semana (perfil pessoal do Rodrigo tem mais alcance que página)
**Formato mix:**
- Posts de aprendizado técnico (arquitetura, stack, decisões de produto)
- Casos de uso dos SaaS com números
- Opiniões sobre mercado de software no Brasil
- Bastidores de construção dos produtos

---

### Site / Portfólio (synapsecode.com.br ou similar)
**Objetivo:** converter visitantes orgânicos (SEO já funciona) em leads
**Prioridade:** criar ou melhorar landing pages para cada produto
**SEO foco:** palavras-chave como "sistema para barbearia", "software para psicólogo", "agente IA whatsapp"

---

## Pilares de Conteúdo

| Pilar | O que falar | Onde |
|-------|------------|------|
| **Educação** | Como resolver problemas do nicho com tecnologia | Instagram Reels, LinkedIn |
| **Prova** | Resultados de clientes, antes/depois, números reais | Instagram, Site |
| **Produto** | Demos, features, atualizações dos SaaS | Instagram, LinkedIn |
| **Bastidores** | Como a Synapse Code trabalha, cultura, time | Instagram Stories |
| **Autoridade** | Opiniões técnicas, tendências, IA no mercado | LinkedIn |

---

## Funil de Marketing → Vendas

```
CONTEÚDO (Instagram/LinkedIn)
       ↓
INTERESSE (comentário, DM, clique no link da bio)
       ↓
LEAD (entra no CRM Nexio)
       ↓
PROCESSO COMERCIAL (processo-de-vendas.md)
```

O conteúdo deve **sempre** ter um CTA claro:
- "Link na bio pra testar grátis"
- "Me manda uma DM que te mostro ao vivo"
- "Acesse [link] e agende uma demo"

---

## Métricas que importam

| Métrica | Meta mês 1 | Meta mês 3 |
|---------|-----------|-----------|
| Seguidores Instagram | +200 | +1.000 |
| Alcance semanal | 5.000 | 25.000 |
| Leads via redes sociais | 5 | 20 |
| Taxa de conversão lead→cliente | — | medir |

---

## Prioridade de execução

1. **Agora:** ativar Instagram com calendário de conteúdo Nero Barber (ver calendário-nero-barber.md)
2. **Semana 2:** ativar LinkedIn pessoal do Rodrigo com 3 posts/semana
3. **Mês 1:** criar LP dedicada para Nero Barber com CTA de trial/demo
4. **Mês 2:** replicar estratégia para Psi Aura
5. **Mês 3:** criar perfis separados por SaaS no Instagram$md$, 'marketing/estrategia-geral.md'),
  ('Marketing', 'Guia LinkedIn — Rodrigo Eufrasio / Synapse Code', 'marketing-guia-linkedin', $md$# Guia LinkedIn — Rodrigo Eufrasio / Synapse Code

_Atualizado em: 2026-05-18_

---

## Objetivo

Construir autoridade técnica e atrair clientes B2B para CRM Nexio, Kubic Eng e projetos sob medida. O perfil pessoal do Rodrigo tem mais alcance orgânico do que a página da empresa — priorizar o perfil pessoal.

---

## Otimização do Perfil

**Headline:** `CTO & Co-founder @ Synapse Code | SaaS · Agentes IA · Sistemas sob medida`

**About (resumo):**
> Construo software que resolve problemas reais de negócio.
> Na Synapse Code, desenvolvemos SaaS verticais (barbearias, psicólogos, engenharia), CRM próprio e agentes de atendimento IA para WhatsApp.
> Se você precisa de um sistema que não existe pronto no mercado, é aqui.

**Featured (destaques):** fixar links para demo dos SaaS ou site da Synapse Code.

---

## Pilares de conteúdo

### 1. Bastidores de produto (40%)
O que está sendo construído, decisões técnicas, erros e aprendizados.

Exemplos:
- "Refatoramos toda a camada de autenticação do Nero Barber. Aqui o que aprendemos…"
- "Escolhemos Supabase em vez de Firebase. Os motivos foram esses…"
- "Erro que nos custou 2 dias de debug — e como não cometer de novo"

### 2. Autoridade em IA e automação (30%)
Tendências, casos de uso práticos, o que funciona e o que não funciona.

Exemplos:
- "Agentes de IA no WhatsApp: o que funciona de verdade em 2025"
- "Automatizamos o atendimento de um cliente e reduziram 70% das mensagens manuais. Como foi"
- "3 erros comuns ao implementar IA em pequenas empresas"

### 3. Visão de mercado e negócio (30%)
Opiniões sobre SaaS, software house, construir produto no Brasil.

Exemplos:
- "Por que SaaS vertical é o melhor modelo para software houses pequenas"
- "O que aprendi construindo 4 SaaS ao mesmo tempo"
- "Vender software no Brasil: o que ninguém te conta"

---

## Formato dos posts

**Post padrão (maior alcance):**
```
[Linha 1: gancho forte — fato, provocação ou número]

[Desenvolvimento em parágrafos curtos, 2–3 linhas cada]

[Conclusão ou aprendizado]

[CTA suave: "O que você acha?" ou "Alguém passou por isso?"]
```

**Regras:**
- Sem bullet points nos primeiros parágrafos — LinkedIn prefere texto corrido
- Primeira linha deve funcionar sozinha (aparece antes do "ver mais")
- Postar entre 7h–9h ou 12h–13h (maior engajamento)
- Responder todos os comentários nas primeiras 2h

---

## Frequência

- 3 posts/semana (Seg, Qua, Sex)
- 1 artigo/mês (conteúdo mais aprofundado)

---

## CTA por tipo de post

| Conteúdo | CTA |
|----------|-----|
| Bastidores de produto | "Curioso pra ver o produto? Me manda uma mensagem." |
| Autoridade em IA | "Precisa de um agente IA pra seu negócio? Vamos conversar." |
| Visão de mercado | "Concordam? Me contem nos comentários." |$md$, 'marketing/guia-linkedin.md'),
  ('Time e RH', 'Time e Processos Internos — Synapse Code', 'time-rh-processos-internos', $md$# Time e Processos Internos — Synapse Code

_Atualizado em: 2026-05-18_

---

## Time atual

| Nome | Papel | Responsabilidades |
|------|-------|------------------|
| Rodrigo Eufrasio | Dev / CTO | Arquitetura, desenvolvimento, produto |
| Wilian Andre | CEO | Negócio, comercial, gestão |

---

## Comunicação interna

### Canais e propósitos

| Canal | Uso |
|-------|-----|
| WhatsApp | Comunicação rápida do dia a dia |
| TASKS.md | Gestão de tarefas e backlog |
| GitHub | Código, PRs, issues técnicas |
| Reunião semanal (15 min) | Alinhamento Rodrigo + Wilian — todo início de semana |

### Reunião semanal (ritual mínimo)
Toda segunda-feira, 15 minutos:
- O que cada um fez na semana passada?
- O que vai fazer essa semana?
- Tem algum bloqueio?

Sem pauta formal. Só alinhamento rápido.

---

## Onboarding de novos membros

Quando o time crescer, todo novo membro recebe:

**Dia 1:**
- [ ] Acesso aos repositórios GitHub
- [ ] Acesso ao ambiente de staging de todos os produtos
- [ ] Leitura dos docs de processo: `dev/processo-de-desenvolvimento.md`
- [ ] Leitura do contexto da empresa: `memory/context/company.md`
- [ ] Reunião de 1h com Rodrigo ou Wilian para contexto geral

**Semana 1:**
- [ ] Primeira tarefa pequena para se familiarizar com a stack
- [ ] Entender o produto que vai trabalhar (roadmap, usuários, problemas)
- [ ] Ter acesso a todas as ferramentas necessárias

**Mês 1:**
- [ ] Check-in semanal com feedback direto
- [ ] Avaliação informal ao fim do mês: o que funcionou, o que ajustar

---

## Perfis para contratar (quando crescer)

| Perfil | Quando contratar | O que resolve |
|--------|-----------------|--------------|
| **Dev frontend** | Quando Rodrigo estiver 80%+ ocupado com backend/produto | Acelera entrega das interfaces |
| **Dev full-stack júnior** | Quando o backlog for > 3 sprints de acumulado | Aumenta velocidade geral |
| **CS / Suporte** | Quando tiver > 30 clientes ativos | Libera Rodrigo e Wilian de suporte |
| **Designer UI/UX** | Quando qualidade visual virar gargalo de conversão | Melhora produto e marketing |
| **Vendedor SDR** | Quando o processo comercial estiver validado | Escala prospecção ativa |

---

## Cultura e valores (base)

**Como trabalhamos:**
- Entregas sobre processos — o que importa é o que foi feito, não como
- Comunicação direta — problema? Fala logo, não acumula
- Autonomia com responsabilidade — cada um cuida do seu domínio
- Produto para o cliente — toda decisão passa pelo impacto no usuário final

**O que não fazemos:**
- Reuniões longas sem decisão clara
- Reescrever o que já funciona só porque é "mais bonito"
- Prometer o que não cabe no prazo

---

## Próximas ações de time

- [ ] Formalizar reunião semanal Rodrigo + Wilian (dia e hora fixos)
- [ ] Documentar processos críticos para facilitar onboarding futuro
- [ ] Definir critérios claros para primeira contratação
- [ ] Avaliar se Wilian precisa de suporte operacional agora (CS ou assistente)$md$, 'time-rh/processos-internos.md'),
  ('Financeiro', 'Controle Financeiro — Synapse Code', 'financeiro-controle-financeiro', $md$# Controle Financeiro — Synapse Code

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
- [ ] Contratar contador (se ainda não tiver) — MEI não suporta SaaS com múltiplos clientes$md$, 'financeiro/controle-financeiro.md')
on conflict (slug) do nothing;
