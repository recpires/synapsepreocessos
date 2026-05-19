import { NextRequest, NextResponse } from 'next/server'

// ─── DocuSign JWT Auth + Send Envelope ───────────────────────────────────────
//
// Variáveis de ambiente necessárias (adicione ao .env.local e ao Vercel):
//
//   DOCUSIGN_INTEGRATION_KEY   → Integration Key do seu app no DocuSign
//   DOCUSIGN_ACCOUNT_ID        → Account ID (GUID) — visível em Configurações > API
//   DOCUSIGN_USER_ID           → User ID (GUID) do usuário que vai assinar como remetente
//   DOCUSIGN_PRIVATE_KEY       → Chave RSA privada (PEM) gerada no DocuSign Console
//   DOCUSIGN_BASE_URL          → https://na4.docusign.net (produção) ou
//                                https://demo.docusign.net (sandbox)
//
// Como obter:
//   1. Acesse https://admindemo.docusign.com/apps-and-keys
//   2. Clique em "Add App and Integration Key"
//   3. Copie o Integration Key gerado
//   4. Em "Authentication", selecione "Service Integration (JWT)" e gere o par RSA
//   5. Copie a chave PRIVADA (começa com -----BEGIN RSA PRIVATE KEY-----)
//   6. Em Configurações > API e Logins → copie Account ID e User ID
//   7. Execute o grant de consentimento uma vez:
//      https://account-d.docusign.com/oauth/auth?response_type=code
//        &scope=signature%20impersonation
//        &client_id=SEU_INTEGRATION_KEY
//        &redirect_uri=https://painel.synapsecode.com.br
// ─────────────────────────────────────────────────────────────────────────────

async function getDocuSignToken(): Promise<string> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY
  const userId         = process.env.DOCUSIGN_USER_ID
  const privateKeyPem  = process.env.DOCUSIGN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const baseUrl        = process.env.DOCUSIGN_BASE_URL ?? 'https://account-d.docusign.com'

  if (!integrationKey || !userId || !privateKeyPem) {
    throw new Error('DOCUSIGN_NOT_CONFIGURED')
  }

  // Importar chave RSA via Web Crypto
  const pemBody = privateKeyPem
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  // Montar JWT
  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: integrationKey,
    sub: userId,
    aud: baseUrl.replace('https://', ''),
    iat: now,
    exp: now + 3600,
    scope: 'signature impersonation',
  }
  const encode  = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signingInput = `${encode(header)}.${encode(payload)}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`

  // Trocar JWT por Access Token
  const tokenRes = await fetch(`https://${baseUrl.replace('https://', '')}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`DocuSign token error: ${err}`)
  }
  const { access_token } = await tokenRes.json()
  return access_token as string
}

export async function POST(req: NextRequest) {
  try {
    const {
      contratoId,
      clienteNome,
      clienteEmail,
      assunto,
      conteudoHtml,
    } = await req.json() as {
      contratoId: string
      clienteNome: string
      clienteEmail: string
      assunto: string
      conteudoHtml: string
    }

    if (!clienteEmail || !conteudoHtml) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se DocuSign está configurado
    if (!process.env.DOCUSIGN_INTEGRATION_KEY) {
      return NextResponse.json({ error: 'DOCUSIGN_NOT_CONFIGURED' }, { status: 503 })
    }

    const accessToken = await getDocuSignToken()
    const accountId   = process.env.DOCUSIGN_ACCOUNT_ID!
    const baseUrl     = process.env.DOCUSIGN_BASE_URL ?? 'https://demo.docusign.net'

    // Converter HTML para base64
    const docBase64 = Buffer.from(conteudoHtml).toString('base64')

    // Criar envelope
    const envelope = {
      emailSubject: assunto || `Contrato para assinatura — ${clienteNome}`,
      documents: [{
        documentBase64: docBase64,
        name: `Contrato_${clienteNome.replace(/\s+/g, '_')}.html`,
        fileExtension: 'html',
        documentId: '1',
      }],
      recipients: {
        signers: [
          {
            email: clienteEmail,
            name: clienteNome,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [{
                anchorString: 'CONTRATANTE',
                anchorUnits: 'words',
                anchorXOffset: '0',
                anchorYOffset: '30',
              }],
            },
          },
          {
            email: 'contato.synapsecode@gmail.com',
            name: 'Synapse Code',
            recipientId: '2',
            routingOrder: '2',
            tabs: {
              signHereTabs: [{
                anchorString: 'CONTRATADA',
                anchorUnits: 'words',
                anchorXOffset: '0',
                anchorYOffset: '30',
              }],
            },
          },
        ],
      },
      status: 'sent',
    }

    const envelopeRes = await fetch(
      `${baseUrl}/restapi/v2.1/accounts/${accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      },
    )

    if (!envelopeRes.ok) {
      const err = await envelopeRes.text()
      return NextResponse.json({ error: `DocuSign error: ${err}` }, { status: 500 })
    }

    const { envelopeId } = await envelopeRes.json()
    return NextResponse.json({ envelopeId })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    if (msg === 'DOCUSIGN_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'DOCUSIGN_NOT_CONFIGURED' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
