import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../TutorialProvider';
import { MemoryRouter } from 'react-router-dom';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn(() => false),
    moveNext: vi.fn(),
    movePrevious: vi.fn(),
  })),
}));

// Mock steps module to return test steps
vi.mock('../steps', () => ({
  getChapterSteps: vi.fn(() => [
    {
      element: '[data-tutorial="test"]',
      popover: { title: 'Chapter Step', description: 'Chapter description' },
    },
  ]),
}));

// Test component that uses the context
function TestConsumer() {
  const { startTutorial, stopTutorial, isActive } = useTutorial();

  return (
    <div>
      <span data-testid="is-active">{isActive ? 'active' : 'inactive'}</span>
      <button onClick={() => startTutorial()}>Start</button>
      <button onClick={() => startTutorial('contacts')}>Start Contacts</button>
      <button onClick={() => stopTutorial()}>Stop</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MemoryRouter>
      <TutorialProvider>
        <TestConsumer />
      </TutorialProvider>
    </MemoryRouter>
  );
}

describe('TutorialProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide tutorial context to children', () => {
    renderWithProvider();

    expect(screen.getByTestId('is-active')).toHaveTextContent('inactive');
  });

  it('should start tutorial when startTutorial is called', async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Start'));

    // Driver.js should be initialized
    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });

  it('should start specific chapter when chapter is provided', async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Start Contacts'));

    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });

  it('should throw error when useTutorial is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useTutorial must be used within TutorialProvider');

    consoleSpy.mockRestore();
  });
});
