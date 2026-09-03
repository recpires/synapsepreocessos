/**
 * Dono da Central pessoal.
 *
 * Mora num módulo próprio porque duas camadas precisam do mesmo valor: a
 * página, que decide se a rota existe, e a Sidebar, que decide se o link
 * aparece. Duplicar a string faria o link sobreviver a uma troca de dono e
 * levar a um 404.
 *
 * Comparar sempre em minúsculas: e-mail não diferencia caixa, e um cadastro
 * com maiúscula trancaria o próprio dono para fora.
 */
export const DONO_DA_CENTRAL = 'rec.pires7@gmail.com'

export function ehDonoDaCentral(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === DONO_DA_CENTRAL
}
