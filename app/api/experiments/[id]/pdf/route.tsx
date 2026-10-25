import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { guardExperiment } from '@/lib/experiments/guard'
import { RoomTestPdf } from '@/lib/pdf/RoomTestPdf'
import { answersSchema, resultSchema } from '@/lib/experiments/room-test/schema'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const guard = await guardExperiment(params.id)
  if ('error' in guard) return guard.error
  const { session, experiment, supabase } = guard

  if (experiment.slug !== 'the-room-test') {
    return NextResponse.json({ error: 'Not available for this experiment yet.' }, { status: 400 })
  }

  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase.from('experiment_progress').select('answers, draft_result, approved_result').eq('user_id', session.userId).eq('experiment_id', experiment.id).single(),
    supabase.from('profiles').select('brand_name').eq('id', session.userId).single(),
  ])

  const result = resultSchema.safeParse(progress?.draft_result ?? progress?.approved_result)
  const answers = answersSchema.safeParse(progress?.answers ?? {})
  if (!result.success || !answers.success) {
    return NextResponse.json({ error: 'Generate your results before downloading.' }, { status: 400 })
  }

  try {
    const buffer = await renderToBuffer(
      <RoomTestPdf result={result.data} answers={answers.data} brandName={profile?.brand_name ?? null} />
    )
    const name = (profile?.brand_name ?? 'brand').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'brand'
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="brand-identity-snapshot-${name}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF failed', error)
    return NextResponse.json({ error: 'Could not create the PDF. Please try again.' }, { status: 500 })
  }
}
