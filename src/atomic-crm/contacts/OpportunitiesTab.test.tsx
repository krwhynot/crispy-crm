import { render, screen, waitFor } from '@testing-library/react';
import { ShowContextProvider } from 'ra-core';
import { OpportunitiesTab } from './OpportunitiesTab';

const mockContact = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  organization_id: 100,
  organization: { name: 'Acme Corp' }
};

const mockUseGetList = vi.fn();

vi.mock('ra-core', async () => {
  const actual = await vi.importActual('ra-core');
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
  };
});

describe('OpportunitiesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no opportunities linked', async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no opportunities linked/i)).toBeInTheDocument();
    });
  });
});
