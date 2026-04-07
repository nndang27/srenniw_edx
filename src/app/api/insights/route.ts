import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const studentId = url.searchParams.get('studentId')

  let data = await dataService.getDailyInsights()
  if (!data) return NextResponse.json({ error: 'Data not found' }, { status: 404 })

  if (studentId) {
    data = data.filter(item => item.studentId === studentId)
  }

  return NextResponse.json(data)
}
