import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function PATCH(request: Request) {
  try {
    const { getToken } = await auth()
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { student_id, ...noteData } = body
    if (!student_id) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const res = await fetch(`${BACKEND_URL}/api/teacher/students/${student_id}/diary-note`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    })
    if (res.ok) return NextResponse.json(await res.json())
    return NextResponse.json({ error: 'Failed to save' }, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
