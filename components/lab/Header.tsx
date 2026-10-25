import Link from 'next/link'
import { LogOut } from 'lucide-react'

export default function Header({ brandName, isAdmin }: { brandName: string; isAdmin: boolean }) {
  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-sm font-bold tracking-tight">
          {brandName}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-white">
            Dashboard
          </Link>
          <Link href="/blueprint" className="rounded-full px-3 py-2 hover:bg-white">
            Blueprint
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="rounded-full px-3 py-2 hover:bg-white">
              Admin
            </Link>
          ) : null}
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="flex items-center gap-2 rounded-full px-3 py-2 text-muted hover:bg-white hover:text-ink" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
