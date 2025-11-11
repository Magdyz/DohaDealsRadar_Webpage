import { NextRequest, NextResponse } from 'next/server'

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

    // In production, send email here using SendGrid, AWS SES, etc.
    // For development, log the code to console
    console.log(`\n🔐 Verification Code for ${email}: ${code}\n`)

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
