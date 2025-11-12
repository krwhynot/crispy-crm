import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextMenu, useContextMenu } from '../contextMenu';

describe('ContextMenu', () => {
  it('should render menu at position', () => {
    const onClose = vi.fn();
    const items = [
      { label: 'Action 1', action: vi.fn() },
      { label: 'Action 2', action: vi.fn() }
    ];

    render(
      <ContextMenu
        x={100}
        y={200}
        items={items}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('should call action and close on item click', () => {
    const onClose = vi.fn();
    const action1 = vi.fn();
    const items = [{ label: 'Action 1', action: action1 }];

    render(
      <ContextMenu
        x={100}
        y={200}
        items={items}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Action 1'));

    expect(action1).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should close on Escape key', () => {
    const onClose = vi.fn();
    const items = [{ label: 'Action 1', action: vi.fn() }];

    render(
      <ContextMenu
        x={100}
        y={200}
        items={items}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
