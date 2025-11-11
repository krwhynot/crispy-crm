import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalCard } from '../PrincipalCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockPrincipal = {
  id: '1',
  name: 'Brand A',
  tasks: [
    { id: '1', title: 'Call about pricing', due_date: '2025-11-06', status: 'Active' },
    { id: '2', title: 'Send samples', due_date: '2025-11-06', status: 'Active' }
  ],
  activities: [
    { id: '1', type: 'Call', created_at: '2025-11-04T10:00:00Z' },
    { id: '2', type: 'Email', created_at: '2025-11-03T14:00:00Z' },
    { id: '3', type: 'Call', created_at: '2025-11-02T09:00:00Z' }
  ],
  topOpportunity: {
    id: '1',
    name: 'Restaurant ABC',
    estimated_close_date: '2025-12-15',
    stage: 'Negotiation'
  },
  priority: 'high' as const
};

describe('PrincipalCard', () => {
  it('should render principal name', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('Brand A')).toBeInTheDocument();
  });

  it('should display task count', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
  });

  it('should display activity count', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText(/3 activities/)).toBeInTheDocument();
  });

  it('should display top opportunity', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('Restaurant ABC')).toBeInTheDocument();
    expect(screen.getByText(/Negotiation.*Close:/)).toBeInTheDocument();
  });

  it('should have action buttons', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('View All Tasks')).toBeInTheDocument();
    expect(screen.getByText('View Opportunities')).toBeInTheDocument();
  });

  it('should navigate to tasks on View All Tasks click', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    const button = screen.getByText('View All Tasks');
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      state: { principalFilter: '1' }
    }));
  });

  it('should render priority indicator', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByTestId('priority-indicator')).toBeInTheDocument();
  });
});