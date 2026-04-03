import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockSubmit = vi.fn().mockResolvedValue({ brief_id: 'brief-123', status: 'pending' })
vi.mock('@/lib/api', () => ({ useApi: () => ({ submitCompose: mockSubmit }) }))

import ComposeForm from '@/components/teacher/ComposeForm'

// Helper: get the main message textarea (not subject/year inputs)
const getTextarea = () => screen.getByPlaceholderText(/write your message/i)

describe('ComposeForm', () => {
  beforeEach(() => mockSubmit.mockClear())

  it('renders all form fields', () => {
    render(<ComposeForm classId="class-1" />)
    expect(getTextarea()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send to parents/i })).toBeInTheDocument()
  })

  it('disables submit when textarea is empty', () => {
    render(<ComposeForm classId="class-1" />)
    const btn = screen.getByRole('button', { name: /send to parents/i })
    expect(btn).toBeDisabled()
  })

  it('enables submit when textarea has content', async () => {
    render(<ComposeForm classId="class-1" />)
    fireEvent.change(getTextarea(), { target: { value: 'This week we are learning fractions' } })
    const btn = screen.getByRole('button', { name: /send to parents/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls submitCompose on submit with correct data', async () => {
    render(<ComposeForm classId="class-1" />)
    fireEvent.change(getTextarea(), {
      target: { value: 'This week we are learning fractions' }
    })
    fireEvent.click(screen.getByRole('button', { name: /send to parents/i }))
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ raw_input: 'This week we are learning fractions', class_id: 'class-1' })
    ))
  })

  it('shows success message after submit', async () => {
    render(<ComposeForm classId="class-1" />)
    fireEvent.change(getTextarea(), { target: { value: 'Test content' } })
    fireEvent.click(screen.getByRole('button', { name: /send to parents/i }))
    await waitFor(() => expect(screen.getByText(/processing/i)).toBeInTheDocument())
  })
})
