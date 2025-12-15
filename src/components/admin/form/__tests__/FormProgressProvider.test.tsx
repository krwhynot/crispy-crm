import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { FormProgressProvider, useFormProgress } from "../FormProgressProvider";

describe("FormProgressProvider", () => {
  test("throws error when useFormProgress called outside provider", () => {
    expect(() => {
      renderHook(() => useFormProgress());
    }).toThrow("useFormProgress must be used within a FormProgressProvider");
  });

  test("registers required field correctly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
    });

    expect(result.current.fields.email).toEqual({
      name: "email",
      isValid: false,
      isRequired: true,
    });
    expect(result.current.totalRequired).toBe(1);
    expect(result.current.completedRequired).toBe(0);
  });

  test("registers optional field correctly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("nickname", false);
    });

    expect(result.current.fields.nickname).toEqual({
      name: "nickname",
      isValid: false,
      isRequired: false,
    });
    expect(result.current.totalRequired).toBe(0);
    expect(result.current.completedRequired).toBe(0);
  });

  test("tracks field validity changes", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
    });

    expect(result.current.fields.email.isValid).toBe(false);

    act(() => {
      result.current.markFieldValid("email", true);
    });

    expect(result.current.fields.email.isValid).toBe(true);

    act(() => {
      result.current.markFieldValid("email", false);
    });

    expect(result.current.fields.email.isValid).toBe(false);
  });

  test("calculates percentage at 0% completed as initialProgress", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider initialProgress={10}>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
      result.current.registerField("name", true);
    });

    expect(result.current.completedRequired).toBe(0);
    expect(result.current.percentage).toBe(10);
  });

  test("calculates percentage at 50% completed with goal-gradient scaling", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider initialProgress={10}>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
      result.current.registerField("name", true);
    });

    act(() => {
      result.current.markFieldValid("email", true);
    });

    expect(result.current.completedRequired).toBe(1);
    expect(result.current.totalRequired).toBe(2);

    const expectedPercentage = 10 + (50 * (100 - 10)) / 100;
    expect(result.current.percentage).toBe(expectedPercentage);
  });

  test("calculates percentage at 100% completed as 100", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider initialProgress={10}>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
      result.current.registerField("name", true);
    });

    act(() => {
      result.current.markFieldValid("email", true);
      result.current.markFieldValid("name", true);
    });

    expect(result.current.completedRequired).toBe(2);
    expect(result.current.totalRequired).toBe(2);
    expect(result.current.percentage).toBe(100);
  });

  test("counts only required fields in percentage calculation", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
      result.current.registerField("name", true);
      result.current.registerField("nickname", false);
      result.current.registerField("bio", false);
    });

    expect(result.current.totalRequired).toBe(2);
    expect(result.current.completedRequired).toBe(0);

    act(() => {
      result.current.markFieldValid("nickname", true);
      result.current.markFieldValid("bio", true);
    });

    expect(result.current.totalRequired).toBe(2);
    expect(result.current.completedRequired).toBe(0);
    expect(result.current.percentage).toBe(10);
  });

  test("updates totalRequired and completedRequired correctly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    expect(result.current.totalRequired).toBe(0);
    expect(result.current.completedRequired).toBe(0);

    act(() => {
      result.current.registerField("email", true);
    });

    expect(result.current.totalRequired).toBe(1);
    expect(result.current.completedRequired).toBe(0);

    act(() => {
      result.current.registerField("name", true);
      result.current.registerField("phone", true);
    });

    expect(result.current.totalRequired).toBe(3);
    expect(result.current.completedRequired).toBe(0);

    act(() => {
      result.current.markFieldValid("email", true);
    });

    expect(result.current.totalRequired).toBe(3);
    expect(result.current.completedRequired).toBe(1);

    act(() => {
      result.current.markFieldValid("name", true);
      result.current.markFieldValid("phone", true);
    });

    expect(result.current.totalRequired).toBe(3);
    expect(result.current.completedRequired).toBe(3);
  });

  test("handles marking non-existent field as valid gracefully", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.markFieldValid("nonexistent", true);
    });

    expect(result.current.fields.nonexistent).toBeUndefined();
    expect(result.current.totalRequired).toBe(0);
    expect(result.current.completedRequired).toBe(0);
  });

  test("uses custom initialProgress value", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider initialProgress={25}>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
    });

    expect(result.current.percentage).toBe(25);
  });

  test("defaults initialProgress to 10 when not provided", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormProgressProvider>{children}</FormProgressProvider>
    );

    const { result } = renderHook(() => useFormProgress(), { wrapper });

    act(() => {
      result.current.registerField("email", true);
    });

    expect(result.current.percentage).toBe(10);
  });
});
