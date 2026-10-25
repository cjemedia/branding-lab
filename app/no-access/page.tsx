import AuthShell from '@/components/AuthShell'

export default function NoAccessPage() {
  return (
    <AuthShell title="No Branding Lab access" subtitle="This login doesn't have Branding Lab access yet.">
      <p className="text-sm text-white/80">
        Branding Lab access comes with an active membership in the Skool community. If you just joined, your
        invite email may still be on its way.
      </p>
      <form action="/api/auth/signout" method="post" className="mt-8">
        <button type="submit" className="btn-ghost w-full">
          Sign Out
        </button>
      </form>
    </AuthShell>
  )
}
