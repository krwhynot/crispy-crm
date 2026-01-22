import { describe, it, expect } from "vitest";
import type { PrincipalPipelineRow, TaskItem } from "../types";

describe("Dashboard V3 Types", () => {
  it("should have PrincipalPipelineRow type with required fields", () => {
    const row: PrincipalPipelineRow = {
      id: 1,
      name: "Acme Corp",
      totalPipeline: 5,
      activeThisWeek: 2,
      activeLastWeek: 3,
      momentum: "increasing",
      nextAction: "Call scheduled for tomorrow",
    };

    expect(row.id).toBeDefined();
    expect(row.momentum).toMatch(/^(increasing|steady|decreasing|stale)$/);
  });

  it("should have TaskItem type with priority levels", () => {
    const task: TaskItem = {
      id: 1,
      subject: "Follow up with client",
      dueDate: new Date(),
      priority: "high",
      taskType: "Call",
      relatedTo: {
        type: "opportunity",
        name: "Q4 Deal",
        id: 123,
      },
      status: "overdue",
    };

    expect(task.priority).toMatch(/^(critical|high|medium|low)$/);
    expect(task.status).toMatch(/^(overdue|today|tomorrow|upcoming|later)$/);
  });
});
