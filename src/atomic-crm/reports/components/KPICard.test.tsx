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

  it("shows positive trend with green color", () => {
    renderWithAdminContext(
      <KPICard
        title="Revenue"
        value="$100k"
        trend={{ value: 25, direction: "up" }}
        icon={TrendingUp}
      />
    );

    // The new component shows "↑25%" format
    const changeElement = screen.getByText(/↑25%/);
    expect(changeElement).toHaveClass("text-success");
  });

  it("shows negative trend with red color", () => {
    renderWithAdminContext(
      <KPICard
        title="Leads"
        value="10"
        trend={{ value: 10, direction: "down" }}
        icon={TrendingDown}
      />
    );

    // The new component shows "↓10%" format
    const changeElement = screen.getByText(/↓10%/);
    expect(changeElement).toHaveClass("text-destructive");
  });

  describe("onClick navigation (PRD Section 9.2.1)", () => {
    it("calls onClick when card is clicked", async () => {
      const handleClick = vi.fn();
      renderWithAdminContext(<KPICard title="Clickable KPI" value="100" icon={TrendingUp} onClick={handleClick} />);

      const card = screen.getByRole("button", { name: /Clickable KPI: 100/i });
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick on Enter key press", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(<KPICard title="Keyboard KPI" value="50" icon={TrendingUp} onClick={handleClick} />);

      const card = screen.getByRole("button", { name: /Keyboard KPI: 50/i });
      fireEvent.keyDown(card, { key: "Enter" });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick on Space key press", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(<KPICard title="Spacebar KPI" value="25" icon={TrendingUp} onClick={handleClick} />);

      const card = screen.getByRole("button", { name: /Spacebar KPI: 25/i });
      fireEvent.keyDown(card, { key: " " });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("has cursor-pointer class when clickable", () => {
      const handleClick = vi.fn();
      renderWithAdminContext(<KPICard title="Pointer KPI" value="75" icon={TrendingUp} onClick={handleClick} />);

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
      renderWithAdminContext(<KPICard title="Focusable KPI" value="150" icon={TrendingUp} onClick={handleClick} />);

      const card = screen.getByRole("button", { name: /Focusable KPI: 150/i });
      expect(card).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("variant styling (PRD Section 9.2.1)", () => {
    it("applies warning styling for warning variant", () => {
      renderWithAdminContext(<KPICard title="Stale Deals" value="5" icon={TrendingUp} variant="warning" />);

      // Find the card element (not button since no onClick)
      const card = screen.getByText("Stale Deals").closest('[data-slot="card"]');
      expect(card).toHaveClass("border-warning/50");
      expect(card).toHaveClass("bg-warning/5");
    });

    it("applies success styling for success variant", () => {
      renderWithAdminContext(<KPICard title="Wins" value="10" icon={TrendingUp} variant="success" />);

      const card = screen.getByText("Wins").closest('[data-slot="card"]');
      expect(card).toHaveClass("border-success/50");
      expect(card).toHaveClass("bg-success/5");
    });

    it("applies destructive styling for destructive variant", () => {
      renderWithAdminContext(<KPICard title="Overdue Tasks" value="3" icon={TrendingDown} variant="destructive" />);

      const card = screen.getByText("Overdue Tasks").closest('[data-slot="card"]');
      expect(card).toHaveClass("border-destructive/50");
      expect(card).toHaveClass("bg-destructive/5");
    });

    it("applies default styling when no variant specified", () => {
      renderWithAdminContext(<KPICard title="Default KPI" value="42" icon={TrendingUp} />);

      const card = screen.getByText("Default KPI").closest('[data-slot="card"]');
      // Default variant should NOT have warning/success/destructive classes
      expect(card).not.toHaveClass("border-warning/50");
      expect(card).not.toHaveClass("border-success/50");
      expect(card).not.toHaveClass("border-destructive/50");
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
