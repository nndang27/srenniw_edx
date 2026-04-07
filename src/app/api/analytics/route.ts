import { NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'

export async function GET() {
  try {
    const data = await dataService.getAnalytics()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

export async function POST() {
  // Insights POST API expects entries but we just return the precomputed mock
  try {
    const data = await dataService.getAnalytics()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
