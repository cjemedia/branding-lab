export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-dark px-8 pb-8 pt-10">
          <p className="text-[11px] font-semibold tracking-label text-tiffany">CJE MEDIA PRESENTS</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{title}</h1>
          <div className="mt-3 h-px w-12 bg-tiffany" />
          {subtitle ? <p className="mt-4 text-sm text-white/70">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  )
}
