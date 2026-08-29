/**
 * Junta classes ignorando falsy. Sem dependência externa — o painel não usa
 * clsx nem tailwind-merge, então classes conflitantes são responsabilidade de
 * quem chama (a última do array vence só se o Tailwind gerar nessa ordem).
 */
export function cn(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}
