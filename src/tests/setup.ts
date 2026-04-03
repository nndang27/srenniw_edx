import '@testing-library/jest-dom'

// Mock Clerk for all tests
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'test-user', publicMetadata: { role: 'teacher' } }, isLoaded: true }),
  useAuth: () => ({ getToken: async () => 'mock-token' }),
  ClerkProvider: ({ children }: any) => children,
  SignedIn: ({ children }: any) => children,
  SignedOut: () => null,
  UserButton: () => null,
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}))
