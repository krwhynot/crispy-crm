import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '../DashboardHeader';
import { PrincipalProvider } from '../../context/PrincipalContext';
import { AdminContext } from 'react-admin';

describe('DashboardHeader', () => {
  it('should not render global search input', () => {
    render(
      <AdminContext>
        <PrincipalProvider>
          <DashboardHeader />
        </PrincipalProvider>
      </AdminContext>
    );

    // Search should not be in the document
    expect(screen.queryByLabelText('Global search')).not.toBeInTheDocument();
  });
});
