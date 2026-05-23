# Integração Asaas → Painel Interno

Webhook que popula automaticamente a tabela `receitas` quando o Asaas confirma um pagamento.

## 1. Variáveis de ambiente (Vercel / .env.local)

```bash
# Já existentes
NEXT_PUBLIC_SUPABASE_URL=https://bdfgmgxajzyjtunetnuw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Novas (obrigatórias para o webhook funcionar)
SUPABASE_SERVICE_ROLE_KEY=...              # Project Settings → API → service_role (NUNCA expor no client)
ASAAS_WEBHOOK_TOKEN=<gerar token forte>    # ex: openssl rand -hex 32
```

> No Vercel: Project → Settings → Environment Variables → adicionar para Production.

## 2. Configurar o webhook no painel do Asaas

1. Acesse o painel Asaas → **Integrações** → **Webhooks** → **+ Adicionar webhook**.
2. Preencha:
   - **URL**: `https://painel.synapsecode.com.br/api/webhooks/asaas`
   - **Email para notificações de erro**: contato.synapsecode@gmail.com
   - **Versão da API**: v3 (mais recente)
   - **Token de autenticação**: cole o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - **Enviar tipo do evento**: ✅ ativado
3. **Eventos a habilitar**:
   - ✅ `PAYMENT_RECEIVED` — pagamento recebido (PIX, boleto liquidado, etc.)
   - ✅ `PAYMENT_CONFIRMED` — pagamento confirmado (cartão)
   - ✅ `PAYMENT_REFUNDED` — estorno (marca como `estornado`)
   - ✅ `PAYMENT_REFUND_IN_PROGRESS` — estorno em andamento
   - ✅ `PAYMENT_DELETED` — cobrança apagada (marca como `cancelado`)
4. Salvar.

## 3. Identificar o produto (qual SaaS gerou a receita)

Use o campo `externalReference` ao criar a cobrança no Asaas com o nome do produto.

**Exemplo (Node):**

```js
await fetch('https://api.asaas.com/v3/payments', {
  method: 'POST',
  headers: { access_token: ASAAS_API_KEY, 'content-type': 'application/json' },
  body: JSON.stringify({
    customer: 'cus_xxxx',
    billingType: 'PIX',
    value: 197.00,
    dueDate: '2026-06-01',
    description: 'Nero Pro - junho/26',
    externalReference: 'Nero Barber',   // ← identifica o produto no painel
  })
})
```

Valores aceitos para `externalReference` (devem bater com `PRODUTOS_LISTA` em `types/financeiro.ts`):
- `Nero Barber`
- `Psi Aura`
- `Kubic Eng`
- `CRM Nexio`
- `Arquetipos App`
- `Agentes IA`
- `Design`
- `Geral` (default se não informar)

## 4. Como o webhook trata os eventos

| Evento Asaas                  | Ação no banco                                  |
|-------------------------------|------------------------------------------------|
| PAYMENT_RECEIVED              | upsert `receitas` com `status = recebido`      |
| PAYMENT_CONFIRMED             | upsert `receitas` com `status = confirmado`    |
| PAYMENT_REFUNDED              | update `status = estornado`                    |
| PAYMENT_REFUND_IN_PROGRESS    | update `status = estornado`                    |
| PAYMENT_DELETED               | update `status = cancelado`                    |
| outros                        | ignorado (200 OK)                              |

### Idempotência

O campo `origem_id = asaas:<payment.id>` tem constraint UNIQUE.
Se o Asaas reenviar o mesmo evento, o upsert atualiza em vez de duplicar.

### Valor gravado

Usa `netValue` (valor líquido, já descontada a taxa do Asaas) quando disponível.
Cai pra `value` (valor bruto) se `netValue` não vier.

## 5. Testar manualmente

```bash
curl -X POST https://painel.synapsecode.com.br/api/webhooks/asaas \
  -H "content-type: application/json" \
  -H "asaas-access-token: SEU_TOKEN_AQUI" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_teste123",
      "customer": "cus_teste",
      "value": 100.00,
      "netValue": 97.50,
      "paymentDate": "2026-05-23",
      "billingType": "PIX",
      "externalReference": "Nero Barber",
      "description": "Teste manual"
    }
  }'
```

Resposta esperada: `{"ok":true,"event":"PAYMENT_RECEIVED","payment":"pay_teste123"}`

Aí confira em `/receitas` no painel — a linha de teste deve aparecer.

## 6. Lançamento manual

Para receitas que não passam pelo Asaas (transferência direta, dinheiro, etc.):

- Acesse `/receitas` no painel → botão **+ Nova Receita**.
- A receita fica com `origem = manual` e aparece junto das automáticas no `/balanco`.

## 7. Onde a receita aparece no painel

- **`/receitas`**: lista completa, filtros, KPIs (mês, ano, via Asaas, manual)
- **`/balanco`**: agregado por produto (S1/S2 do ano escolhido), entra no cálculo de lucro líquido e margem
