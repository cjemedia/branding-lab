export default function Banner({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        tone === 'error' ? 'bg-red-50 text-red-800' : 'bg-tiffany-soft text-ink'
      }`}
    >
      {children}
    </p>
  )
}
