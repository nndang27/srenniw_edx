import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const semester = searchParams.get('semester')

  const data = await dataService.getTranscript()
  if (!data) return NextResponse.json({ error: 'Data not found' }, { status: 404 })

  if (Array.isArray(data)) {
    if (year && semester) {
      const match = data.find((d: { year: string; semester: string }) => d.year === year && d.semester === semester)
      if (!match) {
        return NextResponse.json({ year, semester, status: 'future', grades: [] })
      }
      return NextResponse.json(match)
    }
    return NextResponse.json(data[0])
  }

  return NextResponse.json(data)
}
