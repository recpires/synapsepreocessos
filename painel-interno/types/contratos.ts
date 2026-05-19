export type Contrato = {
  id: string
  cliente: string
  tipo: string
  status: 'vigente' | 'em_renovacao' | 'pendente_assinatura' | 'encerrado'
  valor?: number
  data_inicio: string
  data_vencimento?: string
  responsavel: string
  observacao?: string
  arquivo_url?: string
  arquivo_nome?: string
  gerado_por_template?: boolean
  template_tipo?: string
  created_at: string
  created_by: string
}

export type ContratoInsert = Omit<Contrato, 'id' | 'created_at'>

export const TIPOS_CONTRATO = [
  'Desenvolvimento',
  'SaaS',
  'NDA',
  'Manutenção',
  'Consultoria',
  'Outro',
] as const

export const STATUS_CONTRATO = [
  'vigente',
  'em_renovacao',
  'pendente_assinatura',
  'encerrado',
] as const

export const RESPONSAVEIS = ['Rodrigo', 'Wilian'] as const

export const STATUS_CORES: Record<string, string> = {
  vigente:              'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  em_renovacao:         'bg-yellow-900/40  text-yellow-300  border border-yellow-800',
  pendente_assinatura:  'bg-orange-900/40  text-orange-300  border border-orange-800',
  encerrado:            'bg-gray-800       text-gray-400    border border-gray-700',
}

export const STATUS_LABEL: Record<string, string> = {
  vigente:             'Vigente',
  em_renovacao:        'Em renovação',
  pendente_assinatura: 'Pend. assinatura',
  encerrado:           'Encerrado',
}

// ── Templates de contrato ────────────────────────────────────────────────────

export type TemplateCampo = {
  key: string
  label: string
  tipo: 'text' | 'number' | 'date' | 'textarea' | 'select'
  opcoes?: string[]
  placeholder?: string
}

export type Template = {
  id: string
  nome: string
  descricao: string
  campos: TemplateCampo[]
  gerar: (dados: Record<string, string>) => string   // retorna HTML do contrato
}

const hoje = () => new Date().toLocaleDateString('pt-BR')

// ── Template: Desenvolvimento ────────────────────────────────────────────────
const templateDesenvolvimento: Template = {
  id: 'desenvolvimento',
  nome: 'Contrato de Desenvolvimento',
  descricao: 'Para projetos de software sob medida, sites e aplicações.',
  campos: [
    { key: 'cliente_nome',    label: 'Nome / Razão Social do Cliente', tipo: 'text', placeholder: 'Empresa LTDA' },
    { key: 'cliente_cpf_cnpj', label: 'CPF / CNPJ', tipo: 'text', placeholder: '00.000.000/0001-00' },
    { key: 'cliente_email',   label: 'E-mail do Cliente', tipo: 'text', placeholder: 'contato@empresa.com' },
    { key: 'projeto_nome',    label: 'Nome do Projeto', tipo: 'text', placeholder: 'Sistema de Gestão XYZ' },
    { key: 'projeto_escopo',  label: 'Escopo / Descrição do Projeto', tipo: 'textarea', placeholder: 'Desenvolvimento de…' },
    { key: 'valor_total',     label: 'Valor Total (R$)', tipo: 'number', placeholder: '5000' },
    { key: 'prazo_dias',      label: 'Prazo de Entrega (dias úteis)', tipo: 'number', placeholder: '30' },
    { key: 'data_inicio',     label: 'Data de Início', tipo: 'date' },
    { key: 'responsavel',     label: 'Responsável Synapse', tipo: 'select', opcoes: ['Rodrigo Eufrasio', 'Wilian Andre'] },
  ],
  gerar: (d) => `
    <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 60px 50px; color: #111; line-height: 1.8;">
      <div style="text-align:center; border-bottom: 2px solid #111; padding-bottom: 24px; margin-bottom: 40px;">
        <h1 style="font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px;">CONTRATO DE DESENVOLVIMENTO DE SOFTWARE</h1>
        <p style="font-size: 13px; color: #555; margin: 0;">Synapse Code — Soluções em Tecnologia · Emitido em ${hoje()}</p>
      </div>

      <p style="margin-bottom: 24px;"><strong>CONTRATANTE:</strong> ${d.cliente_nome}, inscrito(a) sob o CPF/CNPJ nº ${d.cliente_cpf_cnpj}, doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.</p>
      <p style="margin-bottom: 32px;"><strong>CONTRATADA:</strong> <strong>Synapse Code</strong>, representada por ${d.responsavel}, doravante denominada <strong>CONTRATADA</strong>.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">1. Objeto</h2>
      <p>A CONTRATADA se compromete a desenvolver o projeto <strong>${d.projeto_nome}</strong>, cujo escopo compreende: ${d.projeto_escopo}.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">2. Prazo</h2>
      <p>O prazo de entrega é de <strong>${d.prazo_dias} dias úteis</strong> a partir de <strong>${d.data_inicio}</strong>, podendo ser prorrogado mediante acordo entre as partes em caso de alterações de escopo.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">3. Remuneração</h2>
      <p>O valor total do presente contrato é de <strong>R$ ${Number(d.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, a ser pago conforme cronograma acordado entre as partes.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">4. Propriedade Intelectual</h2>
      <p>Após quitação integral do valor contratado, todos os direitos sobre o software desenvolvido serão transferidos ao CONTRATANTE. O código-fonte será entregue somente após liquidação total.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">5. Confidencialidade</h2>
      <p>Ambas as partes comprometem-se a manter sigilo sobre informações trocadas no âmbito deste contrato, não as divulgando a terceiros sem autorização prévia e por escrito da outra parte.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">6. Rescisão</h2>
      <p>Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 (quinze) dias. Em caso de rescisão por iniciativa do CONTRATANTE, serão cobrados os serviços já prestados até a data da rescisão.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">7. Foro</h2>
      <p>Fica eleito o foro da comarca de domicílio da CONTRATADA para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

      <div style="margin-top: 80px; display: flex; justify-content: space-between; gap: 60px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">${d.cliente_nome}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">CONTRATANTE</p>
          </div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">Synapse Code — ${d.responsavel}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">CONTRATADA</p>
          </div>
        </div>
      </div>
    </div>
  `,
}

// ── Template: SaaS ───────────────────────────────────────────────────────────
const templateSaaS: Template = {
  id: 'saas',
  nome: 'Contrato de Licença SaaS',
  descricao: 'Para licenciamento de software como serviço (Nero Barber, Psi Aura, Kubic Eng…).',
  campos: [
    { key: 'cliente_nome',    label: 'Nome / Razão Social do Cliente', tipo: 'text', placeholder: 'Empresa LTDA' },
    { key: 'cliente_cpf_cnpj', label: 'CPF / CNPJ', tipo: 'text', placeholder: '00.000.000/0001-00' },
    { key: 'produto_nome',    label: 'Nome do Produto SaaS', tipo: 'text', placeholder: 'Nero Barber' },
    { key: 'plano',           label: 'Plano Contratado', tipo: 'text', placeholder: 'Profissional' },
    { key: 'valor_mensal',    label: 'Valor Mensal (R$)', tipo: 'number', placeholder: '197' },
    { key: 'data_inicio',     label: 'Data de Início', tipo: 'date' },
    { key: 'vigencia_meses',  label: 'Vigência (meses)', tipo: 'number', placeholder: '12' },
    { key: 'responsavel',     label: 'Responsável Synapse', tipo: 'select', opcoes: ['Rodrigo Eufrasio', 'Wilian Andre'] },
  ],
  gerar: (d) => `
    <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 60px 50px; color: #111; line-height: 1.8;">
      <div style="text-align:center; border-bottom: 2px solid #111; padding-bottom: 24px; margin-bottom: 40px;">
        <h1 style="font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px;">CONTRATO DE LICENÇA DE SOFTWARE (SaaS)</h1>
        <p style="font-size: 13px; color: #555; margin: 0;">Synapse Code — Soluções em Tecnologia · Emitido em ${hoje()}</p>
      </div>

      <p style="margin-bottom: 24px;"><strong>LICENCIADO:</strong> ${d.cliente_nome}, inscrito(a) sob o CPF/CNPJ nº ${d.cliente_cpf_cnpj}, doravante denominado(a) <strong>LICENCIADO</strong>.</p>
      <p style="margin-bottom: 32px;"><strong>LICENCIANTE:</strong> <strong>Synapse Code</strong>, representada por ${d.responsavel}, doravante denominada <strong>LICENCIANTE</strong>.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">1. Objeto</h2>
      <p>A LICENCIANTE concede ao LICENCIADO o direito de uso do software <strong>${d.produto_nome}</strong>, plano <strong>${d.plano}</strong>, em modalidade SaaS (Software as a Service), hospedado pela LICENCIANTE e acessível via internet.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">2. Vigência</h2>
      <p>O presente contrato terá vigência de <strong>${d.vigencia_meses} meses</strong> a partir de <strong>${d.data_inicio}</strong>, renovando-se automaticamente por igual período salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 dias.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">3. Remuneração</h2>
      <p>O LICENCIADO pagará à LICENCIANTE o valor de <strong>R$ ${Number(d.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por mês</strong>, com vencimento no mesmo dia do início da contratação. O não pagamento por 2 (dois) ciclos consecutivos poderá acarretar suspensão do acesso.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">4. Disponibilidade e Suporte</h2>
      <p>A LICENCIANTE envidará seus melhores esforços para manter o sistema disponível 24/7, com SLA de 99% de disponibilidade mensal. Suporte técnico será prestado em horário comercial via canais definidos no onboarding.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">5. Dados e Privacidade</h2>
      <p>A LICENCIANTE trata os dados do LICENCIADO conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), atuando como operadora dos dados inseridos pelo LICENCIADO na plataforma.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">6. Limitações</h2>
      <p>É vedado ao LICENCIADO: (i) sublicenciar ou revender o acesso; (ii) realizar engenharia reversa; (iii) utilizar o sistema para fins ilícitos ou que violem direitos de terceiros.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">7. Foro</h2>
      <p>Fica eleito o foro da comarca de domicílio da LICENCIANTE para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

      <div style="margin-top: 80px; display: flex; justify-content: space-between; gap: 60px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">${d.cliente_nome}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">LICENCIADO</p>
          </div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">Synapse Code — ${d.responsavel}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">LICENCIANTE</p>
          </div>
        </div>
      </div>
    </div>
  `,
}

// ── Template: NDA ────────────────────────────────────────────────────────────
const templateNDA: Template = {
  id: 'nda',
  nome: 'Acordo de Confidencialidade (NDA)',
  descricao: 'Para proteger informações confidenciais trocadas com clientes e parceiros.',
  campos: [
    { key: 'parte_nome',      label: 'Nome / Razão Social da Outra Parte', tipo: 'text', placeholder: 'Empresa LTDA' },
    { key: 'parte_cpf_cnpj',  label: 'CPF / CNPJ', tipo: 'text', placeholder: '00.000.000/0001-00' },
    { key: 'finalidade',      label: 'Finalidade do Acordo', tipo: 'textarea', placeholder: 'Avaliação de parceria comercial para…' },
    { key: 'vigencia_meses',  label: 'Vigência (meses)', tipo: 'number', placeholder: '24' },
    { key: 'data_inicio',     label: 'Data de Início', tipo: 'date' },
    { key: 'responsavel',     label: 'Responsável Synapse', tipo: 'select', opcoes: ['Rodrigo Eufrasio', 'Wilian Andre'] },
  ],
  gerar: (d) => `
    <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 60px 50px; color: #111; line-height: 1.8;">
      <div style="text-align:center; border-bottom: 2px solid #111; padding-bottom: 24px; margin-bottom: 40px;">
        <h1 style="font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px;">ACORDO DE CONFIDENCIALIDADE (NDA)</h1>
        <p style="font-size: 13px; color: #555; margin: 0;">Non-Disclosure Agreement · Emitido em ${hoje()}</p>
      </div>

      <p style="margin-bottom: 16px;"><strong>PARTE A:</strong> <strong>Synapse Code</strong>, representada por ${d.responsavel}.</p>
      <p style="margin-bottom: 32px;"><strong>PARTE B:</strong> ${d.parte_nome}, inscrito(a) sob o CPF/CNPJ nº ${d.parte_cpf_cnpj}.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">1. Finalidade</h2>
      <p>As partes firmam o presente Acordo com o objetivo de estabelecer obrigações de confidencialidade no contexto de: ${d.finalidade}.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">2. Informações Confidenciais</h2>
      <p>Consideram-se confidenciais todas as informações técnicas, comerciais, financeiras, estratégicas e de qualquer outra natureza divulgadas por uma parte à outra, seja por escrito, verbalmente ou por qualquer outro meio, desde a data de assinatura deste instrumento.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">3. Obrigações</h2>
      <p>Cada parte compromete-se a: (i) manter as informações confidenciais em sigilo absoluto; (ii) não divulgá-las a terceiros sem autorização prévia e por escrito; (iii) utilizá-las exclusivamente para os fins previstos neste Acordo; (iv) adotar as mesmas medidas de proteção que emprega para seus próprios dados confidenciais.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">4. Vigência</h2>
      <p>O presente Acordo terá vigência de <strong>${d.vigencia_meses} meses</strong> a partir de <strong>${d.data_inicio}</strong>. As obrigações de confidencialidade subsistirão por mais 2 (dois) anos após o término deste prazo.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">5. Penalidades</h2>
      <p>O descumprimento de qualquer cláusula deste Acordo sujeitará a parte infratora à responsabilidade civil por perdas e danos, além das sanções previstas em lei.</p>

      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;">6. Foro</h2>
      <p>Fica eleito o foro da comarca de domicílio da Synapse Code para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

      <div style="margin-top: 80px; display: flex; justify-content: space-between; gap: 60px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">${d.parte_nome}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">PARTE B</p>
          </div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold;">Synapse Code — ${d.responsavel}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">PARTE A</p>
          </div>
        </div>
      </div>
    </div>
  `,
}

export const TEMPLATES: Template[] = [
  templateDesenvolvimento,
  templateSaaS,
  templateNDA,
]
