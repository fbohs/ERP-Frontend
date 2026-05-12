import { render, screen } from '@testing-library/react'
import { Navbar } from './index'
import type { User } from '@/types'

const mockUser: User = {
  id: '1',
  name: 'Alex Kim',
  email: 'alex@example.com',
  role: 'ADMIN',
  avatarUrl: '',
}

describe('Navbar', () => {
  it('renders the logo', () => {
    render(<Navbar user={mockUser} onLogout={vi.fn()} />)
    expect(screen.getByRole('link', { name: /erp/i })).toBeInTheDocument()
  })

  it('renders the search bar', () => {
    render(<Navbar user={mockUser} onLogout={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('does not render user button when user is null', () => {
    render(<Navbar user={null} onLogout={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
