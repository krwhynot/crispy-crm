import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickLogger } from '../QuickLogger';
import { PrincipalProvider } from '../../context/PrincipalContext';
import { AdminContext } from 'react-admin';

describe('QuickLogger', () => {
  it('should disable form during submission', async () => {
    const user = userEvent.setup();

    render(
      <AdminContext>
        <PrincipalProvider>
          <QuickLogger />
        </PrincipalProvider>
      </AdminContext>
    );

    // Fill out form
    await user.type(screen.getByLabelText(/Subject/), 'Test activity');

    // Submit
    const submitButton = screen.getByTestId('quick-logger-submit');
    await user.click(submitButton);

    // During submission, button should be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
