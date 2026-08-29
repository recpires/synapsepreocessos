'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/overview')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ground">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Synapse Code" width={56} height={56} className="rounded-xl" />
          </div>
          <h1 className="text-xl font-bold text-fg">Synapse Code</h1>
          <p className="text-subtle text-sm mt-1">Painel Interno</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-surface border border-line rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-ground border border-line-strong rounded-lg px-3 py-2.5
                text-fg placeholder:text-subtle text-sm
                focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-ground border border-line-strong rounded-lg px-3 py-2.5
                text-fg placeholder:text-subtle text-sm
                focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-crit text-sm bg-crit-soft border border-crit-line rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50
              text-accent-fg font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-subtle text-xs mt-6">
          Acesso restrito — Synapse Code
        </p>
      </div>
    </div>
  )
}
