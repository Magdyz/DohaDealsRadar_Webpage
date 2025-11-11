import { useState, useEffect } from 'react'
import { getDeviceId } from '@/lib/utils/deviceId'

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('')

  useEffect(() => {
    // Get device ID on client side only
    setDeviceId(getDeviceId())
  }, [])

  return deviceId
}
