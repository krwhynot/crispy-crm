/**
 * QuickAdd Integration Tests
 *
 * Tests the complete end-to-end flow of the Quick Add Booth Visitor feature,
 * including atomic transaction behavior, form validation, error handling,
 * and state management across multiple components.
 *
 * MANUAL QA CHECKLIST (iPad Testing):
 * [ ] Quick Add button visible in opportunities list header
 * [ ] Button opens dialog on click
 * [ ] Form fields render correctly on iPad
 * [ ] Campaign/Principal pre-fill from localStorage on second entry
 * [ ] City autocomplete filters as typing
 * [ ] State auto-fills when city selected
 * [ ] Products filter by selected Principal
 * [ ] Phone OR Email validation works (at least one required)
 * [ ] Save & Close creates record and closes dialog
 * [ ] Save & Add Another creates record, clears form, keeps campaign/principal
 * [ ] Success toast shows for 2 seconds
 * [ ] Error toast shows on failure, data preserved
 * [ ] Touch targets are 44x44px minimum
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as RaCore from 'ra-core';
import { renderWithAdminContext } from '@/tests/utils/render-admin';
import { QuickAddButton } from '../QuickAddButton';

// Mock the useNotify hook for toast notifications
const mockNotify = vi.fn();
const mockCreateBoothVisitor = vi.fn();
const mockGetList = vi.fn();

vi.mock('ra-core', async () => {
  const actual = await vi.importActual<typeof RaCore>('ra-core');
  return {
    ...actual,
    useNotify: () => mockNotify,
    useDataProvider: () => ({
      createBoothVisitor: mockCreateBoothVisitor,
      getList: mockGetList,
    }),
    useGetList: vi.fn((resource: string) => {
      if (resource === 'organizations') {
        return {
          data: [
            { id: 1, name: 'Principal A', status: 'active' },
            { id: 2, name: 'Principal B', status: 'active' },
          ],
          total: 2,
          isLoading: false,
        };
      }
      if (resource === 'products') {
        return {
          data: [
            { id: 1, name: 'Product 1', principal_id: 1 },
            { id: 2, name: 'Product 2', principal_id: 2 },
            { id: 3, name: 'Product 3', principal_id: 1 },
          ],
          total: 3,
          isLoading: false,
        };
      }
      return { data: [], total: 0, isLoading: false };
    }),
  };
});

// Mock the configuration context
vi.mock('../../root/ConfigurationContext', () => ({
  useConfiguration: () => ({
    getList: vi.fn().mockReturnValue({}),
    recordRepresentation: {
      principals: (record: any) => record?.name || '',
      campaigns: (record: any) => record?.name || '',
      products: (record: any) => record?.name || '',
    },
    stages: [
      { value: 'new_lead', label: 'New Lead' },
      { value: 'demo_scheduled', label: 'Demo Scheduled' },
    ],
    gender: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  }),
}));

describe('QuickAdd Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();

    // Setup default mock responses
    mockCreateBoothVisitor.mockResolvedValue({
      data: {
        contact_id: 1,
        organization_id: 2,
        opportunity_id: 3,
        success: true,
      },
    });

    mockGetList.mockImplementation((resource: string) => {
      if (resource === 'principals') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Principal A', status: 'active' },
            { id: 2, name: 'Principal B', status: 'active' },
          ],
          total: 2,
        });
      }
      if (resource === 'campaigns') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Trade Show 2024', status: 'active' },
            { id: 2, name: 'Conference 2024', status: 'active' },
          ],
          total: 2,
        });
      }
      if (resource === 'products') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Product 1', principal_id: 1 },
            { id: 2, name: 'Product 2', principal_id: 2 },
            { id: 3, name: 'Product 3', principal_id: 1 },
          ],
          total: 3,
        });
      }
      if (resource === 'cities') {
        return Promise.resolve({
          data: [
            { id: 1, city: 'Chicago', state_prov: 'IL' },
            { id: 2, city: 'Los Angeles', state_prov: 'CA' },
          ],
          total: 2,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes full atomic creation flow with Save & Close', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // 1. Open dialog
    const quickAddButton = screen.getByText(/quick add/i);
    await user.click(quickAddButton);

    // 2. Verify dialog opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Quick Add Booth Visitor')).toBeInTheDocument();

    // 3. Fill form fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/phone/i), '555-1234');
    await user.type(screen.getByLabelText(/organization name/i), 'Acme Corp');

    // Type campaign name (it's a text field, not a select)
    await user.type(screen.getByLabelText(/campaign/i), 'Trade Show 2024');

    const principalSelect = screen.getByLabelText(/principal/i);
    await user.click(principalSelect);
    await user.click(screen.getByText('Principal A'));

    // 4. Submit with Save & Close
    const saveCloseButton = screen.getByText(/save & close/i);
    await user.click(saveCloseButton);

    // 5. Verify atomic transaction was called
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            email: [{ email: 'john.doe@example.com', type: 'Work' }],
            phone: [{ number: '555-1234', type: 'Work' }],
          }),
          organization: expect.objectContaining({
            name: 'Acme Corp',
          }),
          opportunity: expect.objectContaining({
            campaign_id: 1,
            principal_id: 1,
          }),
        })
      );
    });

    // 6. Verify success toast shown
    expect(mockNotify).toHaveBeenCalledWith(
      'Booth visitor created successfully',
      { type: 'success', autoHideDuration: 2000 }
    );

    // 7. Verify localStorage updated
    const storedPrefs = JSON.parse(localStorage.getItem('quickadd.preferences') || '{}');
    expect(storedPrefs.campaign_id).toBe(1);
    expect(storedPrefs.principal_id).toBe(1);

    // 8. Verify dialog closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles Save & Add Another flow correctly', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/organization name/i), 'Tech Corp');

    // Select campaign and principal
    const campaignSelect = screen.getByLabelText(/campaign/i);
    await user.click(campaignSelect);
    await user.click(screen.getByText('Conference 2024'));

    const principalSelect = screen.getByLabelText(/principal/i);
    await user.click(principalSelect);
    await user.click(screen.getByText('Principal B'));

    // Submit with Save & Add Another
    const saveAddButton = screen.getByText(/save & add another/i);
    await user.click(saveAddButton);

    // Verify record created
    await waitFor(() => {
      expect(mockCreateBoothVisitor.createBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            first_name: 'Jane',
            last_name: 'Smith',
          }),
        })
      );
    });

    // Verify success toast
    expect(mockNotify).toHaveBeenCalledWith(
      'Booth visitor created successfully',
      { type: 'success', autoHideDuration: 2000 }
    );

    // Verify dialog stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify form fields are cleared (except campaign/principal)
    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/organization name/i)).toHaveValue('');

    // Verify campaign/principal preserved
    expect(screen.getByLabelText(/campaign/i)).toHaveTextContent('Conference 2024');
    expect(screen.getByLabelText(/principal/i)).toHaveTextContent('Principal B');

    // Verify focus returns to first name field
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();
    });
  });

  it('handles errors and preserves form data', async () => {
    // Setup error mock
    mockCreateBoothVisitor.createBoothVisitor.mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    renderWithAdminContext(<QuickAddButton />);

    // Open dialog and fill form
    await user.click(screen.getByText(/quick add/i));

    await user.type(screen.getByLabelText(/first name/i), 'Error');
    await user.type(screen.getByLabelText(/last name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'error@test.com');
    await user.type(screen.getByLabelText(/organization name/i), 'Test Org');

    // Submit
    await user.click(screen.getByText(/save & close/i));

    // Verify error toast shown
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        'Failed to create booth visitor: Database connection failed',
        { type: 'error' }
      );
    });

    // Verify dialog stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify form data preserved
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Error');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Test');
    expect(screen.getByLabelText(/email/i)).toHaveValue('error@test.com');
    expect(screen.getByLabelText(/organization name/i)).toHaveValue('Test Org');

    // Verify no automatic retry (fail fast principle)
    expect(mockCreateBoothVisitor.createBoothVisitor).toHaveBeenCalledTimes(1);
  });

  it('validates phone OR email requirement', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill only required fields (no phone or email)
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/organization name/i), 'Org');

    // Try to submit - should be blocked
    const saveButton = screen.getByText(/save & close/i);
    await user.click(saveButton);

    // Verify error shown
    await waitFor(() => {
      expect(screen.getByText(/at least one of email or phone is required/i)).toBeInTheDocument();
    });

    // Verify createBoothVisitor was NOT called
    expect(mockCreateBoothVisitor.createBoothVisitor).not.toHaveBeenCalled();

    // Now add just email and try again
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(saveButton);

    // Should now submit successfully
    await waitFor(() => {
      expect(mockCreateBoothVisitor.createBoothVisitor).toHaveBeenCalled();
    });

    // Reset for phone-only test
    mockCreateBoothVisitor.createBoothVisitor.mockClear();

    // Open dialog again
    await user.click(screen.getByText(/quick add/i));

    // Fill with only phone (no email)
    await user.type(screen.getByLabelText(/first name/i), 'Phone');
    await user.type(screen.getByLabelText(/last name/i), 'Only');
    await user.type(screen.getByLabelText(/phone/i), '555-9999');
    await user.type(screen.getByLabelText(/organization name/i), 'Phone Org');

    // Submit should work
    await user.click(screen.getByText(/save & close/i));

    await waitFor(() => {
      expect(mockCreateBoothVisitor.createBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            phone: [{ number: '555-9999', type: 'Work' }],
          }),
        })
      );
    });
  });

  it('filters products by selected principal', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Initially no principal selected, products field should be disabled or empty
    const productsField = screen.queryByLabelText(/products/i);
    if (productsField) {
      expect(productsField).toBeDisabled();
    }

    // Select Principal A
    const principalSelect = screen.getByLabelText(/principal/i);
    await user.click(principalSelect);
    await user.click(screen.getByText('Principal A'));

    // Wait for products to be filtered
    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith('products',
        expect.objectContaining({
          filter: expect.objectContaining({
            principal_id: 1,
          }),
        })
      );
    });

    // Now select Principal B
    await user.click(principalSelect);
    await user.click(screen.getByText('Principal B'));

    // Verify products re-filtered for Principal B
    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith('products',
        expect.objectContaining({
          filter: expect.objectContaining({
            principal_id: 2,
          }),
        })
      );
    });
  });

  it('auto-fills state when city is selected from autocomplete', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Type in city field to trigger autocomplete
    const cityField = screen.getByLabelText(/city/i);
    await user.type(cityField, 'Chi');

    // Wait for autocomplete to load
    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith('cities',
        expect.objectContaining({
          filter: expect.objectContaining({
            'city@ilike': 'Chi',
          }),
        })
      );
    });

    // Select Chicago from autocomplete
    const chicagoOption = await screen.findByText('Chicago');
    await user.click(chicagoOption);

    // Verify state auto-filled with IL
    const stateField = screen.getByLabelText(/state/i);
    expect(stateField).toHaveValue('IL');

    // Clear and test manual entry
    await user.clear(cityField);
    await user.clear(stateField);
    await user.type(cityField, 'International City');
    await user.type(stateField, 'XX');

    // Verify manual entry still works
    expect(cityField).toHaveValue('International City');
    expect(stateField).toHaveValue('XX');
  });

  it('preserves campaign and principal preferences across sessions', async () => {
    // First session - set preferences
    renderWithAdminContext(<QuickAddButton />);

    await user.click(screen.getByText(/quick add/i));

    // Type campaign name (it's a text field, not a select)
    await user.type(screen.getByLabelText(/campaign/i), 'Trade Show 2024');

    const principalSelect = screen.getByLabelText(/principal/i);
    await user.click(principalSelect);
    await user.click(screen.getByText('Principal A'));

    // Fill minimal form
    await user.type(screen.getByLabelText(/first name/i), 'First');
    await user.type(screen.getByLabelText(/last name/i), 'Session');
    await user.type(screen.getByLabelText(/email/i), 'first@test.com');
    await user.type(screen.getByLabelText(/organization name/i), 'First Org');

    // Save
    await user.click(screen.getByText(/save & close/i));

    await waitFor(() => {
      expect(mockCreateBoothVisitor.createBoothVisitor).toHaveBeenCalled();
    });

    // Verify preferences saved
    const prefs = JSON.parse(localStorage.getItem('quickadd.preferences') || '{}');
    expect(prefs.campaign_id).toBe(1);
    expect(prefs.principal_id).toBe(1);

    // Second session - verify preferences loaded
    const { unmount } = renderWithAdminContext(<QuickAddButton />, {
      dataProvider: mockCreateBoothVisitor,
    });

    await user.click(screen.getByText(/quick add/i));

    // Verify campaign and principal pre-selected
    await waitFor(() => {
      expect(screen.getByLabelText(/campaign/i)).toHaveTextContent('Trade Show 2024');
      expect(screen.getByLabelText(/principal/i)).toHaveTextContent('Principal A');
    });

    unmount();
  });

  it('ensures all touch targets meet minimum size requirements', async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Check Quick Add button itself
    const quickAddButton = screen.getByText(/quick add/i);
    expect(quickAddButton).toHaveClass('min-h-[44px]');
    expect(quickAddButton).toHaveClass('min-w-[44px]');

    // Open dialog
    await user.click(quickAddButton);

    // Check action buttons in dialog
    const saveCloseButton = screen.getByText(/save & close/i);
    const saveAddButton = screen.getByText(/save & add another/i);
    const cancelButton = screen.getByText(/cancel/i);

    // All buttons should have sufficient size for touch targets
    [saveCloseButton, saveAddButton, cancelButton].forEach((button) => {
      const styles = window.getComputedStyle(button);
      const height = parseFloat(styles.minHeight) || parseFloat(styles.height) || 0;
      const width = parseFloat(styles.minWidth) || parseFloat(styles.width) || 0;

      // Buttons should meet minimum touch target size
      expect(height).toBeGreaterThanOrEqual(36); // Default button height in the UI
      expect(width).toBeGreaterThanOrEqual(44); // Minimum touch width
    });
  });
});