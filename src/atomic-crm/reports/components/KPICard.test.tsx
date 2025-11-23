// src/atomic-crm/reports/components/KPICard.test.tsx
import { render, screen } from "@testing-library/react";
import { KPICard } from "./KPICard";
import { TrendingUp, TrendingDown } from "lucide-react";

describe("KPICard", () => {
  it("renders title and value", () => {
    render(
      <KPICard title="Total Opportunities" value="42" change={15} trend="up" icon={TrendingUp} />
    );

    expect(screen.getByText("Total Opportunities")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows positive trend with green color", () => {
    render(<KPICard title="Revenue" value="$100k" change={25} trend="up" icon={TrendingUp} />);

    const changeElement = screen.getByText("+25%");
    expect(changeElement).toHaveClass("text-success");
  });

  it("shows negative trend with red color", () => {
    render(<KPICard title="Leads" value="10" change={-10} trend="down" icon={TrendingDown} />);

    const changeElement = screen.getByText("-10%");
    expect(changeElement).toHaveClass("text-destructive");
  });
});
