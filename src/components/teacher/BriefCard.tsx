import type { Brief, BriefStatus } from '@/types'
import { formatDate } from '@/lib/utils'

const statusConfig: Record<BriefStatus, { label: string; className: string }> = {
  pending:    { label: 'Pending',      className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  processing: { label: 'Processing…',  className: 'bg-[#eef2ff] text-[#446dd5] border border-[#c3d3fb]' },
  done:       { label: 'Published',    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  failed:     { label: 'Failed',       className: 'bg-red-50 text-red-700 border border-red-200' },
}

const contentTypeLabel: Record<string, string> = {
  assignment:    'Assignment',
  comment:       'Comment',
  weekly_update: 'Weekly Update',
}

interface Props {
  brief: Brief
  feedbackCount?: number
}

export default function BriefCard({ brief, feedbackCount = 0 }: Props) {
  const status = statusConfig[brief.status]

  return (
    <div className="border border-[#eeeeee] rounded-2xl p-5 bg-white hover:border-[#c3d3fb] hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#446dd5] bg-[#eef2ff] px-2.5 py-1 rounded-lg">
            {contentTypeLabel[brief.content_type] || brief.content_type}
          </span>
          {brief.subject && (
            <span className="text-xs text-[#999]">{brief.subject} · {brief.year_level}</span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-[#555] line-clamp-2 mb-3 leading-relaxed">{brief.raw_input}</p>

      {brief.status === 'done' && brief.processed_en && (
        <div className="mt-2 bg-[#f7f8fc] rounded-xl p-3 border border-[#eeeeee]">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-1.5">AI Simplified</p>
          <p className="text-sm text-[#555] line-clamp-3 leading-relaxed">{brief.processed_en}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-xs text-[#999]">
        <span>{formatDate(brief.created_at)}</span>
        {feedbackCount > 0 && (
          <span className="text-[#446dd5] font-medium">
            {feedbackCount} parent {feedbackCount === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>
    </div>
  )
}
