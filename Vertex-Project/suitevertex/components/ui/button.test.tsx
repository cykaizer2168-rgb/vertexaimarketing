import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, ButtonLink } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Book intro call</Button>);
    expect(screen.getByRole("button", { name: "Book intro call" })).toBeInTheDocument();
  });
  it("ButtonLink renders an anchor with href", () => {
    render(<ButtonLink href="/pricing">See plans</ButtonLink>);
    const link = screen.getByRole("link", { name: "See plans" });
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
