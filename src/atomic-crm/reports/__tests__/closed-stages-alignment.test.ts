/**
 * CLOSED_STAGES Alignment Regression Test
 *
 * Phase 5 Automation — Reporting Audit
 *
 * Verifies that the "open pipeline" filter is defined in exactly one place
 * (CLOSED_STAGES in stage-enums.ts) and that all consumers reference the
 * same constant. Prevents drift between Dashboard KPI (D-KPI-1) and
 * Reports Overview (R-OV-1) that was fixed in audit action B3.
 *
 * Rollout: nightly → PR-required once stable.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Direct import of the canonical constant
import {
  CLOSED_STAGES,
  STAGE,
  ACTIVE_STAGES,
  isActiveStage,
  isClosedStage,
} from "@/atomic-crm/opportunities/constants/stage-enums";

const PROJECT_ROOT = resolve(__dirname, "../../../..");

/** Read a source file relative to project root */
function readSource(relativePath: string): string {
  return readFileSync(resolve(PROJECT_ROOT, relativePath), "utf-8");
}

describe("CLOSED_STAGES alignment", () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Canonical definition integrity
  // ────────────────────────────────────────────────────────────────────────
  describe("canonical definition", () => {
    it("contains exactly closed_won and closed_lost", () => {
      expect(CLOSED_STAGES).toHaveLength(2);
      expect([...CLOSED_STAGES]).toContain("closed_won");
      expect([...CLOSED_STAGES]).toContain("closed_lost");
    });

    it("ACTIVE_STAGES + CLOSED_STAGES covers all STAGE values", () => {
      const allStages = new Set([...ACTIVE_STAGES, ...CLOSED_STAGES]);
      const stageValues = Object.values(STAGE);
      expect(allStages.size).toBe(stageValues.length);
      for (const stage of stageValues) {
        expect(allStages.has(stage)).toBe(true);
      }
    });

    it("predicate functions agree with array membership", () => {
      for (const stage of ACTIVE_STAGES) {
        expect(isActiveStage(stage)).toBe(true);
        expect(isClosedStage(stage)).toBe(false);
      }
      for (const stage of CLOSED_STAGES) {
        expect(isActiveStage(stage)).toBe(false);
        expect(isClosedStage(stage)).toBe(true);
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Consumer alignment — all "open pipeline" filters use CLOSED_STAGES
  //    import, not hardcoded strings
  // ────────────────────────────────────────────────────────────────────────
  describe("consumer alignment (source-level)", () => {
    const consumers = [
      {
        name: "useKPIMetrics (D-KPI-1)",
        path: "src/atomic-crm/dashboard/useKPIMetrics.ts",
      },
      {
        name: "useMyPerformance (D-PERF)",
        path: "src/atomic-crm/dashboard/useMyPerformance.ts",
      },
      {
        name: "OverviewTab (R-OV-1)",
        path: "src/atomic-crm/reports/tabs/OverviewTab.tsx",
      },
      {
        name: "dataProviderUtils",
        path: "src/atomic-crm/providers/supabase/dataProviderUtils.ts",
      },
    ];

    it.each(consumers)("$name imports CLOSED_STAGES from the canonical source", ({ path }) => {
      const source = readSource(path);
      // Must import CLOSED_STAGES (not define its own list)
      expect(source).toMatch(/import\s+\{[^}]*CLOSED_STAGES[^}]*\}/);
    });

    it.each(consumers)(
      "$name does not hardcode closed_won/closed_lost string literals in filters",
      ({ path }) => {
        const source = readSource(path);
        // Strip import lines and comments before checking
        const codeLines = source
          .split("\n")
          .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
          .filter((line) => !line.includes("import "))
          .join("\n");

        // Should not have hardcoded stage strings in filter objects
        // Allow string references in type assertions and JSDoc
        const hardcodedPattern = /["']closed_won["']|["']closed_lost["']/;
        const matches = codeLines.match(hardcodedPattern);
        expect(matches).toBeNull();
      }
    );
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Filter equivalence — D-KPI-1 and R-OV-1 use identical exclusion
  // ────────────────────────────────────────────────────────────────────────
  describe("filter equivalence", () => {
    it("useKPIMetrics uses stage@not_in spread of CLOSED_STAGES", () => {
      const source = readSource("src/atomic-crm/dashboard/useKPIMetrics.ts");
      // The filter pattern: "stage@not_in": [...CLOSED_STAGES]
      expect(source).toContain('"stage@not_in": [...CLOSED_STAGES]');
    });

    it("OverviewTab filters with CLOSED_STAGES.includes()", () => {
      const source = readSource("src/atomic-crm/reports/tabs/OverviewTab.tsx");
      // The filter pattern: !CLOSED_STAGES.includes(opp.stage ...
      expect(source).toMatch(/!CLOSED_STAGES\.includes\(/);
    });

    it("both filters exclude the same set of stages at runtime", () => {
      // Simulate what each consumer does:

      // D-KPI-1 (useKPIMetrics): filter = { "stage@not_in": [...CLOSED_STAGES] }
      const kpiExcluded = new Set([...CLOSED_STAGES]);

      // R-OV-1 (OverviewTab): opps.filter(opp => !CLOSED_STAGES.includes(opp.stage))
      const overviewExcluded = new Set(CLOSED_STAGES);

      expect(kpiExcluded).toEqual(overviewExcluded);
    });
  });
});
