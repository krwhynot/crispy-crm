import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormShortcuts } from "../useFormShortcuts";
import { createMockKeyboardEvent } from "@/tests/utils/typed-mocks";

describe("useFormShortcuts", () => {
  it("calls onSave when Cmd+Enter is pressed", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const preventDefault = vi.fn();
    const event = createMockKeyboardEvent({
      key: "Enter",
      metaKey: true,
      shiftKey: false,
      preventDefault,
      target: document.createElement("input"),
    });

    result.current.handleKeyDown(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("calls onSaveAndNew when Cmd+Shift+Enter is pressed", () => {
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onSaveAndNew, onCancel }));

    const preventDefault = vi.fn();
    const event = createMockKeyboardEvent({
      key: "Enter",
      metaKey: true,
      shiftKey: true,
      preventDefault,
      target: document.createElement("input"),
    });

    result.current.handleKeyDown(event);

    expect(onSaveAndNew).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed outside textarea", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const preventDefault = vi.fn();
    const event = createMockKeyboardEvent({
      key: "Escape",
      metaKey: false,
      shiftKey: false,
      preventDefault,
      target: document.createElement("input"),
    });

    result.current.handleKeyDown(event);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("does NOT call onCancel when Escape is pressed in textarea", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const textarea = document.createElement("textarea");
    const preventDefault = vi.fn();
    const event = createMockKeyboardEvent({
      key: "Escape",
      metaKey: false,
      shiftKey: false,
      preventDefault,
      target: textarea,
    });

    result.current.handleKeyDown(event);

    expect(onCancel).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does NOT call onCancel when Escape is pressed in contentEditable", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const div = document.createElement("div");
    div.contentEditable = "true";
    const event = {
      key: "Escape",
      metaKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      target: div,
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(event);

    expect(onCancel).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("allows Cmd+Enter in textareas (calls onSave)", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const textarea = document.createElement("textarea");
    const event = {
      key: "Enter",
      metaKey: true,
      shiftKey: false,
      preventDefault: vi.fn(),
      target: textarea,
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("works with Ctrl+Enter on Windows/Linux", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const event = {
      key: "Enter",
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      preventDefault: vi.fn(),
      target: document.createElement("input"),
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does nothing when onSaveAndNew is not provided and Shift is pressed", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useFormShortcuts({ onSave, onCancel }));

    const event = {
      key: "Enter",
      metaKey: true,
      shiftKey: true,
      preventDefault: vi.fn(),
      target: document.createElement("input"),
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(event);

    expect(onSave).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
