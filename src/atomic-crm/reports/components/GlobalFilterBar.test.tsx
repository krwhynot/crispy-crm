import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalFilterBar } from './GlobalFilterBar';
import { GlobalFilterProvider } from '../contexts/GlobalFilterContext';

describe('GlobalFilterBar', () => {
  it('renders date range and sales rep filters', () => {
    render(
      <GlobalFilterProvider>
        <GlobalFilterBar />
      </GlobalFilterProvider>
    );

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
  });

  it('displays export and refresh buttons', () => {
    render(
      <GlobalFilterProvider>
        <GlobalFilterBar />
      </GlobalFilterProvider>
    );

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('calls onExport callback when export button clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <GlobalFilterProvider>
        <GlobalFilterBar onExport={onExport} />
      </GlobalFilterProvider>
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh callback when refresh button clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(
      <GlobalFilterProvider>
        <GlobalFilterBar onRefresh={onRefresh} />
      </GlobalFilterProvider>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
