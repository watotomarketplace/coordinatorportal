import nodemailer from 'nodemailer'

// Create transporter from env vars
let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user, pass }
  })
  return transporter
}

/**
 * Send login credentials email to a new user
 */
export async function sendLoginEmail({ email, name, username, password, role, celebrationPoint }) {
  const transport = getTransporter()
  if (!transport) {
    console.warn('[email] SMTP not configured — skipping email to', email)
    return { sent: false, reason: 'SMTP not configured' }
  }

  const from = process.env.SMTP_FROM || 'WL101 Portal <noreply@watotochurch.com>'
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000'

  const html = `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#1a1a2e;color:#e0e0e0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Welcome to WL101 Portal</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your account has been created</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="margin:0 0 20px;color:#ccc;font-size:15px;">Hi <strong style="color:white;">${name}</strong>,</p>
        <p style="margin:0 0 20px;color:#aaa;font-size:14px;">Your WL101 Coordinator Portal account is ready. Use the credentials below to log in:</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px 8px 0 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Username</td>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px 8px 0 0;color:white;font-size:15px;font-weight:600;">${username}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.03);color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Password</td>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.03);color:#56CCF2;font-size:15px;font-family:monospace;font-weight:600;">${password}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.05);color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Role</td>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.05);color:#30d158;font-size:14px;font-weight:500;">${role}</td>
          </tr>
          ${celebrationPoint ? `<tr>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:0 0 8px 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Campus</td>
            <td style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:0 0 8px 8px;color:#ffd60a;font-size:14px;">${celebrationPoint}</td>
          </tr>` : ''}
        </table>
        <a href="${portalUrl}" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">Log in to Portal →</a>
        <p style="margin:20px 0 0;color:#666;font-size:12px;text-align:center;">Please change your password after your first login.</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#555;font-size:11px;">Watoto Church · WL101 Coordinator Portal</p>
      </div>
    </div>
  `

  try {
    await transport.sendMail({
      from,
      to: email,
      subject: `Your WL101 Portal Account — ${username}`,
      html
    })
    return { sent: true }
  } catch (err) {
    console.error('[email] Failed to send to', email, err.message)
    return { sent: false, reason: err.message }
  }
}

/**
 * Check if SMTP is configured
 */
export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
