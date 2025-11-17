import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing slide-over state with URL synchronization
 *
 * Manages:
 * - State: slideOverId, isOpen, mode ('view' | 'edit')
 * - URL sync: Read/write ?view=123 or ?edit=123 query params
 * - Browser navigation: Handle back/forward buttons (popstate listener)
 * - ESC key: Close slide-over on ESC press
 *
 * @returns Object with state and control functions
 */
export interface UseSlideOverStateReturn {
  slideOverId: number | null;
  isOpen: boolean;
  mode: 'view' | 'edit';
  openSlideOver: (id: number, initialMode?: 'view' | 'edit') => void;
  closeSlideOver: () => void;
  setMode: (mode: 'view' | 'edit') => void;
  toggleMode: () => void;
}

export function useSlideOverState(): UseSlideOverStateReturn {
  const [slideOverId, setSlideOverId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Parse URL params on initial load to support deep linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const editId = params.get('edit');

    if (viewId) {
      setSlideOverId(Number(viewId));
      setMode('view');
      setIsOpen(true);
    } else if (editId) {
      setSlideOverId(Number(editId));
      setMode('edit');
      setIsOpen(true);
    }
  }, []); // Run once on mount

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view');
      const editId = params.get('edit');

      if (viewId) {
        setSlideOverId(Number(viewId));
        setMode('view');
        setIsOpen(true);
      } else if (editId) {
        setSlideOverId(Number(editId));
        setMode('edit');
        setIsOpen(true);
      } else {
        // No params means slide-over should be closed
        setIsOpen(false);
        setSlideOverId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle ESC key to close slide-over
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSlideOver();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const openSlideOver = (id: number, initialMode: 'view' | 'edit' = 'view') => {
    setSlideOverId(id);
    setMode(initialMode);
    setIsOpen(true);
    // Update URL for deep linking and browser history
    const params = new URLSearchParams(window.location.search);
    // Clear both view and edit params first
    params.delete('view');
    params.delete('edit');
    // Set the new param
    params.set(initialMode, String(id));
    window.history.pushState(null, '', `${window.location.pathname}?${params}`);
  };

  const closeSlideOver = () => {
    setIsOpen(false);
    setSlideOverId(null);
    // Remove slide-over params from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('view');
    params.delete('edit');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.pushState(null, '', newUrl);
  };

  const toggleMode = () => {
    const newMode = mode === 'view' ? 'edit' : 'view';
    setMode(newMode);
    // Update URL when mode changes
    if (slideOverId) {
      const params = new URLSearchParams(window.location.search);
      params.delete('view');
      params.delete('edit');
      params.set(newMode, String(slideOverId));
      window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    }
  };

  return { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, setMode, toggleMode };
}
