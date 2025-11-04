/**
 * Integration Test: Quick Add Flow with Product Filtering
 *
 * Tests the complete user journey from opening Quick Add dialog through form submission,
 * with emphasis on product filtering by principal_id.
 *
 * User Flow:
 * 1. Click Quick Add button → Dialog opens
 * 2. Select a principal organization → Products dropdown becomes available
 * 3. Verify products are filtered by selected principal
 * 4. Select product(s) from filtered list
 * 5. Fill in contact/organization details
 * 6. Submit form → Opportunity created with correct products
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAddButton } from '../QuickAddButton';
import type { Product } from '@/atomic-crm/types';

// Mock data
const mockPrincipals = [
  { id: 100, name: 'Principal A', organization_type: 'principal' },
  { id: 200, name: 'Principal B', organization_type: 'principal' },
];

const mockProductsPrincipalA: Product[] = [
  { id: 1, name: 'Product A1', sku: 'SKU-A1', principal_id: 100, category: 'beverages', status: 'active' },
  { id: 2, name: 'Product A2', sku: 'SKU-A2', principal_id: 100, category: 'snacks', status: 'active' },
];

const mockProductsPrincipalB: Product[] = [
  { id: 3, name: 'Product B1', sku: 'SKU-B1', principal_id: 200, category: 'beverages', status: 'active' },
  { id: 4, name: 'Product B2', sku: 'SKU-B2', principal_id: 200, category: 'snacks', status: 'active' },
];

// Mock hooks
const mockUseGetList = vi.fn();
const mockUseQuickAddMutate = vi.fn();

vi.mock('ra-core', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

vi.mock('../hooks/useQuickAdd', () => ({
  useQuickAdd: () => ({
    mutate: mockUseQuickAddMutate,
    isPending: false,
  }),
}));

// Mock useFilteredProducts to return products based on principalId
vi.mock('../hooks/useFilteredProducts', () => ({
  useFilteredProducts: (principalId: number | null | undefined) => {
    if (!principalId) {
      return {
        products: [],
        isLoading: false,
        error: null,
        isReady: false,
        isEmpty: true,
      };
    }

    const products = principalId === 100 ? mockProductsPrincipalA : mockProductsPrincipalB;
    return {
      products,
      isLoading: false,
      error: null,
      isReady: true,
      isEmpty: false,
    };
  },
}));

// Test wrapper
const createTestWrapper = () => {
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

describe('Quick Add Flow with Product Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock: return principals list
    mockUseGetList.mockReturnValue({
      data: mockPrincipals,
      isLoading: false,
      error: null,
    });
  });

  describe('Dialog Interaction', () => {
    it('opens Quick Add dialog when button is clicked', async () => {
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Dialog should not be visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Click the Quick Add button
      const button = screen.getByRole('button', { name: /quick add/i });
      fireEvent.click(button);

      // Dialog should now be visible
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Quick Add Booth Visitor')).toBeInTheDocument();
    });

    it('displays all form sections in correct order', async () => {
      render(<QuickAddButton />, { wrapper: createTestWrapper() });
      fireEvent.click(screen.getByRole('button', { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify form sections exist
      expect(screen.getByText('Event Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Product Interest')).toBeInTheDocument();
      expect(screen.getByText('Quick Note')).toBeInTheDocument();
    });
  });

  describe('Principal Selection and Product Filtering', () => {
    it('shows message to select principal before products can be selected', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Product section should show "Select a Principal first" message
      expect(screen.getByText('Select a Principal first to filter products')).toBeInTheDocument();
    });

    it('enables product selection after principal is selected', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find and click the Principal combobox
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);

      // Wait for and select "Principal A"
      await waitFor(() => {
        expect(screen.getByText('Principal A')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Principal A'));

      // Product selection should now be available (message should be gone)
      await waitFor(() => {
        expect(screen.queryByText('Select a Principal first to filter products')).not.toBeInTheDocument();
      });

      // Product combobox should be available
      const productCombobox = screen.getByRole('combobox', { name: /products/i });
      expect(productCombobox).toBeInTheDocument();
    });

    it('displays only products from selected principal', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select Principal A (id: 100)
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal A')).toBeInTheDocument());
      await user.click(screen.getByText('Principal A'));

      // Open product dropdown
      await waitFor(() => {
        expect(screen.queryByText('Select a Principal first to filter products')).not.toBeInTheDocument();
      });

      const productCombobox = screen.getByRole('combobox', { name: /products/i });
      await user.click(productCombobox);

      // Wait for products to appear
      await waitFor(() => {
        // Should show Product A1 and Product A2 (Principal A's products)
        expect(screen.getByText('Product A1')).toBeInTheDocument();
        expect(screen.getByText('Product A2')).toBeInTheDocument();
      });

      // Should NOT show Principal B's products
      expect(screen.queryByText('Product B1')).not.toBeInTheDocument();
      expect(screen.queryByText('Product B2')).not.toBeInTheDocument();
    });

    it('updates product list when principal changes', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Select Principal A first
      let principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal A')).toBeInTheDocument());
      await user.click(screen.getByText('Principal A'));

      // Verify Principal A products are available
      await waitFor(() => {
        expect(screen.queryByText('Select a Principal first to filter products')).not.toBeInTheDocument();
      });

      // Change to Principal B
      principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal B')).toBeInTheDocument());
      await user.click(screen.getByText('Principal B'));

      // Open product dropdown and verify Principal B products appear
      const productCombobox = screen.getByRole('combobox', { name: /products/i });
      await user.click(productCombobox);

      await waitFor(() => {
        // Should show Product B1 and Product B2 (Principal B's products)
        expect(screen.getByText('Product B1')).toBeInTheDocument();
        expect(screen.getByText('Product B2')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Form Submission Flow', () => {
    it('successfully submits form with selected principal and products', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Fill Event Information
      const campaignInput = screen.getByLabelText(/campaign/i);
      await user.type(campaignInput, 'Trade Show 2025');

      // Select Principal A
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal A')).toBeInTheDocument());
      await user.click(screen.getByText('Principal A'));

      // Wait for products to be ready
      await waitFor(() => {
        expect(screen.queryByText('Select a Principal first to filter products')).not.toBeInTheDocument();
      });

      // Select a product
      const productCombobox = screen.getByRole('combobox', { name: /products/i });
      await user.click(productCombobox);
      await waitFor(() => expect(screen.getByText('Product A1')).toBeInTheDocument());
      await user.click(screen.getByText('Product A1'));

      // Fill Contact Information (required fields)
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'Doe');

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '555-1234');

      // Fill Organization
      const orgNameInput = screen.getByLabelText(/organization name/i);
      await user.type(orgNameInput, 'ACME Corp');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add booth visitor/i });
      await user.click(submitButton);

      // Verify mutation was called with correct data
      await waitFor(() => {
        expect(mockUseQuickAddMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            campaign: 'Trade Show 2025',
            principal_id: 100,
            product_ids: [1], // Product A1's ID
            first_name: 'John',
            last_name: 'Doe',
            phone: '555-1234',
            org_name: 'ACME Corp',
          }),
          expect.any(Object)
        );
      });
    });

    it('allows multiple product selection from filtered list', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Fill campaign
      await user.type(screen.getByLabelText(/campaign/i), 'Multi-Product Event');

      // Select Principal A
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal A')).toBeInTheDocument());
      await user.click(screen.getByText('Principal A'));

      // Wait for products
      await waitFor(() => {
        expect(screen.queryByText('Select a Principal first to filter products')).not.toBeInTheDocument();
      });

      // Select MULTIPLE products
      const productCombobox = screen.getByRole('combobox', { name: /products/i });
      await user.click(productCombobox);

      // Select Product A1
      await waitFor(() => expect(screen.getByText('Product A1')).toBeInTheDocument());
      await user.click(screen.getByText('Product A1'));

      // Reopen and select Product A2
      await user.click(productCombobox);
      await waitFor(() => expect(screen.getByText('Product A2')).toBeInTheDocument());
      await user.click(screen.getByText('Product A2'));

      // Fill required contact fields
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.type(screen.getByLabelText(/phone/i), '555-5678');
      await user.type(screen.getByLabelText(/organization name/i), 'Tech Inc');

      // Submit
      await user.click(screen.getByRole('button', { name: /add booth visitor/i }));

      // Verify both products were included
      await waitFor(() => {
        expect(mockUseQuickAddMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            principal_id: 100,
            product_ids: expect.arrayContaining([1, 2]), // Both Product A1 and A2
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Form Validation with Product Filtering', () => {
    it('allows form submission without products when principal is selected', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Fill required fields WITHOUT selecting products
      await user.type(screen.getByLabelText(/campaign/i), 'No Products Event');

      // Select principal
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      await user.click(principalCombobox);
      await waitFor(() => expect(screen.getByText('Principal A')).toBeInTheDocument());
      await user.click(screen.getByText('Principal A'));

      // Skip product selection - just fill contact info
      await user.type(screen.getByLabelText(/first name/i), 'Bob');
      await user.type(screen.getByLabelText(/last name/i), 'Johnson');
      await user.type(screen.getByLabelText(/email/i), 'bob@example.com');
      await user.type(screen.getByLabelText(/organization name/i), 'No Products Co');

      // Submit should work (products are optional)
      await user.click(screen.getByRole('button', { name: /add booth visitor/i }));

      await waitFor(() => {
        expect(mockUseQuickAddMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            principal_id: 100,
            product_ids: [], // Empty array is valid
          }),
          expect.any(Object)
        );
      });
    });

    it('requires either phone or email to submit', async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Fill everything EXCEPT phone and email
      await user.type(screen.getByLabelText(/campaign/i), 'Contact Required');
      await user.type(screen.getByLabelText(/first name/i), 'Alice');
      await user.type(screen.getByLabelText(/last name/i), 'Williams');
      await user.type(screen.getByLabelText(/organization name/i), 'Contact Co');

      // Try to submit without phone or email
      await user.click(screen.getByRole('button', { name: /add booth visitor/i }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/phone or email required/i)).toBeInTheDocument();
      });

      // Mutation should NOT have been called
      expect(mockUseQuickAddMutate).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error States', () => {
    it('handles empty principal list gracefully', async () => {
      // Mock empty principals
      mockUseGetList.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Principal combobox should still be present but show no options
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      expect(principalCombobox).toBeInTheDocument();

      // Product section should show "Select a Principal first" message
      expect(screen.getByText('Select a Principal first to filter products')).toBeInTheDocument();
    });

    it('handles principals loading state', async () => {
      // Mock loading state
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /quick add/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Principal combobox should be disabled or show loading state
      const principalCombobox = screen.getByRole('combobox', { name: /principal/i });
      expect(principalCombobox).toBeInTheDocument();
    });
  });
});
