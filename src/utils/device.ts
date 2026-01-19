/**
 * Device Detection Utilities
 *
 * Provides reliable iOS/iPadOS detection for handling browser-specific quirks,
 * particularly native dialog issues that cause lockups on iOS Safari.
 *
 * Key insight: iPadOS 13+ reports as "MacIntel" in navigator.platform,
 * so we use maxTouchPoints to distinguish iPad from Mac desktop.
 */

/**
 * Detect if the current device is running iOS or iPadOS
 *
 * Detection logic:
 * 1. Check user agent for iPhone/iPad/iPod (works for older iOS)
 * 2. Check for MacIntel + multi-touch (iPadOS 13+ reports as Mac)
 *
 * @returns true if running on iOS/iPadOS, false otherwise
 */
export const isIOS = (): boolean => {
  // SSR safety check
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  // Direct detection for older iOS devices
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return true;
  }

  // iPadOS 13+ detection: reports as MacIntel but has multi-touch
  // Mac desktop has 0-1 touch points, iPad has 5
  // navigator.platform is deprecated but still required for iPadOS detection
  // (no modern alternative exists for this specific use case)
  const platform = navigator.platform;
  if (/Mac/.test(platform) && navigator.maxTouchPoints > 2) {
    return true;
  }

  return false;
};

/**
 * Determine if beforeunload event should be disabled
 *
 * iOS Safari has documented issues with beforeunload:
 * - Does not fire reliably when closing tabs/apps
 * - Can cause silent navigation failures with History API
 * - W3C recommends visibilitychange as alternative for mobile
 *
 * @returns true if beforeunload should be skipped
 */
export const shouldDisableBeforeUnload = (): boolean => isIOS();
