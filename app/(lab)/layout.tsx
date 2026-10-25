import Header from '@/components/lab/Header'
import { getLabSession } from '@/lib/session'
import { getContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const [session, content] = await Promise.all([getLabSession(), getContent(['brand.name'])])

  return (
    <div className="min-h-screen">
      <Header brandName={content['brand.name']} isAdmin={session?.profile?.role === 'admin'} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  )
}
