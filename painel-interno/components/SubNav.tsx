'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SubNavTab } from '@/lib/nav'

export default function SubNav({ tabs }: { tabs: readonly SubNavTab[] }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1 w-fit max-w-full overflow-x-auto print:hidden">
      {tabs.map(t => {
        const isActive = pathname === t.href || pathname.startsWith(t.href + '/')
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1e1e2e]'
            }`}
          >
            {t.icon && <span className="text-sm leading-none">{t.icon}</span>}
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
