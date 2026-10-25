import AuthShell from '@/components/AuthShell'
import LoginForm from './LoginForm'
import { getContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; link?: string } }) {
  const content = await getContent(['login.title', 'login.subtitle'])

  return (
    <AuthShell title={content['login.title']} subtitle={content['login.subtitle']}>
      <LoginForm next={searchParams.next ?? null} linkExpired={searchParams.link === 'expired'} />
    </AuthShell>
  )
}
