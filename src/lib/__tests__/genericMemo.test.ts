// src/lib/__tests__/genericMemo.test.ts
import { describe, it, expect } from "vitest";
import { genericMemo } from "../genericMemo";

interface TestProps<T> {
  data: T;
  onSelect: (item: T) => void;
}

function TestComponent<T>(props: TestProps<T>) {
  return null;
}
TestComponent.displayName = "TestComponentImpl";

describe("genericMemo", () => {
  it("preserves generic type parameters", () => {
    const MemoizedComponent = genericMemo(TestComponent);
    expect(MemoizedComponent.displayName).toBe("TestComponent");
  });

  it("strips 'Impl' suffix from displayName", () => {
    const MemoizedComponent = genericMemo(TestComponent);
    expect(MemoizedComponent.displayName).toBe("TestComponent");
  });

  it("handles component without displayName", () => {
    function NoDisplayName<T>(props: TestProps<T>) {
      return null;
    }
    const MemoizedComponent = genericMemo(NoDisplayName);
    expect(MemoizedComponent.displayName).toBeUndefined();
  });
});
