import { create } from 'zustand'
import type { ToastVariant } from '@/components/ui/Toast'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message: string, variant: ToastVariant = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant, duration }],
    }))
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
  clearAll: () => {
    set({ toasts: [] })
  },
}))

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore()

  return {
    toast: {
      success: (message: string, duration?: number) => addToast(message, 'success', duration),
      error: (message: string, duration?: number) => addToast(message, 'error', duration),
      info: (message: string, duration?: number) => addToast(message, 'info', duration),
      warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    },
    removeToast,
    clearAll,
  }
}
