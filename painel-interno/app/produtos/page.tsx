'use client'

import PainelShell from '@/components/PainelShell'

const PRODUTOS = [
  {
    icon: '💈', nome: 'Nero Barber', status: 'Maduro', statusCor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40',
    desc: 'SaaS para barbearias — agendamento, gestão de clientes e serviços',
    stack: ['Next.js', 'Supabase'], pct: 80,
  },
  {
    icon: '🧠', nome: 'Psi Aura', status: 'Atenção', statusCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',
    desc: 'SaaS para psicólogos — agenda, prontuários e gestão de pacientes',
    stack: ['Next.js', 'PostgreSQL'], pct: 55,
  },
  {
    icon: '📊', nome: 'CRM Nexio', status: 'Em dev', statusCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',
    desc: 'CRM próprio — gestão de leads, pipeline e relacionamento',
    stack: ['React', 'Node.js'], pct: 40,
  },
  {
    icon: '🏗️', nome: 'Kubic Eng', status: 'Atenção', statusCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',
    desc: 'SaaS para engenharia — gestão de obras, custos e equipes de campo',
    stack: ['.NET', 'C#'], pct: 45,
  },
  {
    icon: '🌀', nome: 'Arquetipos App', status: 'Novo', statusCor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40',
    desc: 'Novo SaaS em desenvolvimento — setor e escopo a definir',
    stack: ['A definir'], pct: 15,
  },
]

const STACK_GERAL = [
  { label: 'Next.js',       cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { label: 'React',         cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { label: 'Node.js',       cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { label: 'Supabase',      cor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' },
  { label: 'PostgreSQL',    cor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' },
  { label: 'Flutter',       cor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40' },
  { label: 'React Native',  cor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40' },
  { label: 'Python',        cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { label: 'Django',        cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { label: '.NET',          cor: 'bg-orange-900/30 text-orange-400 border border-orange-800/40' },
  { label: 'C#',            cor: 'bg-orange-900/30 text-orange-400 border border-orange-800/40' },
]

export default function ProdutosPage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-gray-500 text-sm mt-0.5">5 SaaS ativos — stack Next.js · Supabase · Flutter · .NET · Python</p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PRODUTOS.map(p => (
            <div key={p.nome} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 hover:border-[#2d2d3d] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{p.icon}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${p.statusCor}`}>{p.status}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{p.nome}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.stack.map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/20 text-violet-400 border border-violet-800/30 font-medium">{s}</span>
                ))}
              </div>
              <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400" style={{ width: `${p.pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Maturidade</span>
                <span>{p.pct}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stack geral */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Stack da Synapse Code
          </p>
          <div className="flex flex-wrap gap-2">
            {STACK_GERAL.map(s => (
              <span key={s.label} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${s.cor}`}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Tabela de precificação */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Precificação de referência
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {['Produto', 'Básico', 'Pro', 'Premium'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { icon: '💈', nome: 'Nero Barber',   basico: 'R$79',  pro: 'R$149', premium: 'R$249' },
                  { icon: '🧠', nome: 'Psi Aura',      basico: 'R$69',  pro: 'R$129', premium: 'R$199' },
                  { icon: '📊', nome: 'CRM Nexio',     basico: 'R$99',  pro: 'R$199', premium: 'R$349' },
                  { icon: '🏗️', nome: 'Kubic Eng',     basico: 'R$149', pro: 'R$299', premium: 'R$499' },
                ].map((r, i, arr) => (
                  <tr key={r.nome} className={i < arr.length - 1 ? 'border-b border-[#1e1e2e]' : ''}>
                    <td className="px-3 py-2.5 text-gray-300">{r.icon} {r.nome}</td>
                    <td className="px-3 py-2.5 text-gray-400">{r.basico}</td>
                    <td className="px-3 py-2.5 text-gray-400">{r.pro}</td>
                    <td className="px-3 py-2.5 text-violet-400 font-medium">{r.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-600 mt-3">* Valores de referência — validar com clientes</p>
        </div>
      </div>
    </PainelShell>
  )
}
