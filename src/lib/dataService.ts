import { promises as fs } from 'fs'
import path from 'path'

// Mock Data Path
// const DATA_DIR = '../../backend/tests/data'
const DATA_DIR = path.join(process.cwd(), 'backend/tests/data');

export async function readMockFile<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(DATA_DIR, filename)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return null
  }
}

// Data API calls
export const dataService = {
  getUsers: () => readMockFile<any>('sample_users.json'),
  getCurriculum: () => readMockFile<any[]>('sample_curriculum.json'),
  getDailyInsights: () => readMockFile<any[]>('mock_data_400days.json'),
  getTranscript: () => readMockFile<any>('sample_transcript.json'),
  getTimetable: () => readMockFile<any>('sample_timetable.json'),
  getActivities: () => readMockFile<any>('sample_activities.json'),
  getAnalytics: () => readMockFile<any>('sample_analytics_insights.json'),
}
