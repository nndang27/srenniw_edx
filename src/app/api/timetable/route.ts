import { NextResponse } from 'next/server'
import { mockTimetable } from '@/lib/mockTimetable'

export async function GET() {
  return NextResponse.json(mockTimetable)
}
