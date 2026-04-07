import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const classId = url.searchParams.get('classId')

  let data = await dataService.getCurriculum()
  if (!data) return NextResponse.json({ error: 'Data not found' }, { status: 404 })

  if (classId) {
    data = data.filter(item => item.classId === classId)
  }

  return NextResponse.json(data)
}
