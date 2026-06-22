import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PricingCards } from "./pricing-cards";

const plans = [
  { _id: "1", name: "Starter", price: "$2,499", cadence: "/mo", features: ["A"] },
  { _id: "2", name: "Growth", price: "$3,999", cadence: "/mo", featured: true, features: ["B"] },
];

describe("PricingCards", () => {
  it("renders plan names and prices", () => {
    render(<PricingCards plans={plans} />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("$3,999")).toBeInTheDocument();
  });
  it("marks the featured plan", () => {
    render(<PricingCards plans={plans} />);
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });
});
