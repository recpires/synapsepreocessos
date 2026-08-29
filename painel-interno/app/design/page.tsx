'use client'

import { useState } from 'react'
import PainelShell from '@/components/PainelShell'
import {
  Badge, Button, Card, CardHeader, CardBody, Metrica,
  Input, Select, Textarea,
  Tabela, Th, Td, Tr, ThOrdenavel,
  PageHeader, Vazio, Erro, Skeleton, SkeletonTabela,
  TemaToggle,
} from '@/components/ui'

const SUPERFICIES = [
  { nome: 'ground', classe: 'bg-ground', uso: 'Fundo da página' },
  { nome: 'surface', classe: 'bg-surface', uso: 'Cartões e barras' },
  { nome: 'surface-2', classe: 'bg-surface-2', uso: 'Cabeçalho de tabela, hover' },
  { nome: 'surface-3', classe: 'bg-surface-3', uso: 'Hover sobre surface-2' },
  { nome: 'line', classe: 'bg-line', uso: 'Bordas e divisórias' },
  { nome: 'line-strong', classe: 'bg-line-strong', uso: 'Borda de campo, contorno ativo' },
]

const TEXTOS = [
  { nome: 'fg', classe: 'text-fg', uso: 'Texto principal' },
  { nome: 'muted', classe: 'text-muted', uso: 'Rótulo, texto secundário' },
  { nome: 'subtle', classe: 'text-subtle', uso: 'Legenda, metadado' },
]

const SEMANTICAS = [
  { nome: 'ok', bg: 'bg-ok-soft', txt: 'text-ok', ln: 'border-ok-line', uso: 'Pago, vigente, no prazo' },
  { nome: 'warn', bg: 'bg-warn-soft', txt: 'text-warn', ln: 'border-warn-line', uso: 'Vencendo, em renovação' },
  { nome: 'crit', bg: 'bg-crit-soft', txt: 'text-crit', ln: 'border-crit-line', uso: 'Vencido, erro, bloqueado' },
  { nome: 'info', bg: 'bg-info-soft', txt: 'text-info', ln: 'border-info-line', uso: 'Neutro informativo' },
]

export default function DesignPage() {
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc')
  const [carregando, setCarregando] = useState(false)

  return (
    <PainelShell>
      <div className="mx-auto max-w-5xl space-y-10 p-6">
        <PageHeader
          titulo="Design system"
          descricao="Os tokens e componentes do painel. O tema escuro reproduz os hex que as telas já usavam — migrar uma tela para os tokens não muda o visual."
          acoes={<TemaToggle />}
        />

        {/* ── Superfícies ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Superfícies</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SUPERFICIES.map(s => (
              <div key={s.nome} className="flex items-center gap-3 rounded-token border border-line bg-surface p-3">
                <div className={`h-10 w-10 flex-shrink-0 rounded border border-line ${s.classe}`} />
                <div className="min-w-0">
                  <div className="font-mono text-xs text-fg">{s.nome}</div>
                  <div className="text-xs text-subtle">{s.uso}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Texto ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Texto</h2>
          <Card className="divide-y divide-line">
            {TEXTOS.map(t => (
              <div key={t.nome} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
                <span className={`text-sm ${t.classe}`}>
                  O rato roeu a roupa do rei de Roma — {t.nome}
                </span>
                <span className="text-xs text-subtle">{t.uso}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* ── Semânticas ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Cores semânticas</h2>
          <p className="max-w-prose text-sm text-muted">
            Separadas do violeta da marca. O acento diz &ldquo;isto é da Synapse&rdquo;; a semântica diz
            &ldquo;isto precisa da sua atenção&rdquo;. Nunca use uma no lugar da outra.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SEMANTICAS.map(s => (
              <div key={s.nome} className={`rounded-token border px-4 py-3 ${s.bg} ${s.ln}`}>
                <div className={`font-mono text-xs font-semibold ${s.txt}`}>{s.nome}</div>
                <div className={`mt-0.5 text-xs ${s.txt} opacity-80`}>{s.uso}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Métricas ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Métricas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica rotulo="Despesa do mês" valor="R$ 5.016,95" variacao={-36.1} inverterCor detalhe="10 lançamentos" />
            <Metrica rotulo="Receita do mês" valor="R$ 0,00" variacao={0} detalhe="Webhook pendente" />
            <Metrica rotulo="Gasto em 2026" valor="R$ 32.984,59" detalhe="Jan a ago" />
            <Metrica rotulo="Recorrente/mês" valor="R$ 5.262,97" variacao={4.9} inverterCor detalhe="11 assinaturas" />
          </div>
        </section>

        {/* ── Botões ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Botões</h2>
          <Card>
            <CardBody className="flex flex-wrap items-center gap-2">
              <Button>Salvar</Button>
              <Button variante="secundario">Cancelar</Button>
              <Button variante="fantasma">Limpar filtros</Button>
              <Button variante="perigo">Excluir</Button>
              <Button
                carregando={carregando}
                onClick={() => {
                  setCarregando(true)
                  setTimeout(() => setCarregando(false), 1200)
                }}
              >
                {carregando ? 'Salvando' : 'Testar carregando'}
              </Button>
              <Button disabled>Indisponível</Button>
            </CardBody>
          </Card>
        </section>

        {/* ── Badges ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Status</h2>
          <Card>
            <CardBody className="flex flex-wrap gap-2">
              <Badge tom="ok" ponto>Vigente</Badge>
              <Badge tom="atencao" ponto>Em renovação</Badge>
              <Badge tom="critico" ponto>Vencido</Badge>
              <Badge tom="info">Pendente assinatura</Badge>
              <Badge tom="neutro">Encerrado</Badge>
              <Badge tom="acento">Nero Barber</Badge>
            </CardBody>
          </Card>
        </section>

        {/* ── Formulário ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Campos</h2>
          <Card>
            <CardHeader titulo="Nova despesa" descricao="Todo campo tem rótulo, e o erro diz como resolver." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input rotulo="Descrição" placeholder="Supabase" defaultValue="Supabase" />
              <Input rotulo="Valor" inputMode="decimal" placeholder="0,00" dica="Use vírgula para centavos." />
              <Select rotulo="Categoria" defaultValue="Infraestrutura">
                <option>Infraestrutura</option>
                <option>Ferramentas</option>
                <option>IA / APIs</option>
              </Select>
              <Input rotulo="Data" type="date" erro="Data fora do período aberto. Escolha uma data a partir de 01/08/2026." />
              <Textarea rotulo="Observação" placeholder="Opcional" className="sm:col-span-2" />
            </CardBody>
          </Card>
        </section>

        {/* ── Tabela ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Tabela</h2>
          <Tabela>
            <thead>
              <tr>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <ThOrdenavel ativo direcao={ordem} numerica onClick={() => setOrdem(o => (o === 'asc' ? 'desc' : 'asc'))}>
                  Valor
                </ThOrdenavel>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td>Claude AI</Td>
                <Td className="text-muted">IA / APIs</Td>
                <Td numerica>583,81</Td>
                <Td><Badge tom="ok" ponto>Pago</Badge></Td>
              </Tr>
              <Tr>
                <Td>Supabase</Td>
                <Td className="text-muted">Infraestrutura</Td>
                <Td numerica>237,05</Td>
                <Td><Badge tom="atencao" ponto>Vence em 3d</Badge></Td>
              </Tr>
              <Tr>
                <Td>Google Ads</Td>
                <Td className="text-muted">Marketing</Td>
                <Td numerica>49,27</Td>
                <Td><Badge tom="critico" ponto>Vencido</Badge></Td>
              </Tr>
            </tbody>
          </Tabela>
        </section>

        {/* ── Estados ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Estados</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <Vazio
              titulo="Nenhuma receita lançada"
              descricao="O webhook do Asaas ainda não recebeu eventos. Lance manualmente ou confira a integração."
              acao={<Button tamanho="sm">Lançar receita</Button>}
            />
            <div className="space-y-3">
              <Erro mensagem="Não foi possível carregar as despesas. Verifique sua conexão." aoTentarNovamente={() => {}} />
              <SkeletonTabela linhas={3} colunas={4} />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </PainelShell>
  )
}
