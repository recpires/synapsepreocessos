-- Fase 04 · Os templates de contrato saem do código.
--
-- Estavam em 285 linhas de types/contratos.ts, com o HTML dentro de funções
-- `gerar: (d) => ...`. Mudar uma cláusula exigia editar TypeScript, commitar e
-- esperar deploy. A tabela contrato_templates existia desde maio, vazia.
--
-- A conversão troca `${d.campo}` por `{{campo}}`, `${hoje()}` por `{{_hoje}}`
-- e o toLocaleString do valor por `{{campo|moeda}}`. O texto jurídico é
-- idêntico ao que já era gerado.
--
-- O HTML aqui é montado com format(): os estilos repetidos viram variáveis, o
-- que evita 20 repetições da mesma string de CSS. Atenção ao `%%` — dentro de
-- format(), "99%%" é o que produz "99%".

alter table public.contrato_templates
  add column if not exists ativo boolean not null default true,
  add column if not exists slug  text;

create unique index if not exists idx_contrato_templates_slug
  on public.contrato_templates (slug) where slug is not null;

do $$
declare
  doc  text := 'font-family: ''Georgia'', serif; max-width: 800px; margin: 0 auto; padding: 60px 50px; color: #111; line-height: 1.8;';
  topo text := 'text-align:center; border-bottom: 2px solid #111; padding-bottom: 24px; margin-bottom: 40px;';
  h1   text := 'font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px;';
  sub  text := 'font-size: 13px; color: #555; margin: 0;';
  h2   text := 'font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 12px;';
  ass  text := 'margin-top: 80px; display: flex; justify-content: space-between; gap: 60px;';
  col  text := 'flex: 1; text-align: center;';
  lin  text := 'border-top: 1px solid #111; padding-top: 8px; margin-top: 60px;';
  nom  text := 'margin: 0; font-weight: bold;';
  pap  text := 'margin: 4px 0 0; font-size: 13px; color: #555;';
begin

-- ── Desenvolvimento ────────────────────────────────────────────────────────
insert into public.contrato_templates (slug, nome, descricao, tipo, campos, conteudo_html)
select 'desenvolvimento', 'Contrato de Desenvolvimento',
  'Para projetos de software sob medida, sites e aplicações.', 'Desenvolvimento',
  $j$[
    {"key":"cliente_nome","label":"Nome / Razão Social do Cliente","tipo":"text","placeholder":"Empresa LTDA"},
    {"key":"cliente_cpf_cnpj","label":"CPF / CNPJ","tipo":"text","placeholder":"00.000.000/0001-00"},
    {"key":"cliente_email","label":"E-mail do Cliente","tipo":"text","placeholder":"contato@empresa.com"},
    {"key":"projeto_nome","label":"Nome do Projeto","tipo":"text","placeholder":"Sistema de Gestão XYZ"},
    {"key":"projeto_escopo","label":"Escopo / Descrição do Projeto","tipo":"textarea","placeholder":"Desenvolvimento de…"},
    {"key":"valor_total","label":"Valor Total (R$)","tipo":"number","placeholder":"5000"},
    {"key":"prazo_dias","label":"Prazo de Entrega (dias úteis)","tipo":"number","placeholder":"30"},
    {"key":"data_inicio","label":"Data de Início","tipo":"date"},
    {"key":"responsavel","label":"Responsável Synapse","tipo":"select","opcoes":["Rodrigo Eufrasio","Wilian Andre"]}
  ]$j$::jsonb,
  format($f$<div style="%s">
  <div style="%s">
    <h1 style="%s">CONTRATO DE DESENVOLVIMENTO DE SOFTWARE</h1>
    <p style="%s">Synapse Code — Soluções em Tecnologia · Emitido em {{_hoje}}</p>
  </div>

  <p style="margin-bottom: 24px;"><strong>CONTRATANTE:</strong> {{cliente_nome}}, inscrito(a) sob o CPF/CNPJ nº {{cliente_cpf_cnpj}}, doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.</p>
  <p style="margin-bottom: 32px;"><strong>CONTRATADA:</strong> <strong>Synapse Code</strong>, representada por {{responsavel}}, doravante denominada <strong>CONTRATADA</strong>.</p>

  <h2 style="%s">1. Objeto</h2>
  <p>A CONTRATADA se compromete a desenvolver o projeto <strong>{{projeto_nome}}</strong>, cujo escopo compreende: {{projeto_escopo}}.</p>

  <h2 style="%s">2. Prazo</h2>
  <p>O prazo de entrega é de <strong>{{prazo_dias}} dias úteis</strong> a partir de <strong>{{data_inicio|data}}</strong>, podendo ser prorrogado mediante acordo entre as partes em caso de alterações de escopo.</p>

  <h2 style="%s">3. Remuneração</h2>
  <p>O valor total do presente contrato é de <strong>R$ {{valor_total|moeda}}</strong>, a ser pago conforme cronograma acordado entre as partes.</p>

  <h2 style="%s">4. Propriedade Intelectual</h2>
  <p>Após quitação integral do valor contratado, todos os direitos sobre o software desenvolvido serão transferidos ao CONTRATANTE. O código-fonte será entregue somente após liquidação total.</p>

  <h2 style="%s">5. Confidencialidade</h2>
  <p>Ambas as partes comprometem-se a manter sigilo sobre informações trocadas no âmbito deste contrato, não as divulgando a terceiros sem autorização prévia e por escrito da outra parte.</p>

  <h2 style="%s">6. Rescisão</h2>
  <p>Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 (quinze) dias. Em caso de rescisão por iniciativa do CONTRATANTE, serão cobrados os serviços já prestados até a data da rescisão.</p>

  <h2 style="%s">7. Foro</h2>
  <p>Fica eleito o foro da comarca de domicílio da CONTRATADA para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

  <div style="%s">
    <div style="%s"><div style="%s">
      <p style="%s">{{cliente_nome}}</p>
      <p style="%s">CONTRATANTE</p>
    </div></div>
    <div style="%s"><div style="%s">
      <p style="%s">Synapse Code — {{responsavel}}</p>
      <p style="%s">CONTRATADA</p>
    </div></div>
  </div>
</div>$f$, doc, topo, h1, sub, h2, h2, h2, h2, h2, h2, h2, ass, col, lin, nom, pap, col, lin, nom, pap)
where not exists (select 1 from public.contrato_templates where slug = 'desenvolvimento');

-- ── SaaS ───────────────────────────────────────────────────────────────────
insert into public.contrato_templates (slug, nome, descricao, tipo, campos, conteudo_html)
select 'saas', 'Contrato de Licença SaaS',
  'Para licenciamento de software como serviço (Nero Barber, Psi Aura, Kubic Eng…).', 'SaaS',
  $j$[
    {"key":"cliente_nome","label":"Nome / Razão Social do Cliente","tipo":"text","placeholder":"Empresa LTDA"},
    {"key":"cliente_cpf_cnpj","label":"CPF / CNPJ","tipo":"text","placeholder":"00.000.000/0001-00"},
    {"key":"produto_nome","label":"Nome do Produto SaaS","tipo":"text","placeholder":"Nero Barber"},
    {"key":"plano","label":"Plano Contratado","tipo":"text","placeholder":"Profissional"},
    {"key":"valor_mensal","label":"Valor Mensal (R$)","tipo":"number","placeholder":"197"},
    {"key":"data_inicio","label":"Data de Início","tipo":"date"},
    {"key":"vigencia_meses","label":"Vigência (meses)","tipo":"number","placeholder":"12"},
    {"key":"responsavel","label":"Responsável Synapse","tipo":"select","opcoes":["Rodrigo Eufrasio","Wilian Andre"]}
  ]$j$::jsonb,
  format($f$<div style="%s">
  <div style="%s">
    <h1 style="%s">CONTRATO DE LICENÇA DE SOFTWARE (SaaS)</h1>
    <p style="%s">Synapse Code — Soluções em Tecnologia · Emitido em {{_hoje}}</p>
  </div>

  <p style="margin-bottom: 24px;"><strong>LICENCIADO:</strong> {{cliente_nome}}, inscrito(a) sob o CPF/CNPJ nº {{cliente_cpf_cnpj}}, doravante denominado(a) <strong>LICENCIADO</strong>.</p>
  <p style="margin-bottom: 32px;"><strong>LICENCIANTE:</strong> <strong>Synapse Code</strong>, representada por {{responsavel}}, doravante denominada <strong>LICENCIANTE</strong>.</p>

  <h2 style="%s">1. Objeto</h2>
  <p>A LICENCIANTE concede ao LICENCIADO o direito de uso do software <strong>{{produto_nome}}</strong>, plano <strong>{{plano}}</strong>, em modalidade SaaS (Software as a Service), hospedado pela LICENCIANTE e acessível via internet.</p>

  <h2 style="%s">2. Vigência</h2>
  <p>O presente contrato terá vigência de <strong>{{vigencia_meses}} meses</strong> a partir de <strong>{{data_inicio|data}}</strong>, renovando-se automaticamente por igual período salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 dias.</p>

  <h2 style="%s">3. Remuneração</h2>
  <p>O LICENCIADO pagará à LICENCIANTE o valor de <strong>R$ {{valor_mensal|moeda}} por mês</strong>, com vencimento no mesmo dia do início da contratação. O não pagamento por 2 (dois) ciclos consecutivos poderá acarretar suspensão do acesso.</p>

  <h2 style="%s">4. Disponibilidade e Suporte</h2>
  <p>A LICENCIANTE envidará seus melhores esforços para manter o sistema disponível 24/7, com SLA de 99%% de disponibilidade mensal. Suporte técnico será prestado em horário comercial via canais definidos no onboarding.</p>

  <h2 style="%s">5. Dados e Privacidade</h2>
  <p>A LICENCIANTE trata os dados do LICENCIADO conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), atuando como operadora dos dados inseridos pelo LICENCIADO na plataforma.</p>

  <h2 style="%s">6. Limitações</h2>
  <p>É vedado ao LICENCIADO: (i) sublicenciar ou revender o acesso; (ii) realizar engenharia reversa; (iii) utilizar o sistema para fins ilícitos ou que violem direitos de terceiros.</p>

  <h2 style="%s">7. Foro</h2>
  <p>Fica eleito o foro da comarca de domicílio da LICENCIANTE para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

  <div style="%s">
    <div style="%s"><div style="%s">
      <p style="%s">{{cliente_nome}}</p>
      <p style="%s">LICENCIADO</p>
    </div></div>
    <div style="%s"><div style="%s">
      <p style="%s">Synapse Code — {{responsavel}}</p>
      <p style="%s">LICENCIANTE</p>
    </div></div>
  </div>
</div>$f$, doc, topo, h1, sub, h2, h2, h2, h2, h2, h2, h2, ass, col, lin, nom, pap, col, lin, nom, pap)
where not exists (select 1 from public.contrato_templates where slug = 'saas');

-- ── NDA ────────────────────────────────────────────────────────────────────
insert into public.contrato_templates (slug, nome, descricao, tipo, campos, conteudo_html)
select 'nda', 'Acordo de Confidencialidade (NDA)',
  'Para proteger informações confidenciais trocadas com clientes e parceiros.', 'NDA',
  $j$[
    {"key":"parte_nome","label":"Nome / Razão Social da Outra Parte","tipo":"text","placeholder":"Empresa LTDA"},
    {"key":"parte_cpf_cnpj","label":"CPF / CNPJ","tipo":"text","placeholder":"00.000.000/0001-00"},
    {"key":"finalidade","label":"Finalidade do Acordo","tipo":"textarea","placeholder":"Avaliação de parceria comercial para…"},
    {"key":"vigencia_meses","label":"Vigência (meses)","tipo":"number","placeholder":"24"},
    {"key":"data_inicio","label":"Data de Início","tipo":"date"},
    {"key":"responsavel","label":"Responsável Synapse","tipo":"select","opcoes":["Rodrigo Eufrasio","Wilian Andre"]}
  ]$j$::jsonb,
  format($f$<div style="%s">
  <div style="%s">
    <h1 style="%s">ACORDO DE CONFIDENCIALIDADE (NDA)</h1>
    <p style="%s">Non-Disclosure Agreement · Emitido em {{_hoje}}</p>
  </div>

  <p style="margin-bottom: 16px;"><strong>PARTE A:</strong> <strong>Synapse Code</strong>, representada por {{responsavel}}.</p>
  <p style="margin-bottom: 32px;"><strong>PARTE B:</strong> {{parte_nome}}, inscrito(a) sob o CPF/CNPJ nº {{parte_cpf_cnpj}}.</p>

  <h2 style="%s">1. Finalidade</h2>
  <p>As partes firmam o presente Acordo com o objetivo de estabelecer obrigações de confidencialidade no contexto de: {{finalidade}}.</p>

  <h2 style="%s">2. Informações Confidenciais</h2>
  <p>Consideram-se confidenciais todas as informações técnicas, comerciais, financeiras, estratégicas e de qualquer outra natureza divulgadas por uma parte à outra, seja por escrito, verbalmente ou por qualquer outro meio, desde a data de assinatura deste instrumento.</p>

  <h2 style="%s">3. Obrigações</h2>
  <p>Cada parte compromete-se a: (i) manter as informações confidenciais em sigilo absoluto; (ii) não divulgá-las a terceiros sem autorização prévia e por escrito; (iii) utilizá-las exclusivamente para os fins previstos neste Acordo; (iv) adotar as mesmas medidas de proteção que emprega para seus próprios dados confidenciais.</p>

  <h2 style="%s">4. Vigência</h2>
  <p>O presente Acordo terá vigência de <strong>{{vigencia_meses}} meses</strong> a partir de <strong>{{data_inicio|data}}</strong>. As obrigações de confidencialidade subsistirão por mais 2 (dois) anos após o término deste prazo.</p>

  <h2 style="%s">5. Penalidades</h2>
  <p>O descumprimento de qualquer cláusula deste Acordo sujeitará a parte infratora à responsabilidade civil por perdas e danos, além das sanções previstas em lei.</p>

  <h2 style="%s">6. Foro</h2>
  <p>Fica eleito o foro da comarca de domicílio da Synapse Code para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

  <div style="%s">
    <div style="%s"><div style="%s">
      <p style="%s">{{parte_nome}}</p>
      <p style="%s">PARTE B</p>
    </div></div>
    <div style="%s"><div style="%s">
      <p style="%s">Synapse Code — {{responsavel}}</p>
      <p style="%s">PARTE A</p>
    </div></div>
  </div>
</div>$f$, doc, topo, h1, sub, h2, h2, h2, h2, h2, h2, ass, col, lin, nom, pap, col, lin, nom, pap)
where not exists (select 1 from public.contrato_templates where slug = 'nda');

end $$;
