import { useEffect } from 'react';
import { useTutorial } from './TutorialProvider';

/**
 * Component that auto-starts the tutorial on mount.
 * Place this on the dashboard to trigger tutorial after login.
 */
export function TutorialAutoStart() {
  const { startTutorial, isActive } = useTutorial();

  useEffect(() => {
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      if (!isActive) {
        startTutorial();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  return null; // This component renders nothing
}
