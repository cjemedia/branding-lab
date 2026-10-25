import 'server-only'
import { Resend } from 'resend'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    throw new Error('Email is not configured (RESEND_API_KEY and EMAIL_FROM).')
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) throw new Error(error.message)
}
