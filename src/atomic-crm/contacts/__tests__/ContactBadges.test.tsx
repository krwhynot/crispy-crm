/**
 * Tests for ContactBadges components
 *
 * Tests ContactStatusBadge, RoleBadge, InfluenceBadge, and ContactBadgeGroup
 * with focus on edge cases (undefined values, unknown values, numeric conversion)
 *
 * @see ContactBadges.tsx
 */

/* eslint-disable jsx-a11y/aria-role -- RoleBadge uses 'role' as a component prop name, not HTML aria-role */

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactStatusBadge, RoleBadge, InfluenceBadge, ContactBadgeGroup } from "../ContactBadges";

describe("ContactStatusBadge", () => {
  test("renders cold status with tag-blue class", () => {
    render(<ContactStatusBadge status="cold" />);
    const badge = screen.getByText("Cold");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-blue");
  });

  test("renders warm status with tag-amber class", () => {
    render(<ContactStatusBadge status="warm" />);
    const badge = screen.getByText("Warm");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-amber");
  });

  test("renders hot status with tag-pink class", () => {
    render(<ContactStatusBadge status="hot" />);
    const badge = screen.getByText("Hot");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-pink");
  });

  test("renders in-contract status with tag-sage class", () => {
    render(<ContactStatusBadge status="in-contract" />);
    const badge = screen.getByText("Contract");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-sage");
  });

  test("handles undefined status gracefully with placeholder", () => {
    // @ts-expect-error - Testing undefined handling
    render(<ContactStatusBadge status={undefined} />);
    const badge = screen.getByText("--");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });

  test("handles null status gracefully with placeholder", () => {
    // @ts-expect-error - Testing null handling
    render(<ContactStatusBadge status={null} />);
    const badge = screen.getByText("--");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });

  test("handles empty string status gracefully with placeholder", () => {
    render(<ContactStatusBadge status="" />);
    const badge = screen.getByText("--");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });

  test("handles unknown status with title-case fallback", () => {
    render(<ContactStatusBadge status="newstatus" />);
    const badge = screen.getByText("Newstatus");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });
});

describe("RoleBadge", () => {
  test("renders executive role with tag-purple class", () => {
    render(<RoleBadge role="executive" />);
    const badge = screen.getByText("Executive");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-purple");
  });

  test("renders decision_maker role with tag-purple class", () => {
    render(<RoleBadge role="decision_maker" />);
    const badge = screen.getByText("Decision Maker");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-purple");
  });

  test("renders champion role with tag-teal class", () => {
    render(<RoleBadge role="champion" />);
    const badge = screen.getByText("Champion");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-teal");
  });

  test("renders influencer role with tag-warm class", () => {
    render(<RoleBadge role="influencer" />);
    const badge = screen.getByText("Influencer");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-warm");
  });

  test("renders technical role with tag-blue class", () => {
    render(<RoleBadge role="technical" />);
    const badge = screen.getByText("Technical");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-blue");
  });

  test("renders buyer role with tag-sage class", () => {
    render(<RoleBadge role="buyer" />);
    const badge = screen.getByText("Buyer");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-sage");
  });

  test("renders gatekeeper role with tag-amber class", () => {
    render(<RoleBadge role="gatekeeper" />);
    const badge = screen.getByText("Gatekeeper");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-amber");
  });

  test("renders end_user role with tag-gray class", () => {
    render(<RoleBadge role="end_user" />);
    const badge = screen.getByText("End User");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });

  test("handles unknown role with snake_case to title case conversion", () => {
    render(<RoleBadge role="unknown_role_type" />);
    const badge = screen.getByText("Unknown Role Type");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tag-gray");
  });
});

describe("InfluenceBadge", () => {
  test("renders critical level with destructive variant", () => {
    render(<InfluenceBadge influence="critical" />);
    const badge = screen.getByText("Critical");
    expect(badge).toBeInTheDocument();
  });

  test("renders high level with default variant", () => {
    render(<InfluenceBadge influence="high" />);
    const badge = screen.getByText("High");
    expect(badge).toBeInTheDocument();
  });

  test("renders medium level with secondary variant", () => {
    render(<InfluenceBadge influence="medium" />);
    const badge = screen.getByText("Medium");
    expect(badge).toBeInTheDocument();
  });

  test("renders low level with outline variant", () => {
    render(<InfluenceBadge influence="low" />);
    const badge = screen.getByText("Low");
    expect(badge).toBeInTheDocument();
  });

  test("renders minimal level with outline variant", () => {
    render(<InfluenceBadge influence="minimal" />);
    const badge = screen.getByText("Minimal");
    expect(badge).toBeInTheDocument();
  });

  // Numeric conversion tests (1-5 to levels)
  test("converts numeric 5 to critical", () => {
    render(<InfluenceBadge influence={5} />);
    const badge = screen.getByText("Critical");
    expect(badge).toBeInTheDocument();
  });

  test("converts numeric 4 to high", () => {
    render(<InfluenceBadge influence={4} />);
    const badge = screen.getByText("High");
    expect(badge).toBeInTheDocument();
  });

  test("converts numeric 3 to medium", () => {
    render(<InfluenceBadge influence={3} />);
    const badge = screen.getByText("Medium");
    expect(badge).toBeInTheDocument();
  });

  test("converts numeric 2 to low", () => {
    render(<InfluenceBadge influence={2} />);
    const badge = screen.getByText("Low");
    expect(badge).toBeInTheDocument();
  });

  test("converts numeric 1 to minimal", () => {
    render(<InfluenceBadge influence={1} />);
    const badge = screen.getByText("Minimal");
    expect(badge).toBeInTheDocument();
  });

  test("handles out-of-range high number as critical", () => {
    render(<InfluenceBadge influence={10} />);
    const badge = screen.getByText("Critical");
    expect(badge).toBeInTheDocument();
  });

  test("handles zero as minimal", () => {
    render(<InfluenceBadge influence={0} />);
    const badge = screen.getByText("Minimal");
    expect(badge).toBeInTheDocument();
  });
});

describe("ContactBadgeGroup", () => {
  test("renders all badges when all props provided", () => {
    render(<ContactBadgeGroup status="warm" role="champion" influence="high" />);

    expect(screen.getByText("Warm")).toBeInTheDocument();
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  test("renders only provided badges", () => {
    render(<ContactBadgeGroup status="cold" />);

    expect(screen.getByText("Cold")).toBeInTheDocument();
    expect(screen.queryByText("Champion")).not.toBeInTheDocument();
    expect(screen.queryByText("High")).not.toBeInTheDocument();
  });

  test("renders horizontal layout by default", () => {
    const { container } = render(<ContactBadgeGroup status="warm" role="champion" />);

    const group = container.firstChild;
    expect(group).toHaveClass("flex-row");
    expect(group).toHaveClass("gap-2");
  });

  test("renders vertical layout when specified", () => {
    const { container } = render(
      <ContactBadgeGroup status="warm" role="champion" direction="vertical" />
    );

    const group = container.firstChild;
    expect(group).toHaveClass("flex-col");
    expect(group).toHaveClass("gap-1");
  });

  test("handles numeric influence in group", () => {
    render(<ContactBadgeGroup influence={4} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
