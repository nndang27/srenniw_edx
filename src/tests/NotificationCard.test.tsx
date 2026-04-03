import { render, screen, fireEvent } from '@testing-library/react'
import NotificationCard from '@/components/parent/NotificationCard'

const mockNotification = {
  notification_id: 'notif-1',
  is_read: false,
  created_at: '2025-01-15T10:00:00Z',
  brief: {
    id: 'brief-1',
    content_type: 'assignment' as const,
    content: 'This week your child is learning fractions.',
    at_home_activities: [
      { title: 'Pizza fractions', description: 'Cut paper into 8 pieces', duration_mins: 10 }
    ],
    published_at: '2025-01-15T09:00:00Z',
    raw_input: '', subject: 'Math', year_level: 'Year 4', status: 'done' as const, created_at: ''
  }
}

describe('NotificationCard', () => {
  it('renders the brief content', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    expect(screen.getByText(/fractions/i)).toBeInTheDocument()
  })

  it('renders at-home activities when expanded', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    fireEvent.click(screen.getByText(/fractions/i))
    expect(screen.getByText(/Pizza fractions/i)).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument()
  })

  it('shows unread indicator when is_read is false', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument()
  })

  it('calls onRead when opened', () => {
    const onRead = vi.fn()
    render(<NotificationCard notification={mockNotification} onRead={onRead} onFeedback={vi.fn()} />)
    fireEvent.click(screen.getByText(/fractions/i))
    expect(onRead).toHaveBeenCalledWith('notif-1')
  })

  it('shows feedback form on reply click', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    fireEvent.click(screen.getByText(/fractions/i))  // expand first
    fireEvent.click(screen.getByRole('button', { name: /reply to teacher/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
