import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stats } from "./stats";

describe("Stats", () => {
  it("renders each stat value and label", () => {
    render(<Stats items={[{ _id: "1", value: "20+", label: "Years experience" }]} />);
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("Years experience")).toBeInTheDocument();
  });
});
