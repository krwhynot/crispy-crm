import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecentActivityFeed } from '../RecentActivityFeed';
import { TestMemoryRouter } from 'ra-core';

vi.mock('ra-core', () => ({
  useGetList: vi.fn(),
  TestMemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecentActivityFeed', () => {
  beforeEach(() => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      error: null,
    });
  });

  it('should render widget title with count badge', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          type: 'Call',
          principal_name: 'Acme Corp',
          created_at: new Date().toISOString(),
          notes: 'Discussed pricing',
        },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <RecentActivityFeed />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show loading skeleton', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: true,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <RecentActivityFeed />
      </TestMemoryRouter>
    );

    expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument();
  });

  it('should display activities with icon and relative timestamp', () => {
    const { useGetList } = require('ra-core');
    const now = new Date();

    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          type: 'Call',
          principal_name: 'Acme Corp',
          created_at: now.toISOString(),
          notes: 'Discussed pricing',
        },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <RecentActivityFeed />
      </TestMemoryRouter>
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('now')).toBeInTheDocument();
  });
});
