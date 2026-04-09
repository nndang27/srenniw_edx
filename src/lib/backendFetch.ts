/**
 * Wraps fetch with a 3s timeout so Vercel serverless functions don't hang
 * when the local backend (localhost:8000) is unreachable.
 * On timeout or any network error the caller's catch block fires immediately,
 * allowing fallback to mock data.
 */
export async function backendFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
