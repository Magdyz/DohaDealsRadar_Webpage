import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, filename } = body

    if (!image || !filename) {
      return NextResponse.json(
        { message: 'Missing image or filename' },
        { status: 400 }
      )
    }

    // Convert base64 to blob
    const base64Data = image.split(',')[1]
    const mimeType = image.split(',')[0].split(':')[1].split(';')[0]

    // Decode base64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: mimeType })

    // Generate unique filename
    const fileExt = filename.split('.').pop()
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `images/${uniqueFilename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('deals')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { message: 'Failed to upload image', error: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('deals')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
