import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserInviteForm } from '../UserInviteForm';

// Create a simple mock for React Admin hooks
vi.mock('react-admin', () => ({
  useDataProvider: () => ({
    inviteUser: mockInviteUser,
  }),
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
}));

const mockInviteUser = vi.fn();
const mockNotify = vi.fn();
const mockRefresh = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('UserInviteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInviteUser.mockReset();
    mockNotify.mockReset();
    mockRefresh.mockReset();
  });

  it('renders all required fields', () => {
    render(<UserInviteForm open onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('defaults role to rep', () => {
    render(<UserInviteForm open onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    // The select should display "Rep" as default
    expect(screen.getByText('Rep')).toBeInTheDocument();
  });

  it('submits form data to inviteUser', async () => {
    const user = userEvent.setup();
    mockInviteUser.mockResolvedValue({ data: { id: 1 } });
    const mockOnClose = vi.fn();

    render(<UserInviteForm open onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText(/email/i), 'new@mfb.com');
    await user.type(screen.getByLabelText(/first name/i), 'New');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    await user.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => {
      expect(mockInviteUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@mfb.com',
          first_name: 'New',
          last_name: 'User',
          role: 'rep',
        })
      );
    });
  });

  it('displays error message on invite failure', async () => {
    const user = userEvent.setup();
    mockInviteUser.mockRejectedValue(new Error('Email already exists'));

    render(<UserInviteForm open onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText(/email/i), 'existing@mfb.com');
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    await user.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    render(<UserInviteForm open onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
