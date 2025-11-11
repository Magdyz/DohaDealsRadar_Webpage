import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// In-memory storage for verification codes (for demo purposes)
// In production, use Redis or database with expiry
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store code with 10 minute expiry
    const expiresAt = Date.now() + 10 * 60 * 1000
    verificationCodes.set(email.toLowerCase(), { code, expiresAt })

    // Clean up expired codes
    for (const [key, value] of verificationCodes.entries()) {
      if (value.expiresAt < Date.now()) {
        verificationCodes.delete(key)
      }
    }

    // Always log to console for debugging
    console.log(`\n🔐 Verification Code for ${email}: ${code}\n`)

    // Send email if Resend API key is configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key') {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'DohaDealsRadar <onboarding@resend.dev>',
          to: email,
          subject: 'Your Doha Deals Radar Verification Code',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .code-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                  .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">🎉 Doha Deals Radar</h1>
                    <p style="margin: 10px 0 0 0;">Verification Code</p>
                  </div>
                  <div class="content">
                    <p>Hello!</p>
                    <p>Here's your verification code to sign in to Doha Deals Radar:</p>
                    <div class="code-box">
                      <div class="code">${code}</div>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this code, you can safely ignore this email.</p>
                    <div class="footer">
                      <p>© ${new Date().getFullYear()} Doha Deals Radar. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        })

        console.log(`✅ Email sent successfully to ${email}`)
      } catch (emailError: any) {
        console.error('❌ Failed to send email:', emailError)
        // Don't fail the request if email fails - user can still use console code
        console.log('⚠️  Falling back to console-only verification')
      }
    } else {
      console.log('⚠️  RESEND_API_KEY not configured - using console-only mode')
      console.log('   To enable email sending, add RESEND_API_KEY to .env.local')
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      // For demo purposes only - remove in production!
      devCode: process.env.NODE_ENV === 'development' ? code : undefined,
    })
  } catch (error: any) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Export the map for use in verify-code route
export { verificationCodes }
