import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithAdminContext } from '@/tests/utils/render-admin';
import { UserList } from '../UserList';

const mockUsers = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@mfb.com',
    role: 'admin',
    disabled: false,
    created_at: '2024-01-01',
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@mfb.com',
    role: 'rep',
    disabled: false,
    created_at: '2024-02-01',
  },
];

describe('UserList', () => {
  it('renders team management heading', async () => {
    renderWithAdminContext(<UserList />, {
      dataProvider: {
        getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
      },
      resource: 'sales',
    });

    expect(
      await screen.findByRole('heading', { name: /team management/i })
    ).toBeInTheDocument();
  });

  it('displays users in datagrid', async () => {
    renderWithAdminContext(<UserList />, {
      dataProvider: {
        getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
      },
      resource: 'sales',
    });

    await waitFor(() => {
      expect(screen.getByText('john@mfb.com')).toBeInTheDocument();
      expect(screen.getByText('jane@mfb.com')).toBeInTheDocument();
    });
  });

  it('shows invite button', async () => {
    renderWithAdminContext(<UserList />, {
      dataProvider: {
        getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
      },
      resource: 'sales',
    });

    expect(
      await screen.findByRole('button', { name: /invite/i })
    ).toBeInTheDocument();
  });

  it('displays role badges with correct styling', async () => {
    renderWithAdminContext(<UserList />, {
      dataProvider: {
        getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
      },
      resource: 'sales',
    });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Rep')).toBeInTheDocument();
    });
  });
});
