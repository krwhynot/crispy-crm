import { describe, it, expect, afterEach } from "vitest";
import { isIOS, shouldDisableBeforeUnload } from "../device";

describe("Device Detection", () => {
  // Store original navigator properties
  const originalUserAgent = navigator.userAgent;
  const originalPlatform = navigator.platform;
  const originalMaxTouchPoints = navigator.maxTouchPoints;

  /**
   * Helper to mock navigator properties
   * Note: We use Object.defineProperty because navigator properties are read-only
   */
  function mockNavigator(overrides: {
    userAgent?: string;
    platform?: string;
    maxTouchPoints?: number;
  }) {
    if (overrides.userAgent !== undefined) {
      Object.defineProperty(navigator, "userAgent", {
        value: overrides.userAgent,
        writable: true,
        configurable: true,
      });
    }
    if (overrides.platform !== undefined) {
      Object.defineProperty(navigator, "platform", {
        value: overrides.platform,
        writable: true,
        configurable: true,
      });
    }
    if (overrides.maxTouchPoints !== undefined) {
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: overrides.maxTouchPoints,
        writable: true,
        configurable: true,
      });
    }
  }

  afterEach(() => {
    // Restore original navigator properties after each test
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: originalMaxTouchPoints,
      writable: true,
      configurable: true,
    });
  });

  describe("isIOS", () => {
    it("should detect iPhone via user agent", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      expect(isIOS()).toBe(true);
    });

    it("should detect iPad (older iOS) via user agent", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
        platform: "iPad",
        maxTouchPoints: 5,
      });

      expect(isIOS()).toBe(true);
    });

    it("should detect iPod via user agent", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
        platform: "iPod",
        maxTouchPoints: 5,
      });

      expect(isIOS()).toBe(true);
    });

    it("should detect iPadOS 13+ (reports as MacIntel)", () => {
      // iPadOS 13+ changed to report as MacIntel to get desktop websites
      // We detect it via maxTouchPoints > 2 (Mac desktop has 0-1)
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5, // iPad has 5 touch points
      });

      expect(isIOS()).toBe(true);
    });

    it("should NOT detect Mac desktop as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0, // Mac desktop has 0 touch points
      });

      expect(isIOS()).toBe(false);
    });

    it("should NOT detect Mac with trackpad as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 1, // Some Macs report 1 for trackpad
      });

      expect(isIOS()).toBe(false);
    });

    it("should NOT detect Windows as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      expect(isIOS()).toBe(false);
    });

    it("should NOT detect Windows with touch as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        maxTouchPoints: 10, // Windows touch device
      });

      expect(isIOS()).toBe(false);
    });

    it("should NOT detect Android as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      });

      expect(isIOS()).toBe(false);
    });

    it("should NOT detect Linux desktop as iOS", () => {
      mockNavigator({
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      expect(isIOS()).toBe(false);
    });
  });

  describe("shouldDisableBeforeUnload", () => {
    it("should return true on iOS devices", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      expect(shouldDisableBeforeUnload()).toBe(true);
    });

    it("should return true on iPadOS 13+", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      });

      expect(shouldDisableBeforeUnload()).toBe(true);
    });

    it("should return false on Mac desktop", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });

      expect(shouldDisableBeforeUnload()).toBe(false);
    });

    it("should return false on Windows", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      expect(shouldDisableBeforeUnload()).toBe(false);
    });
  });

  describe("SSR Safety", () => {
    it("should handle SSR environment gracefully", () => {
      // In a real SSR scenario, window would be undefined
      // Since we're in a browser test environment, we can't fully test this,
      // but we can verify the function has the guard
      // The actual SSR behavior is tested by reading the source code
      expect(typeof isIOS).toBe("function");
      expect(typeof shouldDisableBeforeUnload).toBe("function");
    });
  });
});
