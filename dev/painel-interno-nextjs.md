# Painel Interno — Next.js + Supabase

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
4. Deploy no Vercel (já usam) — zero configuração adicional
