import Link from 'next/link'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Members' },
  { href: '/admin/experiments', label: 'Experiments' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/activity', label: 'Activity' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold tracking-label text-tiffany">THE BRANDING LAB.</p>
            <p className="text-sm font-bold">Admin</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 hover:bg-white/10">
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard" className="rounded-full px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white">
              Student view
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
