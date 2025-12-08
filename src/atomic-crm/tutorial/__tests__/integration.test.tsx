import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialProvider, useTutorial } from '../TutorialProvider';
import { TutorialLauncher } from '../TutorialLauncher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn(() => false),
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

// Wrapper with dropdown menu container
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <TutorialProvider>
        <div>{children}</div>
      </TutorialProvider>
    </MemoryRouter>
  );
}

// Wrapper for TutorialLauncher (needs parent DropdownMenu)
function TutorialLauncherWrapper() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <TutorialLauncher />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('Tutorial Integration', () => {
  it('should render tutorial launcher in dropdown without crashing', () => {
    // The TutorialLauncher renders inside a dropdown submenu
    // We just verify it doesn't crash when rendered in a parent menu
    const { container } = render(
      <TestWrapper>
        <TutorialLauncherWrapper />
      </TestWrapper>
    );

    // Should render the trigger button
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
    expect(container).toBeDefined();
  });

  it('should have access to tutorial context', () => {
    // Test consumer component
    function ContextChecker() {
      const { startTutorial, isActive, progress } = useTutorial();
      return (
        <div>
          <span data-testid="is-active">{isActive ? 'yes' : 'no'}</span>
          <span data-testid="completed-count">{progress.completedChapters.length}</span>
          <button onClick={() => startTutorial('contacts')}>Start</button>
        </div>
      );
    }

    render(
      <TestWrapper>
        <ContextChecker />
      </TestWrapper>
    );

    expect(screen.getByTestId('is-active')).toHaveTextContent('no');
    expect(screen.getByTestId('completed-count')).toHaveTextContent('0');
  });

  it('should start tutorial when button clicked', async () => {
    function ContextChecker() {
      const { startTutorial } = useTutorial();
      return <button onClick={() => startTutorial('contacts')}>Start</button>;
    }

    render(
      <TestWrapper>
        <ContextChecker />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Start'));

    // Driver.js should be initialized
    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });
});
