import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const semester = searchParams.get('semester') || 'Semester 1'

  try {
    const { getToken } = await auth()
    const token = await getToken()
    if (token) {
      const res = await fetch(
        `${BACKEND_URL}/api/parent/transcript?year=${year}&semester=${encodeURIComponent(semester)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) return NextResponse.json(await res.json())
    }
  } catch { /* fall through */ }

  // Fallback: mock file
  const data = await dataService.getTranscript()
  if (!data) return NextResponse.json({ year, semester, status: 'future', grades: [] })
  if (Array.isArray(data)) {
    const match = data.find((d: { year: string; semester: string }) => d.year === year && d.semester === semester)
    return NextResponse.json(match ?? { year, semester, status: 'future', grades: [] })
  }
  return NextResponse.json(data)
}
