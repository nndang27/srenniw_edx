import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

export async function GET() {
  const data = await dataService.getUsers()
  if (!data) return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  return NextResponse.json(data)
}
