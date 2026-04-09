import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { backendFetch } from '@/lib/backendFetch'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

async function fetchAnalytics(): Promise<NextResponse> {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    if (token) {
      // Proxy to FastAPI — computes insights from student_diaries table
      const res = await backendFetch(`${BACKEND_URL}/api/parent/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        return NextResponse.json(await res.json())
      }
    }
  } catch {
    // Fall through to mock data
  }

  // Fallback: pre-computed mock analytics
  const data = await dataService.getAnalytics()
  return NextResponse.json(data)
}

export async function GET() {
  return fetchAnalytics()
}

export async function POST() {
  return fetchAnalytics()
}
