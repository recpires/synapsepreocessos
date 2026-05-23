'use client'

import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'

const SPRINT_ITEMS = [
  { title: 'Revisar onboarding do cliente (primeiro acesso)',   tag: 'M', tagCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',  status: 'Em andamento' },
  { title: 'Preparar infra para aumento de usuários',           tag: 'M', tagCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',  status: 'A fazer' },
  { title: 'Testes de staging antes do marketing ativo',        tag: 'P', tagCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',     status: 'A fazer' },
]

const ROADMAP = [
  { done: true,  texto: 'Criar processo de desenvolvimento' },
  { done: true,  texto: 'Matriz de priorização de produtos' },
  { done: false, texto: 'Sprint 2 — Psi Aura (auditoria LGPD + débito técnico)' },
  { done: false, texto: 'Sprint 3 — CRM Nexio (pipeline kanban + contatos)' },
  { done: false, texto: 'Sprint 4 — Kubic Eng (validar com clientes piloto)' },
  { done: false, texto: 'Sprint 5 — Arquetipos App (definir escopo + MVP)' },
]

const WORKFLOW = [
  { num: 1, label: 'Backlog',      desc: 'Ideia ou bug registrado' },
  { num: 2, label: 'Planejamento', desc: 'Priorizado na sprint' },
  { num: 3, label: 'Dev',          desc: 'Feature branch' },
  { num: 4, label: 'Staging',      desc: 'Revisão + testes' },
  { num: 5, label: 'Produção',     desc: 'Deploy + comunicado' },
]

export default function DevPage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <SubNav tabs={SUBNAV.dev} />

        <div>
          <h1 className="text-2xl font-bold text-white">Desenvolvimento</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sprint de 2 semanas · Foco rotativo por produto · Regra 60/20/20</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sprint atual */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Sprint atual — Nero Barber
            </p>
            <div className="space-y-3">
              {SPRINT_ITEMS.map((item, i) => (
                <div key={i} className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg p-3 hover:border-[#2d2d3d] transition-colors">
                  <p className="text-sm text-gray-200 font-medium leading-snug mb-2">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${item.tagCor}`}>{item.tag}</span>
                    <span className="text-xs text-gray-500">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Roadmap — próximas sprints
            </p>
            <div className="space-y-3">
              {ROADMAP.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1e1e2e] last:border-0">
                  <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    item.done ? 'bg-violet-600 border-violet-600' : 'border-gray-600'
                  }`}>
                    {item.done && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <p className={`text-sm leading-snug ${item.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Fluxo de trabalho padrão
          </p>
          <div className="flex gap-0 overflow-x-auto">
            {WORKFLOW.map((step, i) => (
              <div key={step.num} className={`flex-1 min-w-[140px] flex items-center gap-3 px-4 py-4 bg-[#1a1a24] border border-[#1e1e2e] ${
                i === 0 ? 'rounded-l-xl border-r-0' :
                i === WORKFLOW.length - 1 ? 'rounded-r-xl' :
                'border-r-0'
              }`}>
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{step.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regra 60/20/20 */}
        <div className="bg-violet-900/10 border border-violet-800/30 rounded-xl p-5">
          <p className="text-sm text-violet-300">
            <span className="font-semibold">⚡ Regra 60/20/20:</span>{' '}
            60% do tempo no produto principal da sprint · 20% em manutenção e bugs dos outros SaaS · 20% em infra, processos e documentação.
          </p>
        </div>
      </div>
    </PainelShell>
  )
}
