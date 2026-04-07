import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { mockTimetable } from '@/lib/mockTimetable'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const { getToken } = await auth()
    const token = await getToken()
    if (token) {
      const res = await fetch(`${BACKEND_URL}/api/parent/timetable`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) return NextResponse.json(await res.json())
    }
  } catch {
    // fall through
  }
  // Fallback: static mock (used when not authenticated or backend unavailable)
  return NextResponse.json(mockTimetable)
}
