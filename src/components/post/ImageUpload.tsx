'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import imageCompression from 'browser-image-compression'
import { uploadImage } from '@/lib/api/deals'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  error?: string
}

export default function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [preview, setPreview] = useState(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: 0.7,
      }

      const compressedFile = await imageCompression(file, options)

      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreview(previewUrl)

      // Upload to server
      const result = await uploadImage(compressedFile)
      onChange(result.url)
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image')
      setPreview('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <label className="block text-base font-semibold text-text-primary mb-3">
        Deal Image *
      </label>

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-border shadow-sm">
          <Image
            src={preview}
            alt="Deal preview"
            fill
            unoptimized
            className="object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 p-2 bg-error text-white rounded-full hover:bg-error/90 transition-all shadow-md hover:shadow-lg active:scale-95"
            disabled={isUploading}
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all',
            error
              ? 'border-error bg-error/5 hover:bg-error/10'
              : 'border-border hover:border-primary hover:bg-primary/5',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Spinner size="lg" />
              <p className="mt-3 text-sm font-medium text-text-secondary">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ImageIcon className="w-7 h-7 text-primary" />
              </div>
              <p className="text-base font-semibold text-text-primary mb-1">
                Upload Image
              </p>
              <p className="text-sm text-text-secondary">
                PNG, JPG, WEBP • Max 10MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {(error || uploadError) && (
        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-sm font-medium text-error">{error || uploadError}</p>
        </div>
      )}

      <p className="mt-2 text-sm text-text-secondary">
        High-quality images get more attention and votes!
      </p>
    </div>
  )
}
