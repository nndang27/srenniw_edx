// Static JSON imports — bundled by Next.js/webpack, works on Vercel
import sampleUsers from '../data/sample_users.json'
import sampleCurriculum from '../data/sample_curriculum.json'
import sampleActivities from '../data/sample_activities.json'
import sampleTranscript from '../data/sample_transcript.json'
import sampleTimetable from '../data/sample_timetable.json'
import sampleAnalytics from '../data/sample_analytics_insights.json'
import mockData400days from '../data/mock_data_400days.json'

export const dataService = {
  getUsers: () => Promise.resolve(sampleUsers as any),
  getCurriculum: () => Promise.resolve(sampleCurriculum as any[]),
  getDailyInsights: () => Promise.resolve(mockData400days as any[]),
  getTranscript: () => Promise.resolve(sampleTranscript as any),
  getTimetable: () => Promise.resolve(sampleTimetable as any),
  getActivities: () => Promise.resolve(sampleActivities as any),
  getAnalytics: () => Promise.resolve(sampleAnalytics as any),
}
