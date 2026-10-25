// Branded Lab emails. Plain, mobile friendly HTML with inline styles.

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout(heading: string, body: string, buttonText: string, buttonUrl: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F5F0E8;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;">
          <tr><td style="padding:32px 32px 8px;">
            <p style="margin:0;font-size:11px;letter-spacing:2px;color:#81D8D0;">CJE MEDIA PRESENTS</p>
            <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#FFFFFF;">THE BRANDING LAB.</p>
          </td></tr>
          <tr><td style="padding:16px 32px 32px;color:#FFFFFF;">
            <p style="margin:0 0 12px;font-size:18px;font-weight:600;">${heading}</p>
            <div style="font-size:14px;line-height:1.6;color:#E8E8E8;">${body}</div>
            <p style="margin:28px 0 0;">
              <a href="${buttonUrl}" style="display:inline-block;background:#81D8D0;color:#111111;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;">${buttonText}</a>
            </p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#6B6560;">Where creativity meets strategy.</p>
      </td></tr>
    </table>
  </body>
</html>`
}

export function inviteEmail(name: string | null, url: string) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  return {
    subject: 'Your Branding Lab access is ready',
    html: layout(
      'Your Branding Lab access is ready',
      `<p style="margin:0 0 12px;">${greeting}</p><p style="margin:0;">Set your password to open your Brand Builder dashboard. This link expires in 24 hours.</p>`,
      'Set My Password',
      url
    ),
  }
}

export function existingAccountEmail(name: string | null, url: string) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  return {
    subject: 'Your Branding Lab access is ready',
    html: layout(
      'Your Branding Lab access is ready',
      `<p style="margin:0 0 12px;">${greeting}</p><p style="margin:0;">You already have a CJE Media login, so use the same email and password to sign in to The Branding Lab.</p>`,
      'Open The Branding Lab',
      url
    ),
  }
}

export function resetEmail(url: string) {
  return {
    subject: 'Reset your Branding Lab password',
    html: layout(
      'Reset your password',
      `<p style="margin:0;">Use the button below to choose a new password. This link expires in 24 hours. If you didn't ask for this, you can ignore this email.</p>`,
      'Choose a New Password',
      url
    ),
  }
}
