import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { backendFetch } from '@/lib/backendFetch'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const studentId = url.searchParams.get('studentId')

  try {
    const { getToken } = await auth()
    const token = await getToken()

    if (token) {
      // Proxy to FastAPI — returns journal entries from student_diaries table
      const res = await backendFetch(`${BACKEND_URL}/api/parent/diary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(Array.isArray(data) ? data : [])
      }
    }
  } catch {
    // Fall through to mock data
  }

  // Fallback: mock data from file
  let data = await dataService.getDailyInsights()
  if (!data) return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  if (studentId) {
    data = (data as any[]).filter((item: any) => item.studentId === studentId)
  }
  return NextResponse.json(data)
}
