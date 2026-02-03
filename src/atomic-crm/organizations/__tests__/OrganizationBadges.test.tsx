/**
 * OrganizationBadges component tests
 *
 * Tests for badge components that display organization metadata:
 * - OrganizationTypeBadge - Organization type with semantic colors
 * - PriorityBadge - Priority level with semantic variants
 * - SegmentBadge - Segment name with UUID-based color mapping
 */

import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { OrganizationTypeBadge, PriorityBadge, SegmentBadge } from "../OrganizationBadges";

describe("OrganizationTypeBadge", () => {
  test("renders customer type with tag-warm color", () => {
    const { container } = render(<OrganizationTypeBadge type="customer" />);

    const badge = container.querySelector(".tag-warm");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Customer");
  });

  test("renders prospect type with tag-sage color", () => {
    const { container } = render(<OrganizationTypeBadge type="prospect" />);

    const badge = container.querySelector(".tag-sage");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Prospect");
  });

  test("renders principal type with tag-purple color", () => {
    const { container } = render(<OrganizationTypeBadge type="principal" />);

    const badge = container.querySelector(".tag-purple");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Principal");
  });

  test("renders distributor type with tag-teal color", () => {
    const { container } = render(<OrganizationTypeBadge type="distributor" />);

    const badge = container.querySelector(".tag-teal");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Distributor");
  });

  test("renders unknown type with default tag-gray color", () => {
    const { container } = render(<OrganizationTypeBadge type="unknown" />);

    const badge = container.querySelector(".tag-gray");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Unknown");
  });
});

describe("PriorityBadge", () => {
  test('renders A priority with "A - High" label', () => {
    const { container } = render(<PriorityBadge priority="A" />);

    expect(container.textContent).toContain("A - High");
  });

  test('renders B priority with "B - Medium-High" label', () => {
    const { container } = render(<PriorityBadge priority="B" />);

    expect(container.textContent).toContain("B - Medium-High");
  });

  test('renders C priority with "C - Medium" label', () => {
    const { container } = render(<PriorityBadge priority="C" />);

    expect(container.textContent).toContain("C - Medium");
  });

  test('renders D priority with "D - Low" label', () => {
    const { container } = render(<PriorityBadge priority="D" />);

    expect(container.textContent).toContain("D - Low");
  });
});

describe("SegmentBadge", () => {
  test("renders playbook segment with correct color by UUID (Major Broadline)", () => {
    const { container } = render(
      <SegmentBadge
        segmentId="22222222-2222-4222-8222-000000000001"
        segmentName="Major Broadline"
      />
    );

    const badge = container.querySelector(".tag-blue");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Major Broadline");
  });

  test("renders playbook segment with correct color by UUID (Specialty/Regional)", () => {
    const { container } = render(
      <SegmentBadge
        segmentId="22222222-2222-4222-8222-000000000002"
        segmentName="Specialty/Regional"
      />
    );

    const badge = container.querySelector(".tag-green");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Specialty/Regional");
  });

  test("renders playbook segment with correct color by UUID (GPO)", () => {
    const { container } = render(
      <SegmentBadge segmentId="22222222-2222-4222-8222-000000000004" segmentName="GPO" />
    );

    const badge = container.querySelector(".tag-amber");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("GPO");
  });

  test("renders operator segment with tag-gray (unknown UUID)", () => {
    const { container } = render(
      <SegmentBadge
        segmentId="33333333-3333-4333-8333-000000000001"
        segmentName="Quick Service Restaurant"
      />
    );

    const badge = container.querySelector(".tag-gray");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Quick Service Restaurant");
  });

  test("renders dash placeholder for null segment", () => {
    const { container } = render(<SegmentBadge segmentId={null} segmentName={null} />);

    expect(container.textContent).toBe("—");
    expect(container.querySelector(".badge")).not.toBeInTheDocument();
  });

  test("renders dash placeholder for undefined segment", () => {
    const { container } = render(<SegmentBadge segmentId={undefined} segmentName={undefined} />);

    expect(container.textContent).toBe("—");
    expect(container.querySelector(".badge")).not.toBeInTheDocument();
  });

  test("renders dash placeholder when segmentName is null but segmentId exists", () => {
    const { container } = render(
      <SegmentBadge segmentId="22222222-2222-4222-8222-000000000001" segmentName={null} />
    );

    expect(container.textContent).toBe("—");
    expect(container.querySelector(".badge")).not.toBeInTheDocument();
  });

  test("renders different playbook colors correctly", () => {
    // Management Company - tag-cocoa
    const { container: container1 } = render(
      <SegmentBadge
        segmentId="22222222-2222-4222-8222-000000000003"
        segmentName="Management Company"
      />
    );
    expect(container1.querySelector(".tag-cocoa")).toBeInTheDocument();

    // University - tag-clay
    const { container: container2 } = render(
      <SegmentBadge segmentId="22222222-2222-4222-8222-000000000005" segmentName="University" />
    );
    expect(container2.querySelector(".tag-clay")).toBeInTheDocument();

    // Restaurant Group - tag-pink
    const { container: container3 } = render(
      <SegmentBadge
        segmentId="22222222-2222-4222-8222-000000000006"
        segmentName="Restaurant Group"
      />
    );
    expect(container3.querySelector(".tag-pink")).toBeInTheDocument();

    // Chain Restaurant - tag-yellow
    const { container: container4 } = render(
      <SegmentBadge
        segmentId="22222222-2222-4222-8222-000000000007"
        segmentName="Chain Restaurant"
      />
    );
    expect(container4.querySelector(".tag-yellow")).toBeInTheDocument();
  });
});
