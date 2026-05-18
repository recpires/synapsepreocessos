'use client'

import PainelShell from '@/components/PainelShell'
import Link from 'next/link'

const PROCESSOS = [
  {
    icon: '🛠️', bg: 'bg-emerald-900/15', titulo: 'Desenvolvimento',
    desc: 'Sprints de 2 semanas, foco rotativo, fluxo de tarefas e DoD.',
    arquivos: ['processo-de-desenvolvimento.md', 'priorizacao-produtos.md', 'roadmap-overview.md'],
    link: '/dev',
  },
  {
    icon: '💼', bg: 'bg-blue-900/15', titulo: 'Comercial',
    desc: 'Funil de 7 etapas, ICP por produto, scripts de prospecção fria.',
    arquivos: ['processo-de-vendas.md', 'icp-por-produto.md', 'script-prospeccao-frio.md'],
    link: '/comercial',
  },
  {
    icon: '📣', bg: 'bg-pink-900/15', titulo: 'Marketing',
    desc: 'Estratégia por canal, calendário 30 dias Nero Barber, guia LinkedIn.',
    arquivos: ['estrategia-geral.md', 'calendario-nero-barber-30dias.md', 'guia-linkedin.md'],
    link: '/marketing',
  },
  {
    icon: '💰', bg: 'bg-amber-900/15', titulo: 'Financeiro',
    desc: 'Controle de MRR, custos, precificação dos SaaS e rituais mensais.',
    arquivos: ['controle-financeiro.md'],
    link: '/financeiro',
  },
  {
    icon: '👥', bg: 'bg-orange-900/15', titulo: 'Time / RH',
    desc: 'Comunicação interna, onboarding de membros e plano de contratações.',
    arquivos: ['processos-internos.md'],
    link: '/time',
  },
]

const DOCS_PASTA = [
  { nome: 'processo-de-desenvolvimento.md', caminho: 'processos/' },
  { nome: 'processo-de-vendas.md',          caminho: 'comercial/' },
  { nome: 'icp-por-produto.md',             caminho: 'comercial/' },
  { nome: 'script-prospeccao-frio.md',      caminho: 'comercial/' },
  { nome: 'estrategia-geral.md',            caminho: 'marketing/' },
  { nome: 'calendario-nero-barber-30dias.md',caminho: 'marketing/' },
  { nome: 'controle-financeiro.md',         caminho: 'financeiro/' },
  { nome: 'processos-internos.md',          caminho: 'rh/' },
]

export default function ProcessosPage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Processos documentados</h1>
          <p className="text-gray-500 text-sm mt-0.5">Todos os playbooks operacionais da Synapse Code</p>
        </div>

        {/* Process cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROCESSOS.map(p => (
            <Link key={p.titulo} href={p.link}
              className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 hover:border-violet-700/50 hover:-translate-y-0.5 transition-all block group">
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center text-xl mb-3`}>
                {p.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">{p.titulo}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{p.desc}</p>
              <div className="space-y-1.5">
                {p.arquivos.map(a => (
                  <div key={a} className="flex items-center gap-1.5 text-xs text-violet-400">
                    <span>→</span>
                    <span className="truncate">{a}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}

          {/* Add process card */}
          <div className="bg-[#111118] border border-dashed border-[#2d2d3d] rounded-xl p-5 opacity-50 hover:opacity-70 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-violet-900/15 flex items-center justify-center text-xl mb-3">➕</div>
            <h3 className="text-sm font-semibold text-white mb-1">Adicionar processo</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Peça ao assistente para documentar um novo processo operacional.</p>
          </div>
        </div>

        {/* Docs listing */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Arquivos no repositório — D:\Processos Synapse Code\
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOCS_PASTA.map(d => (
              <div key={d.nome} className="flex items-center gap-2.5 py-2 px-3 bg-[#1a1a24] rounded-lg">
                <span className="text-gray-600 text-sm">📄</span>
                <div className="min-w-0">
                  <p className="text-xs text-violet-400 truncate">{d.nome}</p>
                  <p className="text-[10px] text-gray-600">{d.caminho}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
