import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backendFetch'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const { getToken } = await auth()
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await backendFetch(`${BACKEND_URL}/api/teacher/students/${studentId}/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) return NextResponse.json(await res.json())
    return NextResponse.json({ error: 'Failed to load insights' }, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
