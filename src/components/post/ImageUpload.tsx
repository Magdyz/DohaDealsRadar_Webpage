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
      <label className="block text-sm font-medium text-text-primary mb-2">
        Deal Image *
      </label>

      {preview ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
          <Image
            src={preview}
            alt="Deal preview"
            fill
            unoptimized
            className="object-contain"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
            error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-text-secondary">
                Compressing and uploading...
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-medium text-text-primary mb-1">
                Click to upload image
              </p>
              <p className="text-sm text-text-tertiary">
                PNG, JPG, WEBP up to 10MB
              </p>
              <p className="text-xs text-text-tertiary mt-2">
                Image will be automatically compressed
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
        <p className="mt-2 text-sm text-red-600">{error || uploadError}</p>
      )}

      <p className="mt-2 text-xs text-text-tertiary">
        High-quality images get more attention and votes!
      </p>
    </div>
  )
}
