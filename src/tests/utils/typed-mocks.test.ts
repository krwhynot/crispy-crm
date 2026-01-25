/**
 * Tests for typed-mocks utility functions
 *
 * These tests verify that mock factory functions produce properly typed
 * React Admin hook return values without requiring type casts.
 */

import { describe, it, expect, vi } from "vitest";
import {
  mockUseCreateReturn,
  mockUseDeleteReturn,
  mockUseUpdateReturn,
  createMockKeyboardEvent,
} from "./typed-mocks";
import type { RaRecord } from "ra-core";

interface TestRecord extends RaRecord {
  id: number;
  name: string;
}

describe("typed-mocks", () => {
  describe("mockUseCreateReturn", () => {
    it("should return a properly typed tuple without double-casts", () => {
      const result = mockUseCreateReturn<TestRecord>({
        isPending: false,
        isSuccess: true,
        data: { id: 1, name: "Test" },
      });

      // Verify it's a tuple with 2 elements
      expect(result).toHaveLength(2);

      // First element should be a function
      const [mutate, state] = result;
      expect(typeof mutate).toBe("function");

      // Second element should have mutation state
      expect(state).toMatchObject({
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: { id: 1, name: "Test" },
      });
      expect(typeof state.reset).toBe("function");
    });

    it("should use default values when no overrides provided", () => {
      const [mutate, state] = mockUseCreateReturn<TestRecord>();

      expect(typeof mutate).toBe("function");
      expect(state).toMatchObject({
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      });
    });

    it("should accept custom mutate function", () => {
      const customMutate = vi.fn();
      const [mutate] = mockUseCreateReturn<TestRecord>({
        mutate: customMutate,
      });

      expect(mutate).toBe(customMutate);
    });
  });

  describe("mockUseDeleteReturn", () => {
    it("should return a properly typed tuple without double-casts", () => {
      const result = mockUseDeleteReturn<TestRecord>({
        isPending: false,
        isSuccess: true,
        data: { id: 1, name: "Deleted" },
      });

      expect(result).toHaveLength(2);

      const [mutate, state] = result;
      expect(typeof mutate).toBe("function");
      expect(state).toMatchObject({
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: { id: 1, name: "Deleted" },
      });
    });

    it("should use default values when no overrides provided", () => {
      const [mutate, state] = mockUseDeleteReturn<TestRecord>();

      expect(typeof mutate).toBe("function");
      expect(state).toMatchObject({
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      });
    });
  });

  describe("mockUseUpdateReturn", () => {
    it("should return a properly typed tuple without double-casts", () => {
      const result = mockUseUpdateReturn<TestRecord>({
        isPending: false,
        isLoading: false,
        isSuccess: true,
        data: { id: 1, name: "Updated" },
      });

      expect(result).toHaveLength(2);

      const [mutate, state] = result;
      expect(typeof mutate).toBe("function");
      expect(state).toMatchObject({
        isPending: false,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: { id: 1, name: "Updated" },
      });
    });

    it("should use default values when no overrides provided", () => {
      const [mutate, state] = mockUseUpdateReturn<TestRecord>();

      expect(typeof mutate).toBe("function");
      expect(state).toMatchObject({
        isPending: false,
        isLoading: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      });
    });

    it("should include both isPending and isLoading flags", () => {
      const [, state] = mockUseUpdateReturn<TestRecord>({
        isPending: true,
        isLoading: true,
      });

      expect(state.isPending).toBe(true);
      expect(state.isLoading).toBe(true);
    });
  });

  describe("createMockKeyboardEvent", () => {
    it("should create a valid keyboard event without double-casts", () => {
      const event = createMockKeyboardEvent({
        key: "Enter",
        metaKey: true,
      });

      expect(event.key).toBe("Enter");
      expect(event.metaKey).toBe(true);
      expect(event.ctrlKey).toBe(false);
      expect(typeof event.preventDefault).toBe("function");
      expect(typeof event.stopPropagation).toBe("function");
    });

    it("should handle currentTarget properly", () => {
      const event = createMockKeyboardEvent();

      // currentTarget should be null or an element, not 'as unknown as'
      expect(event.currentTarget === null || event.currentTarget instanceof Element).toBe(true);
    });

    it("should allow custom target", () => {
      const customTarget = document.createElement("button");
      const event = createMockKeyboardEvent({
        target: customTarget,
      });

      expect(event.target).toBe(customTarget);
    });

    it("should use default values when no overrides provided", () => {
      const event = createMockKeyboardEvent();

      expect(event.key).toBe("");
      expect(event.metaKey).toBe(false);
      expect(event.ctrlKey).toBe(false);
      expect(event.shiftKey).toBe(false);
      expect(event.altKey).toBe(false);
    });

    it("should include all required event properties", () => {
      const event = createMockKeyboardEvent();

      expect(event.nativeEvent).toBeInstanceOf(KeyboardEvent);
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
      expect(event.type).toBe("keydown");
      expect(typeof event.isDefaultPrevented).toBe("function");
      expect(typeof event.isPropagationStopped).toBe("function");
      expect(typeof event.persist).toBe("function");
    });
  });
});
