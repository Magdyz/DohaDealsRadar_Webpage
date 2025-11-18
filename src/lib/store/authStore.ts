import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  setUser: (user: User | null) => void
  login: (user: User, accessToken?: string, refreshToken?: string) => void
  logout: () => void
  updateUsername: (username: string) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  getAccessToken: () => string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          isAuthenticated: true,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        }),

      updateUsername: (username) =>
        set((state) => ({
          user: state.user ? { ...state.user, username } : null,
        })),

      updateTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'doha-deals-auth',
    }
  )
)

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useUserRole = (): UserRole | null => {
  const user = useUser()
  return user?.role || null
}
export const useIsModerator = () => {
  const role = useUserRole()
  return role === 'moderator' || role === 'admin'
}
export const useIsAdmin = () => {
  const role = useUserRole()
  return role === 'admin'
}
