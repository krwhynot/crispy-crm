// src/atomic-crm/reports/components/KPICard.test.tsx
import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { KPICard } from "@/components/ui/kpi-card";
import { TrendingUp, TrendingDown } from "lucide-react";

describe("KPICard", () => {
  it("renders title and value", () => {
    renderWithAdminContext(
      <KPICard
        title="Total Opportunities"
        value="42"
        trend={{ value: 15, direction: "up" }}
        icon={TrendingUp}
      />
    );

    expect(screen.getByText("Total Opportunities")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows positive trend with olive color", () => {
    renderWithAdminContext(
      <KPICard
        title="Revenue"
        value="$100k"
        trend={{ value: 25, direction: "up" }}
        icon={TrendingUp}
      />
    );

    const changeElement = screen.getByText(/25%/);
    expect(changeElement).toHaveClass("text-[color:var(--olive-trend)]");
  });

  it("shows negative trend with clay color", () => {
    renderWithAdminContext(
      <KPICard
        title="Leads"
        value="10"
        trend={{ value: 10, direction: "down" }}
        icon={TrendingDown}
      />
    );

    const changeElement = screen.getByText(/10%/);
    expect(changeElement).toHaveClass("text-[color:var(--clay-text)]");
  });

  describe("onClick navigation (PRD Section 9.2.1)", () => {
    it("calls onClick when card is clicked", async () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Clickable KPI" value="100" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Clickable KPI: 100/i });
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick on Enter key press", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Keyboard KPI" value="50" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Keyboard KPI: 50/i });
      fireEvent.keyDown(card, { key: "Enter" });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick on Space key press", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Spacebar KPI" value="25" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Spacebar KPI: 25/i });
      fireEvent.keyDown(card, { key: " " });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("has cursor-pointer class when clickable", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Pointer KPI" value="75" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Pointer KPI: 75/i });
      expect(card).toHaveClass("cursor-pointer");
    });

    it("does not have button role when not clickable", () => {
      renderWithAdminContext(<KPICard title="Static KPI" value="200" icon={TrendingUp} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByText("Static KPI")).toBeInTheDocument();
    });

    it("is keyboard focusable when clickable", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Focusable KPI" value="150" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Focusable KPI: 150/i });
      expect(card).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("tone styling (3-axis CVA)", () => {
    it("applies warning tone with clay surface tint", () => {
      renderWithAdminContext(
        <KPICard title="Stale Deals" value="5" icon={TrendingUp} tone="warning" />
      );

      const card = screen.getByText("Stale Deals").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).toHaveClass("bg-[var(--clay-surface)]");
    });

    it("applies positive tone without background tint", () => {
      renderWithAdminContext(<KPICard title="Wins" value="10" icon={TrendingUp} tone="positive" />);

      const card = screen.getByText("Wins").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).not.toHaveClass("bg-[var(--clay-surface)]");
    });

    it("applies critical tone without background tint", () => {
      renderWithAdminContext(
        <KPICard title="Overdue Tasks" value="3" icon={TrendingDown} tone="critical" />
      );

      const card = screen.getByText("Overdue Tasks").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).not.toHaveClass("bg-[var(--clay-surface)]");
    });

    it("applies neutral tone (no tint) when no tone specified", () => {
      renderWithAdminContext(<KPICard title="Default KPI" value="42" icon={TrendingUp} />);

      const card = screen.getByText("Default KPI").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).not.toHaveClass("bg-[var(--clay-surface)]");
    });
  });

  describe("deprecated variant prop backward compat", () => {
    it("maps variant='warning' to warning tone", () => {
      renderWithAdminContext(
        <KPICard title="Stale Deals" value="5" icon={TrendingUp} variant="warning" />
      );

      const card = screen.getByText("Stale Deals").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).toHaveClass("bg-[var(--clay-surface)]");
    });

    it("maps variant='success' to positive tone", () => {
      renderWithAdminContext(
        <KPICard title="Wins" value="10" icon={TrendingUp} variant="success" />
      );

      const card = screen.getByText("Wins").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).not.toHaveClass("bg-[var(--clay-surface)]");
    });

    it("maps variant='destructive' to critical tone", () => {
      renderWithAdminContext(
        <KPICard title="Overdue Tasks" value="3" icon={TrendingDown} variant="destructive" />
      );

      const card = screen.getByText("Overdue Tasks").closest('[data-slot="card"]');
      expect(card).toHaveClass("paper-card");
      expect(card).not.toHaveClass("bg-[var(--clay-surface)]");
    });

    it("tone prop takes precedence over variant", () => {
      renderWithAdminContext(
        <KPICard
          title="Precedence Test"
          value="7"
          icon={TrendingUp}
          variant="destructive"
          tone="warning"
        />
      );

      const card = screen.getByText("Precedence Test").closest('[data-slot="card"]');
      // tone="warning" should win, producing clay-surface tint
      expect(card).toHaveClass("bg-[var(--clay-surface)]");
    });
  });

  describe("emphasis axis", () => {
    it("uses default emphasis (text-xl) by default", () => {
      renderWithAdminContext(<KPICard title="Default Emphasis" value="42" icon={TrendingUp} />);

      const valueEl = screen.getByText("42");
      expect(valueEl).toHaveClass("text-xl");
      expect(valueEl).toHaveClass("leading-tight");
    });

    it("uses executive emphasis (40px) when specified", () => {
      renderWithAdminContext(
        <KPICard title="Exec KPI" value="$1.2M" icon={TrendingUp} emphasis="executive" />
      );

      const valueEl = screen.getByText("$1.2M");
      expect(valueEl).toHaveClass("text-[40px]");
      expect(valueEl).toHaveClass("leading-[1.1]");
    });
  });

  describe("interactive axis", () => {
    it("auto-detects interactive from onClick", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard title="Auto Interactive" value="10" icon={TrendingUp} onClick={handleClick} />
      );

      const card = screen.getByRole("button", { name: /Auto Interactive: 10/i });
      expect(card).toHaveClass("cursor-pointer");
    });

    it("can force interactive=false even with onClick", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(
        <KPICard
          title="Forced Static"
          value="10"
          icon={TrendingUp}
          onClick={handleClick}
          interactive={false}
        />
      );

      // interactive=false means cursor-default, no button role
      const card = screen.getByText("Forced Static").closest('[data-slot="card"]');
      expect(card).toHaveClass("cursor-default");
    });
  });

  describe("dark-mode readability", () => {
    it("uses paper KPI title styling for readability", () => {
      renderWithAdminContext(<KPICard title="Dark Mode Title" value="42" icon={TrendingUp} />);

      const title = screen.getByText("Dark Mode Title");
      expect(title).toHaveClass("paper-kpi-title");
    });

    it("uses text-[11px] for trend readability", () => {
      renderWithAdminContext(
        <KPICard
          title="Trend KPI"
          value="10"
          trend={{ value: 5, direction: "up" }}
          icon={TrendingUp}
        />
      );

      const trend = screen.getByText(/5%/);
      expect(trend).toHaveClass("text-[11px]");
    });

    it("uses text-[11px] and dark:font-medium for subtitle readability", () => {
      renderWithAdminContext(
        <KPICard title="Subtitle KPI" value="99" subtitle="vs last week" icon={TrendingUp} />
      );

      const subtitle = screen.getByText("vs last week");
      expect(subtitle).toHaveClass("text-[11px]");
      expect(subtitle).toHaveClass("dark:font-medium");
    });
  });

  describe("loading state", () => {
    it("shows loading skeleton when loading is true", () => {
      renderWithAdminContext(<KPICard title="Loading KPI" value="0" loading={true} />);

      // Should show aria-busy attribute
      const card = screen.getByLabelText(/Loading Loading KPI/i);
      expect(card).toHaveAttribute("aria-busy", "true");
    });
  });
});
